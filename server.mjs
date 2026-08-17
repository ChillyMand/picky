import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createArchiveRepository } from './src/archive.js';
import { parseDevice } from './src/device.js';
import { scoreTest } from './src/scoring.js';

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
        const session = await repo.createSession({ ...input, ip: clientIp(request), userAgent, device: parseDevice(userAgent) }); return json(response, 201, session);
      }
      let match = url.pathname.match(/^\/api\/sessions\/([^/]+)\/answers\/([^/]+)$/);
      if (request.method === 'PUT' && match) {
        const input = await body(request); if (!choices.has(input.choice)) return json(response, 400, { error: '无效选择' });
        await repo.upsertAnswer(match[1], { foodId: match[2], choice: input.choice, order: Number(input.order || 0), kind: input.kind || 'adaptive', durationMs: Number(input.durationMs || 0) }); response.writeHead(204); return response.end();
      }
      match = url.pathname.match(/^\/api\/sessions\/([^/]+)\/complete$/);
      if (request.method === 'POST' && match) { const session = await repo.getSession(match[1]); if (!session) return json(response, 404, { error: '记录不存在' }); const result = scoreTest(session.answers); await repo.completeSession(match[1], result); return json(response, 200, { result }); }
      if (request.method === 'GET' && url.pathname === '/api/admin/summary') return json(response, 200, await repo.summary());
      if (request.method === 'GET' && url.pathname === '/api/admin/sessions') return json(response, 200, await repo.listSessions({ status: url.searchParams.get('status') || undefined, personality: url.searchParams.get('personality') || undefined, query: url.searchParams.get('q') || '', page: Number(url.searchParams.get('page') || 1), pageSize: Math.min(100, Number(url.searchParams.get('pageSize') || 50)) }));
      match = url.pathname.match(/^\/api\/admin\/sessions\/([^/]+)$/);
      if (request.method === 'GET' && match) { const session = await repo.getSession(match[1]); return session ? json(response, 200, session) : json(response, 404, { error: '记录不存在' }); }
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
