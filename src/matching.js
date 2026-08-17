import { getFoodById } from './foods.js';

const compatible = new Set(['love', 'okay']);
export function scoreCompatibility(firstAnswers, secondAnswers) {
  const secondByFood = new Map(secondAnswers.map((answer) => [answer.foodId, answer.choice]));
  const overlap = firstAnswers.filter((answer) => secondByFood.has(answer.foodId));
  const sharedLikes = [], sharedAvoids = [], conflicts = [];
  let points = 0;
  for (const answer of overlap) {
    const other = secondByFood.get(answer.foodId); const food = getFoodById(answer.foodId); if (!food) continue;
    if (compatible.has(answer.choice) && compatible.has(other)) { points += answer.choice === other ? 100 : 85; sharedLikes.push(food); }
    else if (answer.choice === 'refuse' && other === 'refuse') { points += 92; sharedAvoids.push(food); }
    else if ((answer.choice === 'refuse' && compatible.has(other)) || (other === 'refuse' && compatible.has(answer.choice))) { points += 5; conflicts.push(food); }
    else points += 50;
  }
  const score = overlap.length ? Math.round(points / overlap.length) : 0;
  const verdict = score >= 85 ? '你们的饭碗几乎是同一个模子刻出来的。' : score >= 70 ? '约饭基本不用开会，少数雷区提前说清即可。' : score >= 50 ? '可以吃到一桌，但点菜时最好各保留一席之地。' : '你们的饭碗边界很有个性，建议多点几道菜。';
  return { score, verdict, overlapCount: overlap.length, sharedLikes: sharedLikes.slice(0, 6), sharedAvoids: sharedAvoids.slice(0, 6), conflicts: conflicts.slice(0, 6) };
}
