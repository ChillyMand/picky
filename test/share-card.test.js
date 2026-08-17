import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareText, buildShareCardModel } from '../src/share.js';

const result = { pickyScore: 67, personality: { name: '谨慎型小饭团' }, tags: ['香菜警报', '黏滑退散', '熟悉感优先'], verdict: '食物进入嘴里前，需要先通过安检。' };

test('share text contains score, personality, verdict, and invitation', () => {
  const text = buildShareText(result);
  assert.match(text, /67/); assert.match(text, /谨慎型小饭团/); assert.match(text, /通过安检/); assert.match(text, /你是多少/);
});

test('share card model uses a subtle searchable session id and JPEG filename', () => {
  const card = buildShareCardModel(result, '3b766d62-a175-4f2e-b08b-fe19af1dd422');
  assert.equal(card.width, 1080);
  assert.equal(card.height, 1440);
  assert.equal(card.shortId, '#3B766D62');
  assert.match(card.filename, /\.jpg$/);
});
