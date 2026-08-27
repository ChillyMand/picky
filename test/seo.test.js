import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppServer } from '../server.mjs';

test('public page exposes complete search and sharing metadata', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'picky-seo-'));
  const app = createAppServer({ archivePath: join(dir, 'tests.json') });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve)); t.after(() => app.close());
  const base = `http://127.0.0.1:${app.address().port}`;
  const html = await fetch(base).then((response) => response.text());
  assert.match(html, /<title>PICKY! 挑食测试｜测测你到底有多挑食<\/title>/);
  for (const marker of ['name="description"', 'name="keywords"', 'name="robots"', 'rel="canonical"', 'property="og:title"', 'property="og:description"', 'property="og:image"', 'name="twitter:card"', 'application\/ld\\+json']) assert.match(html, new RegExp(marker));
  assert.match(html, /"@type"\s*:\s*"WebSite"/);
  assert.match(html, /"@type"\s*:\s*"WebApplication"/);
  assert.doesNotMatch(html, /后台|数据库|接口|存档/);
});

test('robots and sitemap expose only the canonical public page', async (t) => {
  const app = createAppServer(); await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve)); t.after(() => app.close());
  const base = `http://127.0.0.1:${app.address().port}`;
  const robots = await fetch(`${base}/robots.txt`).then((response) => response.text());
  const sitemap = await fetch(`${base}/sitemap.xml`).then((response) => response.text());
  assert.match(robots, /User-agent:\s*\*/);
  assert.match(robots, /Allow:\s*\//);
  assert.match(robots, /Sitemap:\s*https:\/\/picky\.wzrice\.cn\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/picky\.wzrice\.cn\/<\/loc>/);
  assert.equal((sitemap.match(/<url>/g) || []).length, 1);
});
