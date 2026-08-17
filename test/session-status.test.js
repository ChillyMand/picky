import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveSessionStatus, withEffectiveSessionStatus } from '../src/session-status.js';

const now = Date.parse('2026-08-18T12:05:00.000Z');

test('unfinished sessions become abandoned at exactly five minutes', () => {
  assert.equal(effectiveSessionStatus({ status: 'in_progress', updatedAt: '2026-08-18T12:00:00.001Z' }, now), 'in_progress');
  assert.equal(effectiveSessionStatus({ status: 'in_progress', updatedAt: '2026-08-18T12:00:00.000Z' }, now), 'abandoned');
});

test('completed sessions never become abandoned', () => {
  assert.equal(effectiveSessionStatus({ status: 'completed', updatedAt: '2020-01-01T00:00:00.000Z' }, now), 'completed');
});

test('derived status does not mutate archived data', () => {
  const session = { status: 'in_progress', startedAt: '2026-08-18T11:00:00.000Z' };
  const derived = withEffectiveSessionStatus(session, now);
  assert.equal(derived.status, 'abandoned');
  assert.equal(session.status, 'in_progress');
});
