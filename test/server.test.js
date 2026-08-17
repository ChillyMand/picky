import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppServer } from '../server.mjs';

async function start() {
  const dir = await mkdtemp(join(tmpdir(), 'picky-server-'));
  const app = createAppServer({ archivePath: join(dir, 'tests.json'), publicDir: join(process.cwd(), 'picky-test/public') });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  return { app, base: `http://127.0.0.1:${app.address().port}` };
}

test('API archives trusted IP, device metadata, answers, and server-calculated result', async (t) => {
  const { app, base } = await start();
  t.after(() => app.close());
  const created = await fetch(`${base}/api/sessions`, { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.24', 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1' }, body: JSON.stringify({ visitorId: 'v-1', viewport: { width: 390, height: 844 }, language: 'zh-CN', timezone: 'Asia/Shanghai' }) });
  assert.equal(created.status, 201);
  const session = await created.json();
  for (const [order, foodId] of ['pork', 'egg', 'fish', 'shrimp'].entries()) {
    const answer = await fetch(`${base}/api/sessions/${session.id}/answers/${foodId}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ choice: 'love', order: order + 1, kind: 'initial' }) });
    assert.equal(answer.status, 204);
  }
  const completed = await fetch(`${base}/api/sessions/${session.id}/complete`, { method: 'POST' });
  assert.equal(completed.status, 200);
  assert.equal((await completed.json()).result.personality.id, 'omnivore');
  const detail = await fetch(`${base}/api/admin/sessions/${session.id}`).then((response) => response.json());
  assert.equal(detail.ip, '198.51.100.24');
  assert.equal(detail.device.type, 'mobile');
  assert.equal(detail.device.browser, 'Safari');
  assert.equal(detail.answers.length, 4);
});

test('API rejects invalid choices with a 400 response', async (t) => {
  const { app, base } = await start();
  t.after(() => app.close());
  const session = await fetch(`${base}/api/sessions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ visitorId: 'v-2' }) }).then((response) => response.json());
  const response = await fetch(`${base}/api/sessions/${session.id}/answers/pork`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ choice: 'maybe' }) });
  assert.equal(response.status, 400);
});

test('a second test can join the first public code and produce a compatibility report', async (t) => {
  const { app, base } = await start(); t.after(() => app.close());
  async function create(visitorId, pairCode) {
    return fetch(`${base}/api/sessions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ visitorId, pairCode }) }).then((response) => response.json());
  }
  async function answer(session, foodId, choice, order) {
    await fetch(`${base}/api/sessions/${session.id}/answers/${foodId}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ choice, order, kind: 'initial' }) });
  }
  const first = await create('pair-a');
  assert.match(first.publicCode, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/);
  await answer(first, 'pork', 'love', 1); await answer(first, 'fish', 'refuse', 2);
  await fetch(`${base}/api/sessions/${first.id}/complete`, { method: 'POST' });
  const second = await create('pair-b', first.publicCode);
  assert.equal(second.pairCode, first.publicCode);
  await answer(second, 'pork', 'love', 1); await answer(second, 'fish', 'love', 2);
  const completed = await fetch(`${base}/api/sessions/${second.id}/complete`, { method: 'POST' }).then((response) => response.json());
  assert.equal(completed.match.hostCode, first.publicCode);
  assert.ok(completed.match.score > 0);
  const publicMatch = await fetch(`${base}/api/pairs/${first.publicCode}`).then((response) => response.json());
  assert.equal(publicMatch.guestCode, second.publicCode);
  const directMatch = await fetch(`${base}/api/matches?first=${first.publicCode}&second=${second.publicCode}`).then((response) => response.json());
  assert.equal(directMatch.firstCode, first.publicCode);
  assert.equal(directMatch.secondCode, second.publicCode);
  assert.ok(directMatch.score > 0);
  const archivedMatches = await fetch(`${base}/api/admin/matches`).then((response) => response.json());
  assert.equal(archivedMatches.total, 1);
  assert.equal(archivedMatches.items[0].viewCount, 2);
});
