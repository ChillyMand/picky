import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createArchiveRepository } from '../src/archive.js';

test('archive creates a minimal session, upserts answers, and completes it', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'picky-archive-'));
  const file = join(dir, 'tests.json');
  const repo = createArchiveRepository(file);
  const session = await repo.createSession({ visitorId: 'visitor-1', ip: '203.0.113.8', userAgent: 'Test Browser' });
  assert.match(session.publicCode, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
  for (const field of ['visitorId', 'userId', 'ip', 'userAgent', 'device', 'viewport', 'language', 'timezone', 'referrer']) assert.equal(field in session, false, field);
  await repo.upsertAnswer(session.id, { foodId: 'pork', choice: 'love', order: 1, kind: 'initial', durationMs: 800 });
  await repo.upsertAnswer(session.id, { foodId: 'pork', choice: 'okay', order: 1, kind: 'initial', durationMs: 1100 });
  await repo.completeSession(session.id, { pickyScore: 12, personality: { id: 'omnivore', name: '万物吞吞兽' } });
  const detail = await repo.getSession(session.id);
  assert.equal(detail.answers.length, 1);
  assert.equal(detail.answers[0].choice, 'okay');
  assert.deepEqual(Object.keys(detail.answers[0]).sort(), ['choice', 'foodId']);
  assert.equal(detail.status, 'completed');
  assert.equal((await repo.getSessionByPublicCode(session.publicCode)).id, session.id);
  const raw = await readFile(file, 'utf8');
  assert.doesNotThrow(() => JSON.parse(raw));
});

test('archive serializes concurrent answer writes without losing records', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'picky-archive-'));
  const repo = createArchiveRepository(join(dir, 'tests.json'));
  const session = await repo.createSession({ visitorId: 'visitor-2' });
  await Promise.all(['pork', 'egg', 'fish', 'shrimp'].map((foodId, order) => repo.upsertAnswer(session.id, { foodId, choice: 'okay', order, kind: 'initial' })));
  assert.equal((await repo.getSession(session.id)).answers.length, 4);
});
