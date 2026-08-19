import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldLockPageScroll } from '../src/screen-mode.js';

test('page scrolling is locked only while answering questions', () => {
  assert.equal(shouldLockPageScroll('question-screen'), true);
  for (const screen of ['intro-screen', 'feedback-screen', 'loading-screen', 'result-screen']) {
    assert.equal(shouldLockPageScroll(screen), false);
  }
});
