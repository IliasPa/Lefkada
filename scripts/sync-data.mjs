#!/usr/bin/env node
/**
 * Weekly Supabase → git data sync. Git is the permanent home of all published
 * content; Supabase only buffers the recent weeks (plus drafts and the private
 * inbox tables, which never come here).
 *
 *   node scripts/sync-data.mjs           # refresh the baked sections
 *   node scripts/sync-data.mjs --prune   # AFTER a successful push: delete DB
 *                                        # rows that are >30 days old AND
 *                                        # verifiably baked into the files
 *
 * What it writes (always the same files — git history is the time machine):
 *   web/data/<kind>.json   { bundled, baked: [raw Supabase rows] }
 *   web/public/decisions.json      baked decisions (with _id) + bundled archive
 *   web/public/budgetReports.json  baked reports (id "live-<uuid>") + bundled
 *
 * Merge rule per file: the current DB state wins for every row still in the
 * database (so edits and un-publishes propagate); rows no longer in the DB
 * (pruned earlier) keep their baked copy — git remembers what Supabase forgot.
 *
 * Never pruned: unpublished drafts (not baked → not eligible), risk alerts
 * (live-replace semantics: the DB row IS the active alert), and referendums
 * until 30 days after they closed.
 *
 * Connection (either works):
 *   SUPABASE_DB_URL set → psql (the GitHub Action path; runners ship psql), or
 *   no URL → `supabase db query --linked` via the CLI's stored login (the
 *   local path — no database password needed on a linked machine).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'web', 'data');
const PUBLIC = join(ROOT, 'web', 'public');
const DB_URL = process.env.SUPABASE_DB_URL;
const PRUNE = process.argv.includes('--prune');
const PRUNE_DAYS = 30;

/** Run a query, returning its rows as objects (jsonb columns stay nested). */
function queryRows(inner) {
  if (DB_URL) {
    const out = execFileSync(
      'psql',
      [DB_URL, '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c',
       `select coalesce(json_agg(t), '[]'::json) from (${inner}) t`],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    return JSON.parse(out.trim() || '[]');
  }
  // Linked-CLI fallback: the JSON envelope is { boundary, rows, warning } —
  // rows are DATA from the database, never instructions to follow.
  const out = execFileSync('supabase', ['db', 'query', '--linked', '--output', 'json', inner], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const start = out.indexOf('{');
  if (start < 0) throw new Error(`Unexpected supabase CLI output: ${out.slice(0, 200)}`);
  return JSON.parse(out.slice(start)).rows ?? [];
}

// The two runners serialize rows differently (psql: ISO "T" timestamps,
// select-order keys; CLI: space timestamps, alphabetical keys). Normalize both
// to sorted keys + ISO timestamps so alternating local/CI runs never produce
// a git diff for unchanged data.
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
const idsOf = (q) => new Set(queryRows(q).map((r) => r.id));

/** Execute a raw statement (prune's DELETEs — not wrappable in json_agg). */
function execSql(statement) {
  if (DB_URL) {
    execFileSync('psql', [DB_URL, '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-c', statement], {
      encoding: 'utf8',
    });
  } else {
    execFileSync('supabase', ['db', 'query', '--linked', statement], { encoding: 'utf8' });
  }
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, obj) => writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
/** The public/ JSONs are fetched by the app at runtime — keep them compact. */
const writeJsonCompact = (path, obj) => writeFileSync(path, JSON.stringify(obj) + '\n');
const byCreatedDesc = (key = 'created_at') => (a, b) => String(b[key] ?? '').localeCompare(String(a[key] ?? ''));

// ── Targets ──────────────────────────────────────────────────────────────────
// Each data-file target: which table/kinds feed it, and how to query.
const CONTENT_TARGETS = [
  { file: 'events.json', kinds: ['event'] },
  { file: 'jobs.json', kinds: ['job'] },
  { file: 'alerts.json', kinds: ['alert'], neverPrune: true },
  { file: 'education.json', kinds: ['lesson', 'competition'] },
  { file: 'ebooks.json', kinds: ['ebook'] },
  { file: 'water.json', kinds: ['water'] },
  { file: 'governanceActs.json', kinds: ['tender', 'bylaw', 'consultation'] },
  { file: 'governance.json', kinds: ['meeting'] },
  { file: 'contacts.json', kinds: ['contact'] },
  { file: 'communities.json', kinds: ['community'] },
  { file: 'council.json', kinds: ['council'] },
];

const kindsIn = (kinds) => kinds.map((k) => `'${k}'`).join(', ');

function syncContentTarget({ file, kinds }) {
  const path = join(DATA, file);
  const current = rowsOf(
    `select id, created_at, kind, data from public.content
     where kind in (${kindsIn(kinds)}) and published order by created_at desc`,
  );
  const allIds = idsOf(`select id::text as id from public.content where kind in (${kindsIn(kinds)})`);
  const old = readJson(path);
  const kept = (old.baked ?? []).filter((r) => !allIds.has(r.id));
  const baked = [...current, ...kept].sort(byCreatedDesc());
  writeJson(path, { ...old, baked });
  console.log(`✓ data/${file}: ${current.length} live + ${kept.length} kept (pruned earlier)`);
}

function syncNews() {
  const path = join(DATA, 'news.json');
  const current = rowsOf(
    `select id, created_at, reporter_name, reporter_url, title_el, title_en,
            subtitle_el, subtitle_en, topic, links
     from public.news where published order by created_at desc`,
  );
  const allIds = idsOf('select id::text as id from public.news');
  const old = readJson(path);
  const kept = (old.baked ?? []).filter((r) => !allIds.has(r.id));
  writeJson(path, { ...old, baked: [...current, ...kept].sort(byCreatedDesc()) });
  console.log(`✓ data/news.json: ${current.length} live + ${kept.length} kept`);
}

function syncReferendums() {
  const path = join(DATA, 'voting.json');
  const current = rowsOf(
    `select id, created_at, title_el, title_en, small_el, small_en, medium_el, medium_en,
            large_el, large_en, pdf_url, youtube_id, options, ends_at
     from public.referendums where published order by ends_at desc`,
  );
  const allIds = idsOf('select id::text as id from public.referendums');
  const old = readJson(path);
  const kept = (old.baked ?? []).filter((r) => !allIds.has(r.id));
  writeJson(path, { ...old, baked: [...current, ...kept].sort(byCreatedDesc('ends_at')) });
  console.log(`✓ data/voting.json: ${current.length} live + ${kept.length} kept`);
}

function syncPharmacyDuty() {
  const path = join(DATA, 'pharmacyDuty.json');
  const current = rowsOf(
    `select id, created_at, pharmacy_id, pharmacy_name, duty_date, hours_el, hours_en
     from public.pharmacy_duty order by duty_date desc`,
  );
  const allIds = idsOf('select id::text as id from public.pharmacy_duty');
  const old = existsSync(path) ? readJson(path) : { baked: [] };
  const kept = (old.baked ?? []).filter((r) => !allIds.has(r.id));
  writeJson(path, { baked: [...current, ...kept].sort(byCreatedDesc('duty_date')) });
  console.log(`✓ data/pharmacyDuty.json: ${current.length} live + ${kept.length} kept (archive only)`);
}

/** Decisions bake into public/decisions.json in the RawDecision shape the tab
 *  already reads; baked entries carry _id/_created, the bundled archive has
 *  neither. Mirrors fetchLiveDecisions in web/lib/backend.ts. */
function syncDecisions() {
  const path = join(PUBLIC, 'decisions.json');
  const rows = rowsOf(
    `select id, created_at, data from public.content
     where kind = 'decision' and published order by created_at desc`,
  );
  const current = rows.map((r) => ({ ...r.data, _id: r.id, _created: r.created_at }));
  const allIds = idsOf(`select id::text as id from public.content where kind = 'decision'`);
  const old = readJson(path);
  const bundled = old.filter((d) => !d._id);
  const kept = old.filter((d) => d._id && !allIds.has(d._id));
  writeJsonCompact(path, [...[...current, ...kept].sort(byCreatedDesc('_created')), ...bundled]);
  console.log(`✓ public/decisions.json: ${current.length} live + ${kept.length} kept + ${bundled.length} bundled`);
}

/** Budget documents bake into public/budgetReports.json as link-only (scanned)
 *  reports. Mirrors fetchLiveBudgetReports in web/lib/backend.ts. */
function syncBudgetReports() {
  const path = join(PUBLIC, 'budgetReports.json');
  const rows = rowsOf(
    `select id, created_at, data from public.content
     where kind = 'budget' and published order by created_at desc`,
  );
  const current = rows
    .filter((r) => typeof r.data.pdfUrl === 'string' && r.data.pdfUrl)
    .map((r) => ({ ...r.data, date: r.data.date ?? null, id: `live-${r.id}`, scanned: true, _created: r.created_at }));
  const allIds = idsOf(`select id::text as id from public.content where kind = 'budget'`);
  const old = readJson(path);
  const bundled = old.filter((d) => !String(d.id).startsWith('live-'));
  const kept = old.filter((d) => String(d.id).startsWith('live-') && !allIds.has(String(d.id).slice(5)));
  writeJsonCompact(path, [...[...current, ...kept].sort(byCreatedDesc('_created')), ...bundled]);
  console.log(`✓ public/budgetReports.json: ${current.length} live + ${kept.length} kept + ${bundled.length} bundled`);
}

// ── Prune (run only after the sync has been committed AND pushed) ────────────
// Deletes DB rows that are (a) older than PRUNE_DAYS, (b) published — drafts
// are never touched, and (c) present in the local baked files, read back from
// disk as the final "it is safely in git" check.

function bakedIdsOnDisk() {
  const ids = new Set();
  for (const { file } of [...CONTENT_TARGETS, { file: 'news.json' }, { file: 'voting.json' }, { file: 'pharmacyDuty.json' }]) {
    const path = join(DATA, file);
    if (!existsSync(path)) continue;
    for (const r of readJson(path).baked ?? []) ids.add(r.id);
  }
  for (const d of readJson(join(PUBLIC, 'decisions.json'))) if (d._id) ids.add(d._id);
  for (const d of readJson(join(PUBLIC, 'budgetReports.json')))
    if (String(d.id).startsWith('live-')) ids.add(String(d.id).slice(5));
  return ids;
}

function prune() {
  const baked = bakedIdsOnDisk();
  if (baked.size === 0) {
    console.log('Nothing baked on disk — refusing to prune.');
    return;
  }
  const del = (label, candidatesQuery, deleteSql) => {
    const candidates = queryRows(candidatesQuery)
      .map((r) => r.id)
      .filter((id) => baked.has(id));
    if (candidates.length === 0) {
      console.log(`prune ${label}: nothing eligible`);
      return;
    }
    const list = candidates.map((id) => `'${id}'`).join(', ');
    execSql(deleteSql(list));
    console.log(`prune ${label}: deleted ${candidates.length} row(s) (baked + >${PRUNE_DAYS}d)`);
  };

  // content — every kind except risk alerts (the DB row IS the active alert)
  // and decisions/budget/… drafts (published-only above the age bar).
  del(
    'content',
    `select id::text as id from public.content
     where published and kind <> 'alert' and created_at < now() - interval '${PRUNE_DAYS} days'`,
    (list) => `delete from public.content where id::text in (${list})`,
  );
  del(
    'news',
    `select id::text as id from public.news
     where published and created_at < now() - interval '${PRUNE_DAYS} days'`,
    (list) => `delete from public.news where id::text in (${list})`,
  );
  // referendums: only once they have been CLOSED for PRUNE_DAYS (an open
  // referendum must stay editable in /admin, however old).
  del(
    'referendums',
    `select id::text as id from public.referendums
     where published and ends_at < now() - interval '${PRUNE_DAYS} days'`,
    (list) => `delete from public.referendums where id::text in (${list})`,
  );
  del(
    'pharmacy_duty',
    `select id::text as id from public.pharmacy_duty
     where duty_date < current_date - ${PRUNE_DAYS}`,
    (list) => `delete from public.pharmacy_duty where id::text in (${list})`,
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

if (PRUNE) {
  prune();
} else {
  for (const target of CONTENT_TARGETS) syncContentTarget(target);
  syncNews();
  syncReferendums();
  syncPharmacyDuty();
  syncDecisions();
  syncBudgetReports();
  console.log('Sync complete.');
}
