import { getFoodById } from './foods.js';

const PERSONALITIES = [
  { max: 20, id: 'omnivore', name: '万物吞吞兽', verdict: '别人研究菜单，你研究还有没有第二碗。' },
  { max: 40, id: 'easygoing', name: '随和型饭搭子', verdict: '大部分餐厅都能让你顺利落座。' },
  { max: 60, id: 'principled', name: '有原则的干饭人', verdict: '你不是挑食，只是知道什么不值得占据胃容量。' },
  { max: 75, id: 'riceball', name: '谨慎型小饭团', verdict: '食物进入嘴里前，需要先通过安检。' },
  { max: 100, id: 'guardian', name: '饭桌边界守护者', verdict: '夹菜之前请先询问，这是饭碗的基本礼仪。' },
];
const OBSERVER = { id: 'observer', name: '未知食材观察员', verdict: '不是不吃，只是你的饮食地图还有很多迷雾区。' };

function acceptance(choice) { return choice === 'love' ? 100 : choice === 'okay' ? 72 : choice === 'unknown' ? 50 : 0; }
function average(values, fallback = 70) { return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : fallback; }

export function scoreTest(answers) {
  const valid = answers.map((answer) => ({ ...answer, food: getFoodById(answer.foodId) })).filter(({ food }) => food);
  const known = valid.filter(({ choice }) => choice !== 'unknown');
  const refused = known.filter(({ choice }) => choice === 'refuse');
  const refusalRatio = known.length ? refused.length / known.length : 0;
  const allCategories = new Set(known.map(({ food }) => food.category));
  const refusedCategories = new Set(refused.map(({ food }) => food.category));
  const categoryBreadth = allCategories.size ? refusedCategories.size / allCategories.size : 0;
  const odorItems = known.filter(({ food }) => food.odor > 0);
  const textureItems = known.filter(({ food }) => food.texture.length);
  const odorSensitivity = odorItems.length ? odorItems.filter(({ choice }) => choice === 'refuse').length / odorItems.length : 0;
  const textureSensitivity = textureItems.length ? textureItems.filter(({ choice }) => choice === 'refuse').length / textureItems.length : 0;
  const unknownRatio = valid.length ? valid.filter(({ choice }) => choice === 'unknown').length / valid.length : 0;
  const pickyScore = Math.round(Math.min(1, refusalRatio * .35 + categoryBreadth * .25 + textureSensitivity * .15 + odorSensitivity * .15 + unknownRatio * .10) * 100);
  const dimension = (matcher) => average(valid.filter(({ food }) => matcher(food)).map(({ choice }) => acceptance(choice)));
  const dimensions = {
    variety: Math.round(100 - (refusalRatio * 70 + categoryBreadth * 30)),
    odor: dimension((food) => food.odor > 0),
    texture: dimension((food) => food.texture.length > 0),
    appearance: dimension((food) => food.appearance > 0),
    seafood: dimension((food) => food.dimensions.includes('seafood')),
    exploration: Math.round((1 - unknownRatio) * 100),
  };
  for (const key of Object.keys(dimensions)) dimensions[key] = Math.max(0, Math.min(100, dimensions[key]));
  const personality = unknownRatio >= .4 ? OBSERVER : PERSONALITIES.find(({ max }) => pickyScore <= max);
  const refusedIds = new Set(refused.map(({ foodId }) => foodId));
  const tagCandidates = [
    [refusedIds.has('coriander'), '香菜警报'], [odorSensitivity >= .45, '气味探测器'], [textureSensitivity >= .45, '黏滑退散'],
    [refused.some(({ food }) => food.dimensions.includes('organ')), '内脏绝缘体'], [dimensions.seafood >= 70, '海鲜居民'], [unknownRatio >= .25, '谨慎尝鲜'],
    [true, '熟悉感优先'], [true, '菜单研究员'], [true, '拒绝劝吃'],
  ];
  const tags = tagCandidates.filter(([condition]) => condition).slice(0, 3).map(([, label]) => label);
  let easterEgg = '';
  if (['coriander', 'scallion', 'garlic', 'onion'].every((id) => refusedIds.has(id))) easterEgg = '气味防御系统已启动。';
  else if (['pork_liver', 'pork_stomach', 'duck_intestine', 'chicken_heart'].every((id) => valid.some((a) => a.foodId === id && ['love', 'okay'].includes(a.choice)))) easterEgg = '内脏区永久通行证。';
  else if (refusedIds.has('fish') && ['shrimp', 'crab', 'shellfish'].every((id) => valid.some((a) => a.foodId === id && ['love', 'okay'].includes(a.choice)))) easterEgg = '海鲜可以，带刺免谈。';
  return { pickyScore, dimensions, personality, tags, easterEgg, verdict: personality.verdict, summary: `你的挑食指数是 ${pickyScore}，饭桌人格为“${personality.name}”。` };
}
