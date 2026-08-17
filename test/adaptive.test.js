import test from 'node:test';
import assert from 'node:assert/strict';
import { FOODS } from '../src/foods.js';
import { createInitialQueue, selectFollowUps, buildQuestionQueue } from '../src/adaptive.js';

test('catalog covers the complete seventeen-category reference list', () => {
  assert.ok(FOODS.length >= 150, `only ${FOODS.length} foods`);
  assert.ok(new Set(FOODS.map((item) => item.category)).size >= 17);
  for (const name of ['兔肉', '鹅肉', '牛百叶', '三文鱼', '皮皮虾', '扇贝', '章鱼', '鹌鹑蛋', '芥菜', '荷兰豆', '西兰花', '腐竹', '饺子', '蓝莓', '龙眼']) {
    assert.ok(FOODS.some((food) => food.name === name), `missing ${name}`);
  }
});

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

test('question queue covers at least forty-five foods without repeats and caps at sixty', () => {
  const answers = FOODS.slice(0, 45).map((food) => ({ foodId: food.id, choice: 'refuse' }));
  const queue = buildQuestionQueue([]);
  assert.ok(queue.length >= 45);
  assert.ok(queue.length <= 60);
  assert.equal(queue.length, new Set(queue).size);
});
