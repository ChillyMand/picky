import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisitorId, clearProgress, copyText } from '../src/browser-compat.js';

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

test('copy text falls back when clipboard API is unavailable', async () => {
  let copied = false; let removed = false;
  const textarea = { value: '', style: {}, setAttribute() {}, select() {}, remove() { removed = true; } };
  const documentApi = { createElement: () => textarea, body: { append() {} }, execCommand(command) { copied = command === 'copy'; return copied; } };
  assert.equal(await copyText('饭桌邀请', null, documentApi), true);
  assert.equal(textarea.value, '饭桌邀请');
  assert.equal(copied, true);
  assert.equal(removed, true);
});
