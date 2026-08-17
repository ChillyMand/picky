import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'modules'), { recursive: true });
await cp(join(root, 'public'), output, { recursive: true });
await cp(join(root, 'src'), join(output, 'modules'), { recursive: true });
