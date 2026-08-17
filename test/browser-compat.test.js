import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisitorId, clearProgress } from '../src/browser-compat.js';

test('visitor id works when WeChat webview has no crypto.randomUUID', () => {
  const saved = new Map();
  const storage = { getItem: (key) => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) };
  const id = createVisitorId(storage, {}, () => 1723910400000, () => 0.25);
  assert.match(id, /^visitor-/);
  assert.equal(saved.get('picky-visitor-id'), id);
});

test('visitor id still works when WeChat privacy mode blocks storage', () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.doesNotThrow(() => createVisitorId(storage, {}, () => 1723910400000, () => 0.5));
});

test('opening the site can clear progress even when storage is blocked', () => {
  const storage = { removeItem() { throw new Error('blocked'); } };
  assert.doesNotThrow(() => clearProgress(storage, 'progress'));
});
