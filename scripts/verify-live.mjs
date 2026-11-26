#!/usr/bin/env node
/**
 * Is the LIVE site the published code? (v2.1)
 *
 * Every page of the app carries <meta name="build-commit" content="<sha>">.
 * This script:
 *   1. reads that commit from the live site,
 *   2. checks the commit is part of the public branch (default origin/main),
 *   3. builds that exact commit from scratch in a temporary checkout,
 *   4. downloads every file of the build from the live site and compares them
 *      byte for byte — with ONE allowance: webpack's small runtime file lists
 *      the app's script files in an order that varies from build to build (the
 *      same code gives two possible files). That table is compared as a set,
 *      the rest of that file exactly, and every script it names is itself
 *      compared byte for byte, so the allowance cannot hide a changed script.
 * Any difference — a changed script, an added file reference, a commit that
 * was never published — ends with exit code 1 and a list of what differs.
 *
 *   node scripts/verify-live.mjs --url https://the-live-site.example
 *
 * Options
 *   --branch <ref>   the public branch the commit must belong to (default origin/main)
 *   --ref <dir>      compare against an existing build folder instead of building
 *   --keep           keep the temporary checkout (to inspect a difference)
 *
 * The build must use the SAME public settings as the live one, because they
 * are compiled into the files: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * and, when set on the host, NEXT_PUBLIC_VAPID_PUBLIC_KEY,
 * NEXT_PUBLIC_GOVGR_ENABLED, NEXT_PUBLIC_BALLOT_DELAY_MAX_S,
 * NEXT_PUBLIC_BALLOT_RELAY_URL. They are read from
 * the environment, or from web/.env.local when run on a developer machine.
 * None of them is a secret.
 *
 * Who should run it: the scheduled workflow (.github/workflows/verify-live.yml)
 * does — but that workflow lives in the same repository as the code, so for a
 * real vote someone ELSE should run it too (any machine with git and Node; it
 * needs no credentials).
 *
 * What it cannot see: the hosting provider serving different files to
 * different visitors, or a change between two runs that is reverted in time.
 */

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_SETTINGS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'NEXT_PUBLIC_GOVGR_ENABLED', 'NEXT_PUBLIC_BALLOT_DELAY_MAX_S', 'NEXT_PUBLIC_BALLOT_RELAY_URL'];

function args() {
  const a = process.argv.slice(2); const out = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const k = a[i].slice(2);
    out[k] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
  }
  return out;
}
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

async function get(url) {
  const res = await fetch(url, { cache: 'no-store', redirect: 'follow' });
  return { status: res.status, body: Buffer.from(await res.arrayBuffer()) };
}

/** The commit the live site says it was built from. */
export async function liveCommit(base) {
  const { status, body } = await get(base + '/');
  if (status !== 200) throw new Error(`the live site answered HTTP ${status}`);
  const m = body.toString('utf8').match(/<meta[^>]+name="build-commit"[^>]+content="([^"]*)"/);
  return m ? m[1] : null;
}

function walk(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, base, out); else out.push(relative(base, p).split(sep).join('/'));
  }
  return out;
}
/** Where a file of the static export is served from. */
function urlPathOf(file) {
  const path = file === 'index.html' ? '' : file.endsWith('/index.html') ? file.slice(0, -'index.html'.length) : file;
  return '/' + path.split('/').map(encodeURIComponent).join('/');
}

// ── The one allowed difference: the order of webpack's chunk table ───────────
const RUNTIME = /^_next\/static\/chunks\/webpack-[0-9a-f]+\.js$/;
const RUNTIME_NAME = /webpack-[0-9a-f]{8,}\.js/g;
const TABLE_ENTRY = /\d+===\w+\?"static\/chunks\/[\w.-]+\.js":/g;
/** The runtime with its chunk-table entries sorted — two builds of the same
 *  code give the same result, whatever order the entries came out in. */
export function canonicalRuntime(text) {
  const entries = text.match(TABLE_ENTRY);
  if (!entries) return text;
  let first = true;
  return text.replace(TABLE_ENTRY, () => (first ? ((first = false), [...entries].sort().join('')) : ''));
}
/** Pages name the runtime file by its content hash, so that name differs
 *  whenever the table order does: blank it out before comparing a page. */
const isTextual = (file) => /\.(html|txt|js|json)$/.test(file);
const blankRuntimeName = (buf) => Buffer.from(buf.toString('latin1').replace(RUNTIME_NAME, 'webpack-X.js'), 'latin1');

