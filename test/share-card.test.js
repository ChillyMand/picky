import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareText, buildShareSvg } from '../src/share.js';

const result = { pickyScore: 67, personality: { name: '谨慎型小饭团' }, tags: ['香菜警报', '黏滑退散', '熟悉感优先'], verdict: '食物进入嘴里前，需要先通过安检。' };

test('share text contains score, personality, verdict, and invitation', () => {
  const text = buildShareText(result);
  assert.match(text, /67/); assert.match(text, /谨慎型小饭团/); assert.match(text, /通过安检/); assert.match(text, /你是多少/);
});

test('share SVG escapes dynamic text and has a portrait canvas', () => {
  const svg = buildShareSvg({ ...result, verdict: '<script>alert(1)</script>' });
  assert.match(svg, /width="1080" height="1440"/);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
});
