import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateTime } from '../src/format.js';

test('admin timestamps include four-digit year, month, day, and time', () => {
  const value = formatDateTime('2026-08-17T14:18:23.000Z', 'UTC');
  assert.equal(value, '2026-08-17 14:18:23');
});

test('empty timestamps use a visible fallback', () => {
  assert.equal(formatDateTime(null), '--');
});
