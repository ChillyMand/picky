import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAppServer } from '../server.mjs';

test('admin page provides metrics, filters, full record details, and no custom login UI', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'picky-admin-'));
  const app = createAppServer({ archivePath: join(dir, 'tests.json') });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve)); t.after(() => app.close());
  const base = `http://127.0.0.1:${app.address().port}`;
  const html = await fetch(`${base}/admin/`).then((response) => response.text());
  for (const label of ['开始测试', '完成率', '平均题数', '测试记录', '配对记录', '双方测试码', '测试码 / IP / 访客 ID', '完整选择', '设备环境']) assert.match(html, new RegExp(label));
  assert.doesNotMatch(html, /登录|解密|遮挡 IP/);
});
