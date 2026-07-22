#!/usr/bin/env node
/**
 * Private data backup: Supabase → a PRIVATE git repo (Lefkada_private).
 *
 * The public sync (scripts/sync-data.mjs) archives PUBLISHED content into this
 * repo. This one archives the PRIVATE tables — roles, the inbox, applications,
 * the citizen registry, the referendum definitions (incl. their results
 * toggle), who participated, and the veto per-day counts — into a separate
 * private repo, so nothing is ever lost even after rows are deleted from
 * Supabase (mayor clears a message, a veto expires, …).
 *
 *   SUPABASE_DB_URL=… PRIVATE_DIR=/path/to/private-repo/data node scripts/backup-private.mjs
 *
 * Same philosophy as the public sync: the same files every run, git history is
 * the time machine, and the archive MERGES — the current DB state wins for
 * rows still present, and rows the DB has since deleted keep their last backed
 * copy (git remembers what Supabase forgot).
 *
 * WARNING: these files contain personal data (ΑΦΜ, emails, messages, job
 * applications). Keep the target repo PRIVATE.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DB_URL = process.env.SUPABASE_DB_URL;
const OUT = process.env.PRIVATE_DIR;
if (!DB_URL) { console.error('SUPABASE_DB_URL is required'); process.exit(1); }
if (!OUT) { console.error('PRIVATE_DIR is required'); process.exit(1); }
mkdirSync(OUT, { recursive: true });

/** Run a query, returning its rows as objects (jsonb columns stay nested). */
function queryRows(inner) {
  const out = execFileSync(
    'psql',
    [DB_URL, '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c',
     `select coalesce(json_agg(t), '[]'::json) from (${inner}) t`],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(out.trim() || '[]');
}

// Normalize to sorted keys + ISO timestamps so unchanged data never diffs.
const SPACE_TS = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?)([+-]\d{2})(?::?(\d{2}))?$/;
const normTs = (v) =>
  typeof v === 'string' && SPACE_TS.test(v)
    ? v.replace(SPACE_TS, (_, d, t, h, m) => `${d}T${t}${h}:${m || '00'}`)
    : v;
function normalizeRow(row) {
  const out = {};
  for (const k of Object.keys(row).sort()) out[k] = normTs(row[k]);
  return out;
}
const rowsOf = (q) => queryRows(q).map(normalizeRow);

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, obj) => writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');

// ── Full-table archives (merge by primary key; deleted rows keep their copy) ──
const TABLES = [
  { name: 'app_roles',                key: 'user_id' },
  { name: 'applications',             key: 'id' },
  { name: 'citizens',                 key: 'user_id' },
  { name: 'folders',                  key: 'id' },
  { name: 'messages',                 key: 'id' },
  { name: 'referendums_participants', key: 'id' },
  { name: 'referendums',              key: 'id' },
];

for (const t of TABLES) {
  const path = join(OUT, `${t.name}.json`);
  const current = rowsOf(`select * from public.${t.name}`);
  const old = existsSync(path) ? readJson(path) : { rows: [] };
  const liveKeys = new Set(current.map((r) => r[t.key]));
  const kept = (old.rows ?? []).filter((r) => !liveKeys.has(r[t.key]));
  const rows = [...current, ...kept].sort((a, b) =>
    String(a[t.key]).localeCompare(String(b[t.key])));
  writeJson(path, { table: t.name, key: t.key, rows });
  console.log(`✓ ${t.name}.json: ${current.length} live + ${kept.length} kept`);
}

// ── Vetos → per-day counts (the truth for the admin bar chart) ────────────────
// Rows live only 7 days, so this must run at least daily. A veto_date's count
// only grows while its rows exist, then freezes — so max-merging each run keeps
// the final daily count forever, long after the rows are deleted.
{
  const path = join(OUT, 'vetos.json');
  const current = rowsOf(
    'select veto_date, count(*)::int as count from public.vetos group by veto_date');
  const old = existsSync(path) ? readJson(path) : { perDay: {} };
  const perDay = { ...(old.perDay ?? {}) };
  for (const r of current) {
    const d = String(r.veto_date).slice(0, 10);
    perDay[d] = Math.max(perDay[d] ?? 0, r.count);
  }
  const sorted = {};
  for (const k of Object.keys(perDay).sort()) sorted[k] = perDay[k];
  writeJson(path, { perDay: sorted });
  console.log(`✓ vetos.json: ${Object.keys(sorted).length} day(s) total`);
}

console.log('Private backup complete.');
