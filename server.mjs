import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createArchiveRepository } from './src/archive.js';
import { parseDevice } from './src/device.js';
import { scoreTest } from './src/scoring.js';
import { normalizePublicCode, isPublicCode } from './src/codes.js';
import { withEffectiveSessionStatus } from './src/session-status.js';
import { scoreCompatibility } from './src/matching.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const choices = new Set(['love', 'okay', 'refuse', 'unknown']);

function json(response, status, payload) { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(JSON.stringify(payload)); }
async function body(request) { const chunks = []; let size = 0; for await (const chunk of request) { size += chunk.length; if (size > 100_000) throw Object.assign(new Error('Request too large'), { statusCode: 413 }); chunks.push(chunk); } if (!chunks.length) return {}; try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(new Error('Invalid JSON'), { statusCode: 400 }); } }
function clientIp(request) { return String(request.headers['cf-connecting-ip'] || request.headers['x-forwarded-for'] || request.socket.remoteAddress || '').split(',')[0].trim(); }

export function createAppServer({ archivePath = join(here, 'data/tests.json'), publicDir = join(here, 'public') } = {}) {
  const repo = createArchiveRepository(archivePath);
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'POST' && url.pathname === '/api/sessions') {
        const input = await body(request); const userAgent = String(request.headers['user-agent'] || '');
        if (input.pairCode) { input.pairCode = normalizePublicCode(input.pairCode); if (!isPublicCode(input.pairCode) || !(await repo.getSessionByPublicCode(input.pairCode))) return json(response, 400, { error: '配对码不存在' }); }
        const session = await repo.createSession({ ...input, ip: clientIp(request), userAgent, device: parseDevice(userAgent) }); return json(response, 201, session);
      }
      let match = url.pathname.match(/^\/api\/sessions\/([^/]+)\/answers\/([^/]+)$/);
      if (request.method === 'PUT' && match) {
        const input = await body(request); if (!choices.has(input.choice)) return json(response, 400, { error: '无效选择' });
        await repo.upsertAnswer(match[1], { foodId: match[2], choice: input.choice, order: Number(input.order || 0), kind: input.kind || 'adaptive', durationMs: Number(input.durationMs || 0) }); response.writeHead(204); return response.end();
      }
      match = url.pathname.match(/^\/api\/sessions\/([^/]+)\/complete$/);
      if (request.method === 'POST' && match) { const session = await repo.getSession(match[1]); if (!session) return json(response, 404, { error: '记录不存在' }); const result = scoreTest(session.answers); await repo.completeSession(match[1], result); let pairMatch = null; if (session.pairCode) { const host = await repo.getSessionByPublicCode(session.pairCode); if (host?.status === 'completed') { pairMatch = { hostCode: host.publicCode, guestCode: session.publicCode, ...scoreCompatibility(host.answers, session.answers) }; await repo.recordMatch({ firstCode: host.publicCode, secondCode: session.publicCode, ...pairMatch, source: 'invitation', ip: clientIp(request), userAgent: String(request.headers['user-agent'] || ''), device: parseDevice(String(request.headers['user-agent'] || '')) }); } } return json(response, 200, { result, match: pairMatch }); }
      match = url.pathname.match(/^\/api\/sessions\/([^/]+)\/public-code$/);
      if (request.method === 'GET' && match) { const session = await repo.ensurePublicCode(match[1]); return json(response, 200, { publicCode: session.publicCode }); }
      match = url.pathname.match(/^\/api\/pairs\/([^/]+)$/);
      if (request.method === 'GET' && match) { const pair = await repo.getPairByHostCode(match[1]); if (!pair) return json(response, 404, { error: '配对码不存在' }); const report = pair.guest && pair.host.status === 'completed' ? { hostCode: pair.host.publicCode, guestCode: pair.guest.publicCode, ...scoreCompatibility(pair.host.answers, pair.guest.answers) } : null; return json(response, 200, report || { hostCode: pair.host.publicCode, waiting: true }); }
      if (request.method === 'GET' && url.pathname === '/api/matches') {
        const firstCode = normalizePublicCode(url.searchParams.get('first')); const secondCode = normalizePublicCode(url.searchParams.get('second'));
        if (!isPublicCode(firstCode) || !isPublicCode(secondCode) || firstCode === secondCode) return json(response, 400, { error: '请输入两个不同的完整测试码' });
        const first = await repo.getSessionByPublicCode(firstCode); const second = await repo.getSessionByPublicCode(secondCode);
        if (!first || !second) return json(response, 404, { error: '没有找到对应的测试码' });
        if (first.status !== 'completed' || second.status !== 'completed') return json(response, 409, { error: '其中一份测试尚未完成' });
        const report = { firstCode, secondCode, ...scoreCompatibility(first.answers, second.answers) };
        await repo.recordMatch({ ...report, source: 'direct', ip: clientIp(request), userAgent: String(request.headers['user-agent'] || ''), device: parseDevice(String(request.headers['user-agent'] || '')) });
        return json(response, 200, report);
      }
      if (request.method === 'GET' && url.pathname === '/api/admin/summary') return json(response, 200, await repo.summary());
      if (request.method === 'GET' && url.pathname === '/api/admin/sessions') return json(response, 200, await repo.listSessions({ status: url.searchParams.get('status') || undefined, personality: url.searchParams.get('personality') || undefined, query: url.searchParams.get('q') || '', page: Number(url.searchParams.get('page') || 1), pageSize: Math.min(100, Number(url.searchParams.get('pageSize') || 50)) }));
      if (request.method === 'GET' && url.pathname === '/api/admin/matches') return json(response, 200, await repo.listMatches({ query: url.searchParams.get('q') || '', page: Number(url.searchParams.get('page') || 1), pageSize: Math.min(100, Number(url.searchParams.get('pageSize') || 50)) }));
      match = url.pathname.match(/^\/api\/admin\/sessions\/([^/]+)$/);
      if (request.method === 'GET' && match) { const session = await repo.getSession(match[1]); return session ? json(response, 200, withEffectiveSessionStatus(session)) : json(response, 404, { error: '记录不存在' }); }
      if (request.method !== 'GET' && request.method !== 'HEAD') return json(response, 404, { error: '未找到' });
      let pathname = decodeURIComponent(url.pathname); if (pathname === '/') pathname = '/index.html'; if (pathname === '/admin' || pathname === '/admin/') pathname = '/admin/index.html';
      const moduleRequest = pathname.startsWith('/modules/');
      const staticRoot = moduleRequest ? join(here, 'src') : publicDir;
      if (moduleRequest) pathname = pathname.slice('/modules'.length);
      const filePath = normalize(join(staticRoot, pathname)); if (relative(staticRoot, filePath).startsWith('..')) return json(response, 403, { error: '禁止访问' });
      try { const content = await readFile(filePath); response.writeHead(200, { 'content-type': MIME[extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-cache' }); response.end(request.method === 'HEAD' ? undefined : content); }
      catch { json(response, 404, { error: '未找到' }); }
    } catch (error) { json(response, error.statusCode || 500, { error: error.statusCode ? error.message : '服务器异常' }); }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PICKY_PORT || 4173);
  createAppServer().listen(port, '127.0.0.1', () => console.log(`Picky test running at http://127.0.0.1:${port}/\nAdmin: http://127.0.0.1:${port}/admin/`));
}
