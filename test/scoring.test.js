import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreTest } from '../src/scoring.js';

const foods = ['pork', 'egg', 'fish', 'shrimp', 'bok_choy', 'eggplant', 'mushroom', 'tofu', 'coriander', 'pork_liver', 'chicken_feet', 'durian', 'scallion', 'garlic', 'onion', 'crab', 'shellfish', 'squid', 'okra', 'wood_ear', 'kelp', 'rice_noodle'];

function answers(choice) {
  return foods.map((foodId) => ({ foodId, choice }));
}

test('an all-loving eater becomes the omnivore personality', () => {
  const result = scoreTest(answers('love'));
  assert.equal(result.pickyScore, 0);
  assert.equal(result.personality.id, 'omnivore');
});

test('an all-refusing eater becomes a boundary guardian', () => {
  const result = scoreTest(answers('refuse'));
  assert.ok(result.pickyScore >= 76);
  assert.equal(result.personality.id, 'guardian');
});

test('forty percent unknown answers use the observer override', () => {
  const sample = foods.slice(0, 20).map((foodId, index) => ({ foodId, choice: index < 8 ? 'unknown' : 'okay' }));
  assert.equal(scoreTest(sample).personality.id, 'observer');
});

test('result exposes six acceptance dimensions on a zero to one hundred scale', () => {
  const result = scoreTest(answers('okay'));
  assert.deepEqual(Object.keys(result.dimensions), ['variety', 'odor', 'texture', 'appearance', 'seafood', 'exploration']);
  for (const value of Object.values(result.dimensions)) assert.ok(value >= 0 && value <= 100);
});

test('accepting every food produces full variety acceptance', () => {
  assert.equal(scoreTest(answers('okay')).dimensions.variety, 100);
});

test('variety acceptance applies percentage weights once', () => {
  const result = scoreTest([
    { foodId: 'pork', choice: 'refuse' },
    { foodId: 'egg', choice: 'okay' },
    { foodId: 'fish', choice: 'okay' },
    { foodId: 'bok_choy', choice: 'okay' },
  ]);
  assert.equal(result.dimensions.variety, 75);
});

test('coriander and allium refusals trigger the odor defense easter egg', () => {
  const sample = [
    { foodId: 'coriander', choice: 'refuse' },
    { foodId: 'scallion', choice: 'refuse' },
    { foodId: 'garlic', choice: 'refuse' },
    { foodId: 'onion', choice: 'refuse' },
    ...answers('okay').filter(({ foodId }) => !['coriander', 'scallion', 'garlic', 'onion'].includes(foodId)),
  ];
  const result = scoreTest(sample);
  assert.match(result.easterEgg, /气味防御系统/);
  assert.equal(result.tags.length, 3);
});
