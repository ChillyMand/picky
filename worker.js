import { scoreTest } from './src/scoring.js';
import { scoreCompatibility } from './src/matching.js';
import { createPublicCode, isPublicCode, normalizePublicCode } from './src/codes.js';

const choices = new Set(['love', 'okay', 'refuse', 'unknown']);
const json = (payload, status = 200) => Response.json(payload, { status, headers: { 'cache-control': 'no-store' } });
async function inputJson(request) { try { return await request.json(); } catch { return {}; } }
function sessionFrom(row) { return row ? JSON.parse(row.data) : null; }
async function byId(db, id) { return sessionFrom(await db.prepare('SELECT data FROM sessions WHERE id = ?').bind(id).first()); }
async function byCode(db, code) { return sessionFrom(await db.prepare('SELECT data FROM sessions WHERE public_code = ?').bind(normalizePublicCode(code)).first()); }
async function saveSession(db, session) {
  await db.prepare('UPDATE sessions SET public_code = ?, pair_code = ?, status = ?, updated_at = ?, completed_at = ?, data = ? WHERE id = ?').bind(session.publicCode, session.pairCode, session.status, session.updatedAt, session.completedAt, JSON.stringify(session), session.id).run();
}
async function uniqueCode(db) {
  for (let tries = 0; tries < 20; tries += 1) { const code = createPublicCode(); if (!(await byCode(db, code))) return code; }
  throw new Error('无法生成配对码');
}
async function createSession(request, env) {
  const input = await inputJson(request); const pairCode = normalizePublicCode(input.pairCode);
  if (pairCode && (!isPublicCode(pairCode) || !(await byCode(env.DB, pairCode)))) return json({ error: '配对码不存在' }, 400);
  const now = new Date().toISOString();
  const session = { id: crypto.randomUUID(), publicCode: await uniqueCode(env.DB), pairCode: pairCode || null, status: 'in_progress', startedAt: now, updatedAt: now, completedAt: null, answers: [], result: null };
  await env.DB.prepare('INSERT INTO sessions (id, public_code, pair_code, status, started_at, updated_at, completed_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(session.id, session.publicCode, session.pairCode, session.status, now, now, null, JSON.stringify(session)).run();
  return json(session, 201);
}
async function saveAnswer(request, env, sessionId, foodId) {
  const input = await inputJson(request); if (!choices.has(input.choice)) return json({ error: '无效选择' }, 400);
  const session = await byId(env.DB, sessionId); if (!session) return json({ error: '测试不存在' }, 404);
  const answer = { foodId, choice: input.choice }; const existing = session.answers.find((item) => item.foodId === foodId);
  if (existing) Object.assign(existing, answer); else session.answers.push(answer);
  session.updatedAt = new Date().toISOString(); await saveSession(env.DB, session); return new Response(null, { status: 204 });
}
async function completeSession(env, id) {
  const session = await byId(env.DB, id); if (!session) return json({ error: '测试不存在' }, 404);
  const result = scoreTest(session.answers); const now = new Date().toISOString(); Object.assign(session, { status: 'completed', result, completedAt: now, updatedAt: now }); await saveSession(env.DB, session);
  let match = null;
  if (session.pairCode) { const host = await byCode(env.DB, session.pairCode); if (host?.status === 'completed') match = { hostCode: host.publicCode, guestCode: session.publicCode, ...scoreCompatibility(host.answers, session.answers) }; }
  return json({ result, match });
}
async function pairReport(env, code) {
  const host = await byCode(env.DB, code); if (!host) return null;
  const guestRow = await env.DB.prepare("SELECT data FROM sessions WHERE pair_code = ? AND status = 'completed' ORDER BY completed_at DESC LIMIT 1").bind(host.publicCode).first(); const guest = sessionFrom(guestRow);
  return guest && host.status === 'completed' ? { hostCode: host.publicCode, guestCode: guest.publicCode, ...scoreCompatibility(host.answers, guest.answers) } : { hostCode: host.publicCode, waiting: true };
}
async function directMatch(env, url) {
  const firstCode = normalizePublicCode(url.searchParams.get('first')); const secondCode = normalizePublicCode(url.searchParams.get('second'));
  if (!isPublicCode(firstCode) || !isPublicCode(secondCode) || firstCode === secondCode) return json({ error: '请输入两个不同的完整配对码' }, 400);
  const first = await byCode(env.DB, firstCode); const second = await byCode(env.DB, secondCode);
  if (!first || !second) return json({ error: '没有找到对应的配对码' }, 404);
  if (first.status !== 'completed' || second.status !== 'completed') return json({ error: '其中一位还没有完成测试' }, 409);
  return json({ firstCode, secondCode, ...scoreCompatibility(first.answers, second.answers) });
}
async function assets(request, env) { return env.ASSETS.fetch(request); }

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url); const path = url.pathname; let match;
      if (request.method === 'POST' && path === '/api/sessions') return createSession(request, env);
      if (request.method === 'PUT' && (match = path.match(/^\/api\/sessions\/([^/]+)\/answers\/([^/]+)$/))) return saveAnswer(request, env, match[1], match[2]);
      if (request.method === 'POST' && (match = path.match(/^\/api\/sessions\/([^/]+)\/complete$/))) return completeSession(env, match[1]);
      if (request.method === 'GET' && (match = path.match(/^\/api\/pairs\/([^/]+)$/))) { const report = await pairReport(env, match[1]); return report ? json(report) : json({ error: '配对码不存在' }, 404); }
      if (request.method === 'GET' && path === '/api/matches') return directMatch(env, url);
      if (path.startsWith('/api/')) return json({ error: '未找到' }, 404);
      return assets(request, env);
    } catch (error) { console.error(error); return json({ error: '暂时出了点问题，请稍后再试' }, 500); }
  },
};
