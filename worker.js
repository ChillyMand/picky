import { scoreTest } from './src/scoring.js';
import { scoreCompatibility } from './src/matching.js';
import { parseDevice } from './src/device.js';
import { createPublicCode, isPublicCode, normalizePublicCode } from './src/codes.js';
import { withEffectiveSessionStatus } from './src/session-status.js';

const choices = new Set(['love', 'okay', 'refuse', 'unknown']);
const json = (payload, status = 200) => Response.json(payload, { status, headers: { 'cache-control': 'no-store' } });
const clientIp = (request) => String(request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
async function inputJson(request) { try { return await request.json(); } catch { return {}; } }
function sessionFrom(row) { return row ? JSON.parse(row.data) : null; }
function matchFrom(row) { return row ? JSON.parse(row.data) : null; }
async function byId(db, id) { return sessionFrom(await db.prepare('SELECT data FROM sessions WHERE id = ?').bind(id).first()); }
async function byCode(db, code) { return sessionFrom(await db.prepare('SELECT data FROM sessions WHERE public_code = ?').bind(normalizePublicCode(code)).first()); }
async function saveSession(db, session) {
  await db.prepare('UPDATE sessions SET public_code = ?, pair_code = ?, status = ?, updated_at = ?, completed_at = ?, data = ? WHERE id = ?').bind(session.publicCode, session.pairCode, session.status, session.updatedAt, session.completedAt, JSON.stringify(session), session.id).run();
}
async function uniqueCode(db) {
  for (let tries = 0; tries < 20; tries += 1) { const code = createPublicCode(); if (!(await byCode(db, code))) return code; }
  throw new Error('无法生成测试码');
}
function pairKey(a, b) { return [a, b].sort().join(':'); }
async function recordMatch(db, request, report, source) {
  const key = pairKey(report.firstCode || report.hostCode, report.secondCode || report.guestCode);
  const row = await db.prepare('SELECT data FROM matches WHERE pair_key = ?').bind(key).first(); const now = new Date().toISOString();
  if (row) { const saved = matchFrom(row); saved.lastViewedAt = now; saved.viewCount = (saved.viewCount || 1) + 1; await db.prepare('UPDATE matches SET last_viewed_at = ?, data = ? WHERE id = ?').bind(now, JSON.stringify(saved), saved.id).run(); return saved; }
  const firstCode = report.firstCode || report.hostCode; const secondCode = report.secondCode || report.guestCode;
  const first = await byCode(db, firstCode); const second = await byCode(db, secondCode); const userAgent = String(request.headers.get('user-agent') || '');
  const saved = { id: crypto.randomUUID(), firstCode, secondCode, firstSessionId: first?.id || null, secondSessionId: second?.id || null, score: report.score, verdict: report.verdict, overlapCount: report.overlapCount, sharedLikeIds: report.sharedLikes.map((food) => food.id), sharedAvoidIds: report.sharedAvoids.map((food) => food.id), conflictIds: report.conflicts.map((food) => food.id), source, ip: clientIp(request), userAgent, device: parseDevice(userAgent), createdAt: now, lastViewedAt: now, viewCount: 1 };
  await db.prepare('INSERT INTO matches (id, pair_key, first_code, second_code, created_at, last_viewed_at, data) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(saved.id, key, firstCode, secondCode, now, now, JSON.stringify(saved)).run(); return saved;
}
async function createSession(request, env) {
  const input = await inputJson(request); const pairCode = normalizePublicCode(input.pairCode);
  if (pairCode && (!isPublicCode(pairCode) || !(await byCode(env.DB, pairCode)))) return json({ error: '配对码不存在' }, 400);
  const now = new Date().toISOString(); const userAgent = String(request.headers.get('user-agent') || '');
  const session = { id: crypto.randomUUID(), publicCode: await uniqueCode(env.DB), pairCode: pairCode || null, visitorId: input.visitorId || crypto.randomUUID(), userId: null, ip: clientIp(request), userAgent, device: parseDevice(userAgent), viewport: input.viewport || {}, language: input.language || '', timezone: input.timezone || '', referrer: input.referrer || '', status: 'in_progress', startedAt: now, updatedAt: now, completedAt: null, answers: [], result: null };
  await env.DB.prepare('INSERT INTO sessions (id, public_code, pair_code, status, started_at, updated_at, completed_at, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(session.id, session.publicCode, session.pairCode, session.status, now, now, null, JSON.stringify(session)).run();
  return json(session, 201);
}
async function saveAnswer(request, env, sessionId, foodId) {
  const input = await inputJson(request); if (!choices.has(input.choice)) return json({ error: '无效选择' }, 400);
  const session = await byId(env.DB, sessionId); if (!session) return json({ error: '记录不存在' }, 404);
  const now = new Date().toISOString(); const answer = { foodId, choice: input.choice, order: Number(input.order || 0), kind: input.kind || 'adaptive', durationMs: Number(input.durationMs || 0) }; const existing = session.answers.find((item) => item.foodId === foodId);
  if (existing) Object.assign(existing, answer, { modifiedCount: (existing.modifiedCount || 0) + (existing.choice === answer.choice ? 0 : 1), updatedAt: now }); else session.answers.push({ ...answer, modifiedCount: 0, answeredAt: now, updatedAt: now });
  session.updatedAt = now; await saveSession(env.DB, session); return new Response(null, { status: 204 });
}
async function completeSession(request, env, id) {
  const session = await byId(env.DB, id); if (!session) return json({ error: '记录不存在' }, 404);
  const result = scoreTest(session.answers); const now = new Date().toISOString(); Object.assign(session, { status: 'completed', result, completedAt: now, updatedAt: now }); await saveSession(env.DB, session);
  let match = null; if (session.pairCode) { const host = await byCode(env.DB, session.pairCode); if (host?.status === 'completed') { match = { hostCode: host.publicCode, guestCode: session.publicCode, ...scoreCompatibility(host.answers, session.answers) }; await recordMatch(env.DB, request, match, 'invitation'); } }
  return json({ result, match });
}
async function pairReport(env, code) {
  const host = await byCode(env.DB, code); if (!host) return null;
  const guestRow = await env.DB.prepare("SELECT data FROM sessions WHERE pair_code = ? AND status = 'completed' ORDER BY completed_at DESC LIMIT 1").bind(host.publicCode).first(); const guest = sessionFrom(guestRow);
  return guest && host.status === 'completed' ? { hostCode: host.publicCode, guestCode: guest.publicCode, ...scoreCompatibility(host.answers, guest.answers) } : { hostCode: host.publicCode, waiting: true };
}
async function directMatch(request, env, url) {
  const firstCode = normalizePublicCode(url.searchParams.get('first')); const secondCode = normalizePublicCode(url.searchParams.get('second'));
  if (!isPublicCode(firstCode) || !isPublicCode(secondCode) || firstCode === secondCode) return json({ error: '请输入两个不同的完整测试码' }, 400);
  const first = await byCode(env.DB, firstCode); const second = await byCode(env.DB, secondCode); if (!first || !second) return json({ error: '没有找到对应的测试码' }, 404); if (first.status !== 'completed' || second.status !== 'completed') return json({ error: '其中一份测试尚未完成' }, 409);
  const report = { firstCode, secondCode, ...scoreCompatibility(first.answers, second.answers) }; await recordMatch(env.DB, request, report, 'direct'); return json(report);
}
async function listSessions(env, url) {
  const result = await env.DB.prepare('SELECT data FROM sessions ORDER BY started_at DESC LIMIT 500').all(); let items = result.results.map(sessionFrom).map((item) => withEffectiveSessionStatus(item)); const status = url.searchParams.get('status'); const query = (url.searchParams.get('q') || '').toLowerCase();
  if (status) items = items.filter((item) => item.status === status); if (query) items = items.filter((item) => [item.id, item.publicCode, item.pairCode, item.visitorId, item.userId, item.ip].some((value) => String(value || '').toLowerCase().includes(query)));
  const page = Math.max(1, Number(url.searchParams.get('page') || 1)); const pageSize = Math.min(100, Number(url.searchParams.get('pageSize') || 50)); return json({ items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize });
}
async function listMatches(env, url) {
  const result = await env.DB.prepare('SELECT data FROM matches ORDER BY created_at DESC LIMIT 500').all(); let items = result.results.map(matchFrom); const query = (url.searchParams.get('q') || '').toLowerCase(); if (query) items = items.filter((item) => [item.id, item.firstCode, item.secondCode, item.ip].some((value) => String(value || '').toLowerCase().includes(query))); return json({ items, total: items.length, page: 1, pageSize: 500 });
}
async function summary(env) {
  const result = await env.DB.prepare('SELECT data FROM sessions').all(); const sessions = result.results.map(sessionFrom).map((item) => withEffectiveSessionStatus(item)); const completed = sessions.filter((item) => item.status === 'completed'); const abandoned = sessions.filter((item) => item.status === 'abandoned'); const matches = await env.DB.prepare('SELECT COUNT(*) AS count FROM matches').first(); const answerCounts = { love: 0, okay: 0, refuse: 0, unknown: 0 }; sessions.flatMap((item) => item.answers).forEach(({ choice }) => { if (choice in answerCounts) answerCounts[choice] += 1; }); const personalityCounts = {}; completed.forEach(({ result: score }) => { const name = score?.personality?.name || '未知'; personalityCounts[name] = (personalityCounts[name] || 0) + 1; }); const durations = completed.map((item) => new Date(item.completedAt) - new Date(item.startedAt)).filter((value) => value >= 0); return json({ started: sessions.length, completed: completed.length, abandoned: abandoned.length, inProgress: sessions.length - completed.length - abandoned.length, matches: Number(matches?.count || 0), completionRate: sessions.length ? completed.length / sessions.length : 0, averageQuestions: completed.length ? completed.reduce((sum, item) => sum + item.answers.length, 0) / completed.length : 0, averageDurationMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0, answerCounts, personalityCounts });
}
async function assets(request, env) { return env.ASSETS.fetch(request); }

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url); const path = url.pathname; let match;
      if (request.method === 'POST' && path === '/api/sessions') return createSession(request, env);
      if (request.method === 'PUT' && (match = path.match(/^\/api\/sessions\/([^/]+)\/answers\/([^/]+)$/))) return saveAnswer(request, env, match[1], match[2]);
      if (request.method === 'POST' && (match = path.match(/^\/api\/sessions\/([^/]+)\/complete$/))) return completeSession(request, env, match[1]);
      if (request.method === 'GET' && (match = path.match(/^\/api\/sessions\/([^/]+)\/public-code$/))) { const session = await byId(env.DB, match[1]); return session ? json({ publicCode: session.publicCode }) : json({ error: '记录不存在' }, 404); }
      if (request.method === 'GET' && (match = path.match(/^\/api\/pairs\/([^/]+)$/))) { const report = await pairReport(env, match[1]); return report ? json(report) : json({ error: '配对码不存在' }, 404); }
      if (request.method === 'GET' && path === '/api/matches') return directMatch(request, env, url);
      if (request.method === 'GET' && path === '/api/admin/summary') return summary(env);
      if (request.method === 'GET' && path === '/api/admin/sessions') return listSessions(env, url);
      if (request.method === 'GET' && path === '/api/admin/matches') return listMatches(env, url);
      if (request.method === 'GET' && (match = path.match(/^\/api\/admin\/sessions\/([^/]+)$/))) { const session = await byId(env.DB, match[1]); return session ? json(withEffectiveSessionStatus(session)) : json({ error: '记录不存在' }, 404); }
      if (path.startsWith('/api/')) return json({ error: '未找到' }, 404);
      return assets(request, env, url);
    } catch (error) { console.error(error); return json({ error: '服务器异常' }, 500); }
  },
};
