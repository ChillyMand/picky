import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicCode, isPublicCode, normalizePublicCode } from '../src/codes.js';
import { scoreCompatibility } from '../src/matching.js';

test('public test codes use exactly four unambiguous uppercase characters', () => {
  const code = createPublicCode(() => 0.123456);
  assert.match(code, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
  assert.equal(normalizePublicCode(` ${code.toLowerCase()} `), code);
  assert.equal(normalizePublicCode('abcde'), 'ABCD');
  assert.equal(isPublicCode('ABCD'), true);
  assert.equal(isPublicCode('ABCDE'), false);
});

test('matching rewards shared preferences and identifies conflicts', () => {
  const first = [
    { foodId: 'pork', choice: 'love' }, { foodId: 'fish', choice: 'refuse' }, { foodId: 'coriander', choice: 'refuse' },
  ];
  const second = [
    { foodId: 'pork', choice: 'love' }, { foodId: 'fish', choice: 'love' }, { foodId: 'coriander', choice: 'refuse' },
  ];
  const result = scoreCompatibility(first, second);
  assert.ok(result.score >= 45 && result.score <= 85);
  assert.deepEqual(result.sharedLikes.map((item) => item.name), ['猪肉']);
  assert.deepEqual(result.sharedAvoids.map((item) => item.name), ['香菜']);
  assert.deepEqual(result.conflicts.map((item) => item.name), ['鱼']);
});
