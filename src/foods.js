const food = (id, name, emoji, category, dimensions, traits = {}) => ({ id, name, emoji, category, dimensions, odor: 0, texture: [], appearance: 0, challenge: 1, ...traits });

export const FOODS = [
  food('pork', '猪肉', '🥩', '畜肉类', ['meat']), food('beef', '牛肉', '🥩', '畜肉类', ['meat']), food('mutton', '羊肉', '🍖', '畜肉类', ['meat', 'odor'], { odor: 2 }),
  food('pig_ear', '猪耳朵', '🐷', '畜肉类', ['meat', 'appearance', 'texture'], { appearance: 2, texture: ['crunchy'] }),
  food('chicken', '鸡肉', '🍗', '家禽类', ['meat']), food('duck', '鸭肉', '🦆', '家禽类', ['meat']),
  food('chicken_feet', '鸡爪', '🐔', '家禽类', ['appearance', 'texture'], { appearance: 3, texture: ['tendon'], challenge: 3 }),
  food('pork_liver', '猪肝', '🫀', '内脏类', ['organ', 'odor', 'texture'], { odor: 2, texture: ['powdery'], challenge: 3 }),
  food('pork_stomach', '猪肚', '🪢', '内脏类', ['organ', 'texture'], { texture: ['chewy'], challenge: 3 }),
  food('duck_intestine', '鸭肠', '🪢', '内脏类', ['organ', 'texture'], { texture: ['crunchy'], challenge: 3 }),
  food('chicken_heart', '鸡心', '❤️', '内脏类', ['organ', 'appearance'], { appearance: 2, challenge: 3 }),
  food('pig_brain', '猪脑', '🧠', '内脏类', ['organ', 'appearance', 'texture'], { appearance: 3, texture: ['soft'], challenge: 4 }),
  food('fish', '鱼', '🐟', '鱼类', ['fish', 'seafood', 'odor'], { odor: 1 }), food('fish_head', '鱼头', '🐠', '鱼类', ['fish', 'seafood', 'appearance'], { appearance: 3, challenge: 3 }),
  food('shrimp', '虾', '🦐', '虾蟹类', ['shellfish', 'seafood']), food('crab', '蟹', '🦀', '虾蟹类', ['shellfish', 'seafood']),
  food('shellfish', '贝类', '🐚', '螺贝类', ['shellfish', 'seafood', 'texture'], { texture: ['chewy'] }), food('squid', '鱿鱼', '🦑', '软体水产', ['seafood', 'texture'], { texture: ['chewy'] }),
  food('oyster', '生蚝', '🦪', '螺贝类', ['seafood', 'texture', 'appearance'], { texture: ['slimy'], appearance: 2, challenge: 3 }),
  food('frog', '牛蛙', '🐸', '淡水河鲜', ['appearance'], { appearance: 2, challenge: 3 }),
  food('egg', '鸡蛋', '🥚', '蛋类', ['egg']), food('duck_egg', '鸭蛋', '🥚', '蛋类', ['egg']),
  food('bok_choy', '青菜', '🥬', '叶菜', ['leafy']), food('spinach', '菠菜', '🥬', '叶菜', ['leafy']),
  food('coriander', '香菜', '🌿', '叶菜', ['leafy', 'odor'], { odor: 3, challenge: 3 }),
  food('scallion', '葱', '🌱', '葱蒜类', ['odor'], { odor: 2 }), food('garlic', '蒜', '🧄', '葱蒜类', ['odor'], { odor: 3 }), food('onion', '洋葱', '🧅', '葱蒜类', ['odor'], { odor: 2 }),
  food('eggplant', '茄子', '🍆', '果菜', ['texture'], { texture: ['soft', 'slimy'] }), food('okra', '秋葵', '🫑', '果菜', ['texture'], { texture: ['slimy'], challenge: 2 }),
  food('mushroom', '菌菇', '🍄', '花菜菌菇', ['fungus', 'texture'], { texture: ['soft'] }), food('wood_ear', '木耳', '🍄', '花菜菌菇', ['fungus', 'texture'], { texture: ['crunchy'] }),
  food('kelp', '海带', '🌿', '软体水产', ['texture', 'seafood'], { texture: ['slimy'] }),
  food('tofu', '豆腐', '⬜', '豆制品', ['soy', 'texture'], { texture: ['soft'] }), food('fermented_tofu', '腐乳', '🧀', '豆制品', ['soy', 'odor'], { odor: 3, challenge: 3 }),
  food('rice_noodle', '米粉', '🍜', '主食', ['staple']), food('snail_noodle', '螺蛳粉', '🍜', '主食', ['staple', 'odor'], { odor: 3, challenge: 4 }),
  food('apple', '苹果', '🍎', '水果', ['fruit']), food('banana', '香蕉', '🍌', '水果', ['fruit', 'texture'], { texture: ['soft'] }),
  food('durian', '榴莲', '🍈', '水果', ['fruit', 'odor', 'texture'], { odor: 3, texture: ['soft'], challenge: 4 }),
  food('bitter_melon', '苦瓜', '🫑', '果菜', ['taste'], { challenge: 3 }), food('zheergen', '折耳根', '🌿', '叶菜', ['odor'], { odor: 3, challenge: 4 }),
];

