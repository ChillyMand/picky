export const SHARE_THEMES = Object.freeze([
  { id: 'cocoa-pop', background: '#302b27', foreground: '#ffffff', primary: '#ffb4c9', accent: '#dfff70', stickerShadow: '#ffb4c9', qrDark: '#302b27' },
  { id: 'cream-menu', background: '#fff2d7', foreground: '#4b241f', primary: '#e34e42', accent: '#f2aa3c', stickerShadow: '#f2aa3c', qrDark: '#4b241f' },
  { id: 'ocean-soda', background: '#102a43', foreground: '#ffffff', primary: '#ff6b6b', accent: '#67e8f9', stickerShadow: '#ff6b6b', qrDark: '#102a43' },
  { id: 'matcha-picnic', background: '#dce8c8', foreground: '#24452b', primary: '#ff6d3a', accent: '#3c6e47', stickerShadow: '#3c6e47', qrDark: '#24452b' },
  { id: 'grape-night', background: '#45235b', foreground: '#ffffff', primary: '#ffe66d', accent: '#ff9ec4', stickerShadow: '#ff9ec4', qrDark: '#45235b' },
]);

export function pickShareTheme(random = Math.random) {
  const value = Math.max(0, Math.min(0.999999999, Number(random()) || 0));
  return SHARE_THEMES[Math.floor(value * SHARE_THEMES.length)];
}
