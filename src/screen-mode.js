export function shouldLockPageScroll(className = '') {
  return className.split(/\s+/).includes('question-screen');
}
