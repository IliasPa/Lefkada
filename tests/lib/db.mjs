// A local Postgres (PGlite, in memory) loaded with Supabase-like stubs and the
// project's real supabase/schema.sql — so the database rules are exercised for
// real, without any Supabase project.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SCHEMA = join(ROOT, 'supabase', 'schema.sql');

/** What Supabase provides around the schema: auth helpers, API roles, storage. */
export const STUBS = `
create schema if not exists auth; create schema if not exists storage; create schema if not exists extensions;
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $fn$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::json->>'sub', '')::uuid $fn$;
create function auth.email() returns text language sql stable as $fn$
  select nullif(current_setting('request.jwt.claims', true), '')::json->>'email' $fn$;
create function auth.role() returns text language sql stable as $fn$
  select nullif(current_setting('request.jwt.claims', true), '')::json->>'role' $fn$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text);
alter table storage.objects enable row level security;
grant usage on schema public, auth, extensions to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

/** A fresh database with the schema applied TWICE (the file promises to be re-runnable). */
export async function makeDb(schemaSql = readFileSync(SCHEMA, 'utf8')) {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(STUBS);
  await db.exec(schemaSql);
  await db.exec(schemaSql);
  return db;
}

/** Run fn as an API caller: role = anon | authenticated | service_role. */
export async function as(db, { role = 'authenticated', sub = '', email = '' }, fn) {
  const claims = JSON.stringify({ sub, email, role });
  await db.exec(`select set_config('request.jwt.claims', '${claims}', false); set role ${role};`);
  try { return await fn(); }
  finally { await db.exec(`reset role; select set_config('request.jwt.claims', '', false);`); }
}

export async function expectError(promise, pattern, label) {
  try { await promise; } catch (e) {
    if (pattern.test(e.message) || pattern.test(e.code ?? '')) { console.log('  ✓', label); return; }
    throw new Error(`${label}: wrong error: ${e.code} ${e.message}`);
  }
  throw new Error(`${label}: expected a refusal, but it succeeded`);
}
export const ok = (cond, label) => { if (!cond) throw new Error('FAIL: ' + label); console.log('  ✓', label); };
export const section = (title) => console.log(title);
