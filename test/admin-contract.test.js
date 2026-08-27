import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppServer } from '../server.mjs';

test('admin page and statistics endpoints are no longer available', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'picky-admin-'));
  const app = createAppServer({ archivePath: join(dir, 'tests.json') });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve)); t.after(() => app.close());
  const base = `http://127.0.0.1:${app.address().port}`;
  for (const path of ['/admin/', '/api/admin/summary', '/api/admin/sessions', '/api/admin/matches']) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 404, path);
  }
});
