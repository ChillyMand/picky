import test from 'node:test';
import assert from 'node:assert/strict';
import { FOODS } from '../src/foods.js';
import { createInitialQueue, selectFollowUps, buildQuestionQueue } from '../src/adaptive.js';

test('initial queue covers twelve representative dimensions without duplicates', () => {
  const queue = createInitialQueue();
  assert.equal(queue.length, 12);
  assert.equal(new Set(queue).size, 12);
  const dimensions = new Set(queue.flatMap((id) => FOODS.find((food) => food.id === id).dimensions));
  for (const dimension of ['meat', 'egg', 'fish', 'shellfish', 'leafy', 'texture', 'fungus', 'soy', 'odor', 'organ', 'appearance', 'fruit']) {
    assert.ok(dimensions.has(dimension), `missing ${dimension}`);
  }
});

test('refusing coriander follows up with aromatic alliums', () => {
  const followUps = selectFollowUps([{ foodId: 'coriander', choice: 'refuse' }]);
  assert.deepEqual(followUps.slice(0, 3), ['scallion', 'garlic', 'onion']);
});

test('refusing fish while liking shrimp explores other seafood', () => {
  const followUps = selectFollowUps([
    { foodId: 'fish', choice: 'refuse' },
    { foodId: 'shrimp', choice: 'love' },
  ]);
  assert.deepEqual(followUps.slice(0, 3), ['crab', 'shellfish', 'squid']);
});

test('question queue never repeats foods and never exceeds thirty', () => {
  const answers = FOODS.slice(0, 45).map((food) => ({ foodId: food.id, choice: 'refuse' }));
  const queue = buildQuestionQueue(answers);
  assert.ok(queue.length <= 30);
  assert.equal(queue.length, new Set(queue).size);
});
