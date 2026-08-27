import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(join(root, 'public'), output, { recursive: true });
const moduleAlias = { name: 'browser-modules', setup(context) { context.onResolve({ filter: /^\/modules\// }, ({ path }) => ({ path: join(root, 'src', path.slice('/modules/'.length)) })); } };
const browserBuild = { bundle: true, format: 'iife', target: ['es2018'], plugins: [moduleAlias] };
await build({ ...browserBuild, entryPoints: [join(root, 'public/app.js')], outfile: join(output, 'app.js') });
for (const relative of ['index.html']) {
  const path = join(output, relative); const html = await readFile(path, 'utf8');
  await writeFile(path, html.replace('type="module" ', 'defer '), 'utf8');
}
