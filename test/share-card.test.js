import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareText, buildShareCardModel, buildPairInviteUrl } from '../src/share.js';

const result = { pickyScore: 67, personality: { name: '谨慎型小饭团' }, tags: ['香菜警报', '黏滑退散', '熟悉感优先'], verdict: '食物进入嘴里前，需要先通过安检。' };

test('share text contains score, personality, verdict, and invitation', () => {
  const text = buildShareText(result);
  assert.match(text, /67/); assert.match(text, /谨慎型小饭团/); assert.match(text, /通过安检/); assert.match(text, /你是多少/);
});

test('share card model carries the public code and its pairing URL', () => {
  assert.equal(buildPairInviteUrl('a2b3c'), 'https://picky.wzrice.cn/?pair=A2B3C');
  const card = buildShareCardModel(result, 'A2B3C');
  assert.equal(card.width, 1080);
  assert.equal(card.height, 1440);
  assert.equal(card.shortId, '#A2B3C');
  assert.equal(card.publicCode, 'A2B3C');
  assert.equal(card.pairUrl, 'https://picky.wzrice.cn/?pair=A2B3C');
  assert.match(card.filename, /\.jpg$/);
});