const REFERENCE_GROUPS = [
  ['畜肉类', '🥩', ['meat'], ['猪肉','牛肉','羊肉','兔肉','猪蹄','猪耳朵','猪舌头','猪尾巴','猪脑','牛骨髓','排骨','牛蹄筋','牛板筋']],
  ['家禽肉', '🍗', ['meat'], ['鸡肉','鸭肉','鹅肉','鸽肉','鹌鹑肉','鸭脖','鸭头','鸭舌','鸭锁骨','鸡爪','鸭爪','凤爪','鸭肠','鸭翅','翅中','翅根']],
  ['畜肉脏', '🫀', ['organ'], ['猪肝','猪肚','猪大肠','猪腰子','猪腰','猪心','猪血','牛肚','毛肚','百叶','牛百叶','牛杂']],
  ['禽肉脏', '🫀', ['organ'], ['鸡胗','鸡心','鸭胗','鹅胗','鸡肝','鸭肝']],
  ['鱼类', '🐟', ['fish','seafood'], ['三文鱼','金枪鱼','鳕鱼','鲈鱼','带鱼','黄鱼','鲤鱼','鲫鱼','草鱼','鲩鱼','鱼头','鱼杂','鱼籽','鱼泡','鱼丸','鱼皮']],
  ['虾蟹类', '🦐', ['shellfish','seafood'], ['虾','小龙虾','皮皮虾','蟹','虾滑','蟹柳']],
  ['螺贝类', '🐚', ['shellfish','seafood'], ['扇贝','生蚝','花甲','蛏子','海螺','田螺','螺蛳']],
  ['软体及其他水产', '🦑', ['seafood','texture'], ['章鱼','鱿鱼','墨鱼','海蜇','鲍鱼','海参']],
  ['两栖淡水河鲜', '🐸', ['appearance'], ['牛蛙','泥鳅','黄鳝','甲鱼']],
  ['蛋类', '🥚', ['egg'], ['鸡蛋','鸭蛋','鹌鹑蛋','鹅蛋']],
  ['叶菜', '🥬', ['leafy'], ['白菜','菠菜','油菜','空心菜','苋菜','茼蒿','油麦菜','生菜','苦菊','芥菜','香菜','韭菜','红苋菜','木耳菜','水芹','茭白','紫苏','笋','鱼腥草','马齿苋','香椿']],
  ['果菜', '🫑', ['texture'], ['西红柿','茄子','青椒','彩椒','辣椒','黄瓜','南瓜','冬瓜','苦瓜','丝瓜','秋葵','西葫芦','长豆角','荷兰豆','四季豆','扁豆','豌豆','毛豆','蚕豆','绿豆']],
  ['花菜菌菇', '🍄', ['fungus','texture'], ['花菜','西兰花','黄花菜','蘑菇','香菇','金针菇','平菇','杏鲍菇','木耳']],
  ['葱蒜类', '🧄', ['odor'], ['洋葱','蒜苗','大葱','小葱','大蒜','大蒜叶']],
  ['豆制品', '⬜', ['soy'], ['豆腐','千张','腐竹','豆干','油豆腐','素鸡','魔芋']],
  ['主食及加工品', '🍜', ['staple'], ['面条','米粉','米线','粉丝','年糕','馒头','包子','饺子','馄饨','油条','烧麦','螺蛳粉']],
  ['水果', '🍎', ['fruit'], ['苹果','梨','香蕉','橙子','橘子','柚子','柠檬','西瓜','哈密瓜','甜瓜','猕猴桃','葡萄','提子','草莓','蓝莓','火龙果','芒果','木瓜','桃子','李子','杏','樱桃','榴莲','菠萝蜜','牛油果','百香果','山竹','菠萝','柿子','杨梅','桑葚','荔枝','龙眼']],
];

const existingNames = new Set(FOODS.map(({ name }) => name));
let referenceIndex = 0;
for (const [category, emoji, dimensions, names] of REFERENCE_GROUPS) {
  for (const name of names) {
    referenceIndex += 1;
    if (existingNames.has(name)) continue;
    const organ = dimensions.includes('organ');
    const seafood = dimensions.includes('seafood');
    FOODS.push(food(`reference_${String(referenceIndex).padStart(3, '0')}`, name, emoji, category, dimensions, {
      odor: organ || seafood ? 1 : dimensions.includes('odor') ? 2 : 0,
      appearance: organ ? 2 : 0,
      texture: dimensions.includes('texture') ? ['distinctive'] : [],
      challenge: organ ? 3 : 1,
    }));
    existingNames.add(name);
  }
}

export const FOOD_BY_ID = new Map(FOODS.map((item) => [item.id, item]));
export function getFoodById(id) { return FOOD_BY_ID.get(id) || null; }
