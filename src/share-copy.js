export const SHARE_INVITES = [
  '快来测测我们的饭桌默契度！',
  '看看我们能不能愉快地吃到一桌？',
  '敢不敢来对一下我们的饭桌暗号？',
  '一起测测谁才是饭桌上的挑食大王！',
  '我们的口味到底有多合拍？来测一下。',
  '这顿饭能不能一起吃，就看这次测试了！',
];

export function buildShareInviteCopy(url, random = Math.random()) {
  const index = Math.min(SHARE_INVITES.length - 1, Math.floor(Math.max(0, random) * SHARE_INVITES.length));
  return `${SHARE_INVITES[index]}\n${url}`;
}
