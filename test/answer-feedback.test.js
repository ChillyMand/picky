import test from 'node:test';
import assert from 'node:assert/strict';
import { ANSWER_FEEDBACK_MS, answerFeedbackState } from '../src/answer-feedback.js';

test('a mobile answer remains visibly selected before the question advances', () => {
  const state = answerFeedbackState('okay', ['love', 'okay', 'refuse', 'unknown']);
  assert.deepEqual(state, {
    love: { selected: false, dimmed: true, disabled: true },
    okay: { selected: true, dimmed: false, disabled: true },
    refuse: { selected: false, dimmed: true, disabled: true },
    unknown: { selected: false, dimmed: true, disabled: true },
  });
  assert.ok(ANSWER_FEEDBACK_MS >= 300 && ANSWER_FEEDBACK_MS <= 360);
});
