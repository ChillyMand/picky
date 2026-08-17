import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppServer } from '../server.mjs';

test('user page exposes the complete test flow with visible answer copy and no implementation language', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'picky-ui-'));
  const app = createAppServer({ archivePath: join(dir, 'tests.json') });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve)); t.after(() => app.close());
  const base = `http://127.0.0.1:${app.address().port}`;
  const html = await fetch(base).then((response) => response.text());
  const css = await fetch(`${base}/styles.css`).then((response) => response.text());
  const touchCss = await fetch(`${base}/touch-fixes.css`).then((response) => response.text());
  const appJs = await fetch(`${base}/app.js`).then((response) => response.text());
  assert.match(html, /你到底有多挑食/);
  for (const label of ['超爱吃', '可以吃', '坚决不吃', '没吃过']) assert.match(html, new RegExp(label));
  for (const forbidden of ['无需登录', '本地存储', '匿名统计', '自适应算法']) assert.doesNotMatch(html, new RegExp(forbidden));
  assert.match(html, /name="viewport"/);
  assert.match(html, /输入好友配对码/);
  assert.match(html, /开始双人匹配/);
  assert.match(html, /touch-fixes\.css\?v=2/);
  assert.match(html, /直接查看匹配度/);
  assert.match(html, /我的测试码/);
  assert.match(html, /对方测试码/);
  assert.match(css, /color:\s*var\(--ink\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(touchCss, /@media\s*\(hover:\s*none\)/);
  assert.match(touchCss, /\.answer-button:hover[^}]*background:\s*var\(--paper\)/);
  assert.match(appJs, /isPublicCode\(pendingPairCode\).*showIntro/s);
});

test('client modules are served to the browser', async (t) => {
  const app = createAppServer(); await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve)); t.after(() => app.close());
  const response = await fetch(`http://127.0.0.1:${app.address().port}/modules/foods.js`);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /export const FOODS/);
});
