import test from 'node:test';
import assert from 'node:assert/strict';
import { clearProgress, copyText } from '../src/browser-compat.js';

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
