import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('desktop layout uses the available landscape width while preserving a mobile breakpoint', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../public/desktop.css', import.meta.url), 'utf8');
  assert.match(html, /class="home-desktop-grid"/);
  assert.match(html, /class="home-story"/);
  assert.match(html, /class="home-actions"/);
  assert.match(css, /\.app-shell\s*\{[^}]*1180px/);
  assert.match(css, /@media\s*\(min-width:\s*900px\)/);
  assert.match(css, /\.home-desktop-grid\s*\{[^}]*grid-template-columns:/);
  assert.match(css, /\.question-screen[^}]*960px/);
  assert.match(css, /\.result-screen[^}]*980px/);
  assert.match(css, /@media\s*\(max-width:\s*899px\)/);
});
