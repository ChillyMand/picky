import test from 'node:test';
import assert from 'node:assert/strict';
import { progressPromptFor } from '../src/progress-prompts.js';

test('the test interrupts the flow only twice', () => {
  const prompts = Array.from({ length: 54 }, (_, index) => progressPromptFor(index + 1)).filter(Boolean);
  assert.equal(prompts.length, 2);
  assert.deepEqual(prompts.map(({ at }) => at), [20, 40]);
  assert.notEqual(prompts[0].title, prompts[1].title);
});
