import test from 'node:test';
import assert from 'node:assert/strict';
import { SHARE_THEMES, pickShareTheme } from '../src/share-themes.js';

test('share cards provide five unique visual themes', () => {
  assert.equal(SHARE_THEMES.length, 5);
  assert.equal(new Set(SHARE_THEMES.map(({ id }) => id)).size, 5);
  for (const theme of SHARE_THEMES) {
    for (const key of ['background', 'foreground', 'primary', 'accent', 'stickerShadow', 'qrDark']) assert.match(theme[key], /^#[0-9a-f]{6}$/i);
  }
});

test('theme selection supports deterministic random boundaries', () => {
  assert.equal(pickShareTheme(() => 0).id, SHARE_THEMES[0].id);
  assert.equal(pickShareTheme(() => 0.999999).id, SHARE_THEMES[4].id);
});
