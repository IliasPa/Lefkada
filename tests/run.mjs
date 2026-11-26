// Runs the voting checks:  node run.mjs db | browser | all
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SUITES = { db: ['db.test.mjs', 'edge.test.mjs'], browser: ['browser.test.mjs'] };
const what = process.argv[2] ?? 'all';
const files = what === 'all' ? Object.values(SUITES).flat() : SUITES[what];
if (!files) { console.error('usage: node run.mjs db|browser|all'); process.exit(2); }

let failed = 0;
for (const f of files) {
  console.log(`\n━━ ${f}`);
  if (spawnSync(process.execPath, [join(here, f)], { stdio: 'inherit' }).status !== 0) failed++;
}
console.log(failed ? `\n✗ ${failed} suite(s) FAILED` : `\n✓ all ${files.length} suite(s) passed`);
process.exit(failed ? 1 : 0);
