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

export const FOOD_BY_ID = new Map(FOODS.map((item) => [item.id, item]));
export function getFoodById(id) { return FOOD_BY_ID.get(id) || null; }
