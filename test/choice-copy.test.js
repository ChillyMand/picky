import test from 'node:test';
import assert from 'node:assert/strict';
import { CHOICES, INTRO_CHOICE_DETAILS } from '../src/choice-copy.js';

test('every answer exposes a concise in-question explanation', () => {
  assert.deepEqual(CHOICES.map(({ label, hint }) => [label, hint]), [
    ['超爱吃', '看到会主动夹'],
    ['可以吃', '有就吃，没有也行'],
    ['坚决不吃', '会挑出来或直接拒绝'],
    ['没吃过', '暂时无法判断'],
  ]);
});

test('the intro expands each choice without changing its meaning', () => {
  assert.deepEqual(INTRO_CHOICE_DETAILS, [
    '不只是能吃，看到会主动夹，也愿意专门点',
    '正常接受，有就吃，没有也不会惦记',
    '通常不考虑做法，会挑出来或直接拒绝',
    '确实没有尝试过，目前无法判断喜不喜欢',
  ]);
});
