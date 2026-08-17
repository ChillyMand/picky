import { FOODS, getFoodById } from './foods.js';

export const MAX_QUESTIONS = 60;
const INITIAL = ['pork', 'egg', 'fish', 'shrimp', 'bok_choy', 'eggplant', 'mushroom', 'tofu', 'coriander', 'pork_liver', 'chicken_feet', 'durian'];
const CONFIRMATION = ['zheergen', 'pig_brain', 'fish_head', 'snail_noodle', 'oyster', 'bitter_melon'];

export function createInitialQueue() { return [...INITIAL]; }

export function selectFollowUps(answers) {
  const byId = new Map(answers.map((answer) => [answer.foodId, answer.choice]));
  const result = [];
  const add = (...ids) => ids.forEach((id) => { if (!byId.has(id) && !result.includes(id)) result.push(id); });
  if (byId.get('coriander') === 'refuse') add('scallion', 'garlic', 'onion');
  if (byId.get('fish') === 'refuse' && ['love', 'okay'].includes(byId.get('shrimp'))) add('crab', 'shellfish', 'squid');
  if (byId.get('pork_liver') === 'refuse') add('pork_stomach', 'duck_intestine', 'chicken_heart');
  if (byId.get('eggplant') === 'refuse' || byId.get('mushroom') === 'refuse') add('okra', 'wood_ear', 'kelp');
  if (byId.get('chicken_feet') === 'refuse') add('pig_ear', 'fish_head');
  if (byId.get('durian') === 'refuse') add('fermented_tofu', 'zheergen');
  return result;
}

function stratifiedCatalog() {
  const groups = new Map();
  for (const item of FOODS) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item.id);
  }
  const rows = [...groups.values()];
  const ordered = [];
  for (let index = 0; ordered.length < FOODS.length; index += 1) {
    let added = false;
    for (const row of rows) {
      if (row[index]) { ordered.push(row[index]); added = true; }
    }
    if (!added) break;
  }
  return ordered;
}

export function buildQuestionQueue(answers = []) {
  const answered = new Set(answers.map(({ foodId }) => foodId));
  const queue = [...INITIAL, ...selectFollowUps(answers), ...CONFIRMATION, ...stratifiedCatalog()];
  return [...new Set(queue)].filter((id) => !answered.has(id) || INITIAL.includes(id)).slice(0, MAX_QUESTIONS);
}

export function selectNextFood(session) {
  const answered = new Set(session.answers.map(({ foodId }) => foodId));
  return buildQuestionQueue(session.answers).map(getFoodById).find((food) => food && !answered.has(food.id)) || null;
}
