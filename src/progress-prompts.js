const PROGRESS_PROMPTS = new Map([
  [20, { at: 20, title: '你的饭桌边界，已经摸到一点了。', detail: '接下来看看口感和气味会不会改变判断。' }],
  [40, { at: 40, title: '饭桌人格基本成形。', detail: '最后一小段，确认你的隐藏雷区。' }],
]);

export function progressPromptFor(answerCount) {
  return PROGRESS_PROMPTS.get(answerCount) || null;
}