/** Compare every file of a build folder with what the live site serves. */
export async function compare(base, refDir) {
  const files = walk(refDir).sort();
  const problems = [];
  const liveRuntimes = new Set();
  let i = 0;
  const worker = async () => {
    while (i < files.length) {
      const file = files[i++];
      if (RUNTIME.test(file)) continue; // handled below, under the name the LIVE pages use
      try {
        const { status, body } = await get(base + urlPathOf(file));
        // the not-found page is legitimately served with status 404
        if (status !== 200 && !(file === '404.html' || file.startsWith('404/'))) { problems.push(`missing on the live site (HTTP ${status}): ${file}`); continue; }
        const ref = readFileSync(join(refDir, file));
        if (isTextual(file)) {
          for (const name of body.toString('latin1').match(RUNTIME_NAME) ?? []) liveRuntimes.add(name);
          if (sha256(blankRuntimeName(body)) !== sha256(blankRuntimeName(ref))) problems.push(`DIFFERENT on the live site: ${file}`);
        } else if (sha256(body) !== sha256(ref)) problems.push(`DIFFERENT on the live site: ${file}`);
      } catch (e) {
        problems.push(`could not be downloaded (${e.message}): ${file}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));

  // The runtime: every live page must name the same one, and it must equal the
  // reference runtime once both chunk tables are put in the same order.
  const refRuntimes = files.filter((f) => RUNTIME.test(f));
  let note = '';
  if (refRuntimes.length !== 1) problems.push(`expected exactly one webpack runtime in the reference build, found ${refRuntimes.length}`);
  else if (liveRuntimes.size !== 1) problems.push(`the live pages name ${liveRuntimes.size} different runtime files (${[...liveRuntimes].join(', ')}) — expected one`);
  else {
    const liveName = [...liveRuntimes][0];
    const { status, body } = await get(`${base}/_next/static/chunks/${liveName}`);
    const ref = readFileSync(join(refDir, refRuntimes[0])).toString('utf8');
    if (status !== 200) problems.push(`missing on the live site (HTTP ${status}): _next/static/chunks/${liveName}`);
    else if (body.toString('utf8') === ref) note = '';
    else if (canonicalRuntime(body.toString('utf8')) === canonicalRuntime(ref)) note = 'the runtime file lists the same scripts in a different order (a known, harmless build variation)';
    else problems.push(`DIFFERENT on the live site: the webpack runtime (_next/static/chunks/${liveName})`);
  }
  return { files: files.length, problems: problems.sort(), note };
}

/** Build one commit from scratch in a temporary checkout → its out/ folder. */
function buildCommit(commit) {
  const dir = mkdtempSync(join(tmpdir(), 'lefkada-verify-'));
  git('worktree', 'add', '--detach', dir, commit);
  const web = join(dir, 'web');
  // Public settings: from the environment, else the developer's web/.env.local.
  const env = { ...process.env, BUILD_COMMIT: commit, NEXT_TELEMETRY_DISABLED: '1' };
  for (const k of PUBLIC_SETTINGS) if (env[k] === '') delete env[k]; // an empty setting is not the same as an absent one
  const local = join(REPO, 'web', '.env.local');
  if (!env.NEXT_PUBLIC_SUPABASE_URL && existsSync(local)) copyFileSync(local, join(web, '.env.local'));
  const run = (cmd, a) => execFileSync(cmd, a, { cwd: web, env, stdio: ['ignore', 'ignore', 'inherit'] });
  console.log('  installing dependencies (npm ci)…');
  run('npm', ['ci', '--no-audit', '--no-fund']);
  console.log('  building…');
  run('npx', ['next', 'build']);
  return { dir, out: join(web, 'out') };
}
function removeCheckout(dir) {
  try { git('worktree', 'remove', '--force', dir); } catch { rmSync(dir, { recursive: true, force: true }); }
}

async function main() {
  const a = args();
  if (typeof a.url !== 'string') { console.error('usage: node scripts/verify-live.mjs --url https://the-live-site [--branch origin/main] [--ref <build dir>] [--keep]'); process.exit(2); }
  const base = a.url.replace(/\/+$/, '');
  const branch = typeof a.branch === 'string' ? a.branch : 'origin/main';

  for (let attempt = 1; attempt <= 2; attempt++) {
    const commit = await liveCommit(base);
    console.log(`Live site ${base}\n  says it was built from: ${commit ?? '(no build-commit stamp)'}`);
    if (!commit || !/^[0-9a-f]{40}$/.test(commit)) {
      console.error('\n✗ The live site does not name a published commit — it cannot be matched to the public code.');
      process.exit(1);
    }

    let checkout = null;
    let refDir = typeof a.ref === 'string' ? a.ref : null;
    if (!refDir) {
      if (branch.startsWith('origin/')) { try { git('fetch', '--quiet', 'origin'); } catch { /* offline: use what is here */ } }
      try { git('merge-base', '--is-ancestor', commit, branch); }
      catch {
        console.error(`\n✗ Commit ${commit} is NOT part of ${branch} — the live site runs code that was never published there.`);
        process.exit(1);
      }
      console.log(`  ✓ that commit is part of ${branch}`);
      checkout = buildCommit(commit);
      refDir = checkout.out;
    }

    const { files, problems, note } = await compare(base, refDir);
    if (checkout && !a.keep) removeCheckout(checkout.dir);
    else if (checkout) console.log(`  (temporary checkout kept at ${checkout.dir})`);

    if (problems.length === 0) {
      console.log(`\n✓ The live site serves exactly the ${files} files built from commit ${commit.slice(0, 7)}.`);
      if (note) console.log(`  (${note})`);
      return;
    }
    // A deploy may have landed while we were building — look once more.
    if (attempt === 1 && !a.ref && (await liveCommit(base)) !== commit) {
      console.log('\n  the live site changed commit during the check — starting over once…\n');
      continue;
    }
    console.error(`\n✗ The live site does NOT match the build of commit ${commit.slice(0, 7)} — ${problems.length} problem(s):`);
    for (const p of problems.slice(0, 40)) console.error('   ' + p);
    if (problems.length > 40) console.error(`   … and ${problems.length - 40} more`);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error('✗ ' + (e.message || e)); process.exit(1); });
}
