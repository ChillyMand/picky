export const ANSWER_FEEDBACK_MS = 320;

export function answerFeedbackState(selectedValue, choiceValues) {
  return Object.fromEntries(choiceValues.map((value) => [value, {
    selected: value === selectedValue,
    dimmed: value !== selectedValue,
    disabled: true,
  }]));
}
