-- ═══════════════════════════════════════════════════════════════════════════
-- Lefkada civic app — Supabase schema (v1.0)
-- Run this whole file once in the Supabase dashboard: SQL Editor → New query.
-- Safe to re-run: everything is IF NOT EXISTS / OR REPLACE / DROP POLICY first.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Roles ────────────────────────────────────────────────────────────────────
-- Maps an auth user to what they are allowed to do. Rows are inserted manually
-- (SQL editor) — there is NO client-side way to grant a role.
create table if not exists public.app_roles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null check (role in ('mayor', 'reporter', 'pharmacy')),
  -- for role='pharmacy': which pharmacy this account manages (id from data/pharmacies.ts)
  pharmacy_id  text,
  -- shown as the byline for reporters / pharmacy name
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.app_roles enable row level security;

-- security definer: bypasses RLS so policies can call it without recursion
create or replace function public.has_role(r text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.app_roles
    where user_id = auth.uid() and role = r
  );
$$;

drop policy if exists "read own role" on public.app_roles;
create policy "read own role" on public.app_roles
  for select using (user_id = auth.uid() or public.has_role('mayor'));

-- ── Folders (mayor's tagging system for messages & candidates) ───────────────
create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null default '#0D5EAF',
  -- 'messages' or 'applications' — which admin view the folder belongs to
  scope      text not null default 'messages' check (scope in ('messages', 'applications')),
  position   int  not null default 0,
  created_at timestamptz not null default now()
);
alter table public.folders enable row level security;
drop policy if exists "mayor all folders" on public.folders;
create policy "mayor all folders" on public.folders
  for all using (public.has_role('mayor')) with check (public.has_role('mayor'));

-- ── Messages to the mayor ────────────────────────────────────────────────────
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  body         text not null check (char_length(body) between 1 and 5000),
  anonymous    boolean not null default true,
  sender_name  text check (char_length(sender_name) <= 200),
  sender_email text check (char_length(sender_email) <= 200),
  folder_id    uuid references public.folders (id) on delete set null,
  tags         text[] not null default '{}',
  read         boolean not null default false
);
alter table public.messages enable row level security;
drop policy if exists "anyone can send" on public.messages;
create policy "anyone can send" on public.messages
  for insert to anon, authenticated with check (true);
drop policy if exists "mayor reads messages" on public.messages;
create policy "mayor reads messages" on public.messages
  for select using (public.has_role('mayor'));
drop policy if exists "mayor updates messages" on public.messages;
create policy "mayor updates messages" on public.messages
  for update using (public.has_role('mayor'));
drop policy if exists "mayor deletes messages" on public.messages;
create policy "mayor deletes messages" on public.messages
  for delete using (public.has_role('mayor'));

-- ── Job applications ─────────────────────────────────────────────────────────
create table if not exists public.applications (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  job_id     text not null,
  job_title  text not null,
  name       text not null check (char_length(name) between 1 and 200),
  email      text not null check (char_length(email) between 3 and 200),
  -- storage path inside the private 'cvs' bucket ('' when no CV was attached)
  cv_path    text not null default '',
  folder_id  uuid references public.folders (id) on delete set null,
  tags       text[] not null default '{}',
  status     text not null default 'new' check (status in ('new', 'shortlist', 'rejected'))
);
alter table public.applications enable row level security;
drop policy if exists "anyone can apply" on public.applications;
create policy "anyone can apply" on public.applications
  for insert to anon, authenticated with check (true);
drop policy if exists "mayor reads applications" on public.applications;
create policy "mayor reads applications" on public.applications
  for select using (public.has_role('mayor'));
drop policy if exists "mayor updates applications" on public.applications;
create policy "mayor updates applications" on public.applications
  for update using (public.has_role('mayor'));
drop policy if exists "mayor deletes applications" on public.applications;
create policy "mayor deletes applications" on public.applications
  for delete using (public.has_role('mayor'));

-- ── Referendums ──────────────────────────────────────────────────────────────
-- The referendum definition AND (v1.4) its results-visibility switch — the old
-- poll_results table was merged in here, since the labels it snapshotted are
-- already these columns.
--   published         — the referendum is live in the app (people can vote).
--   results_published — the mayor has revealed this poll's LIVE results inside
--                       the voting section (independent of `published`; when
--                       false a voter sees only their own choice). It opens the
--                       poll's referendums_results rows for public reading.
create table if not exists public.referendums (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  title_el          text not null,
  title_en          text not null default '',
  small_el          text not null default '',
  small_en          text not null default '',
  medium_el         text not null default '',
  medium_en         text not null default '',
  large_el          text not null default '',
  large_en          text not null default '',
  pdf_url           text not null default '',
  youtube_id        text not null default '',
  -- [{ "id": "a", "el": "...", "en": "..." }, ...]
  options           jsonb not null default '[]',
  ends_at           timestamptz not null,
  published         boolean not null default false,
  results_published boolean not null default false
);
-- Upgrade older databases in place (poll_results merge).
alter table public.referendums add column if not exists updated_at timestamptz not null default now();
alter table public.referendums add column if not exists results_published boolean not null default false;
alter table public.referendums enable row level security;
drop policy if exists "public reads published referendums" on public.referendums;
create policy "public reads published referendums" on public.referendums
  for select using (published or public.has_role('mayor'));
drop policy if exists "mayor writes referendums" on public.referendums;
create policy "mayor writes referendums" on public.referendums
  for all using (public.has_role('mayor')) with check (public.has_role('mayor'));

-- ── Generic managed content ──────────────────────────────────────────────────
-- One table for every content kind the mayor manages from /admin. `data` holds
-- the exact JSON shape the frontend already uses for that kind.
create table if not exists public.content (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kind       text not null,
  data       jsonb not null,
  published  boolean not null default true
);

-- Allowed kinds — kept as a separate named constraint so re-running this file
-- upgrades existing databases when new kinds are added
-- (v1.1: water, lesson, competition · v1.2: meeting, ebook, contact, community).
alter table public.content drop constraint if exists content_kind_check;
alter table public.content add constraint content_kind_check check (kind in
  ('alert', 'job', 'event', 'decision', 'tender', 'bylaw',
   'consultation', 'council', 'budget', 'water', 'lesson', 'competition',
   'meeting', 'ebook', 'contact', 'community'));
create index if not exists content_kind_idx on public.content (kind, published);
alter table public.content enable row level security;
drop policy if exists "public reads published content" on public.content;
create policy "public reads published content" on public.content
  for select using (published or public.has_role('mayor'));
drop policy if exists "mayor writes content" on public.content;
create policy "mayor writes content" on public.content
  for all using (public.has_role('mayor')) with check (public.has_role('mayor'));

-- ── News (reporters) ─────────────────────────────────────────────────────────
create table if not exists public.news (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  created_by    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reporter_name text not null default '',
  reporter_url  text not null default '',
  title_el      text not null,
  title_en      text not null default '',
  subtitle_el   text not null default '',
  subtitle_en   text not null default '',
  topic         text not null default 'Council' check (topic in
                ('Infrastructure', 'Tourism', 'Events', 'Council', 'Environment', 'Culture')),
  -- { "instagram": "...", "facebook": "...", "twitter": "..." }
  links         jsonb not null default '{}',
  published     boolean not null default true
);
alter table public.news enable row level security;
drop policy if exists "public reads published news" on public.news;
create policy "public reads published news" on public.news
  for select using (published or created_by = auth.uid() or public.has_role('mayor'));
drop policy if exists "reporters insert news" on public.news;
create policy "reporters insert news" on public.news
  for insert to authenticated
  with check ((public.has_role('reporter') or public.has_role('mayor')) and created_by = auth.uid());
drop policy if exists "own or mayor updates news" on public.news;
create policy "own or mayor updates news" on public.news
  for update using (created_by = auth.uid() or public.has_role('mayor'));
drop policy if exists "own or mayor deletes news" on public.news;
create policy "own or mayor deletes news" on public.news
  for delete using (created_by = auth.uid() or public.has_role('mayor'));

-- ── Pharmacy on-duty schedule ────────────────────────────────────────────────
create table if not exists public.pharmacy_duty (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  created_by    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- id from data/pharmacies.ts (p1…p6) so the app can match the pharmacy card
  pharmacy_id   text not null,
  pharmacy_name text not null default '',
  duty_date     date not null,
  hours_el      text not null default 'Εφημερία όλο το 24ωρο',
  hours_en      text not null default 'On duty 24h',
  unique (pharmacy_id, duty_date)
);
alter table public.pharmacy_duty enable row level security;
drop policy if exists "public reads duty" on public.pharmacy_duty;
create policy "public reads duty" on public.pharmacy_duty
  for select using (true);
drop policy if exists "pharmacy inserts own duty" on public.pharmacy_duty;
create policy "pharmacy inserts own duty" on public.pharmacy_duty
  for insert to authenticated
  with check (public.has_role('mayor') or (public.has_role('pharmacy') and created_by = auth.uid()));
drop policy if exists "pharmacy updates own duty" on public.pharmacy_duty;
create policy "pharmacy updates own duty" on public.pharmacy_duty
  for update using (created_by = auth.uid() or public.has_role('mayor'));
drop policy if exists "pharmacy deletes own duty" on public.pharmacy_duty;
create policy "pharmacy deletes own duty" on public.pharmacy_duty
  for delete using (created_by = auth.uid() or public.has_role('mayor'));

-- ── Referendum results (v1.4) ────────────────────────────────────────────────
-- WHO voted is split from WHAT they chose so nobody — not even the mayor with
-- full DB access — can find who voted what.
--   · referendums_results : the choice, aggregated only — (poll_id,
--       option_id INT, residency, votes). Incremented atomically by cast_vote();
--       it holds counts like «A(resident):3, B(other):5», never a ballot tied
--       to a voter — so nobody can ever see WHO voted WHAT.
--   · referendums_participants (below) : WHO voted, and its unique(poll_id,
--       user_id) is the one-vote-per-account gate.
-- There is deliberately NO table anywhere linking a voter to their option.
-- (v1.4: the old `votes` table was removed — its dedup job moved to
-- referendums_participants and its counts are derived from the tallies.)
do $$ begin
  drop table if exists public.votes cascade; -- removed in v1.4
  alter table if exists public.vote_tallies rename to referendums_results;
end $$;
create table if not exists public.referendums_results (
  -- 'ref_<uuid>' for /admin referendums, the bundled poll id otherwise
  poll_id   text not null check (char_length(poll_id) between 1 and 80),
  option_id smallint not null check (option_id between 0 and 25),
  residency boolean not null,
  votes     integer not null default 0,
  unique (poll_id, option_id, residency)
);
alter table public.referendums_results enable row level security;
-- Public read only for referendums whose results the mayor has revealed (the
-- «public reads revealed results» policy is defined after cast_vote below);
-- writes come only from cast_vote(). The mayor may always read.
drop policy if exists "mayor reads tallies" on public.referendums_results;
drop policy if exists "mayor reads results" on public.referendums_results;
create policy "mayor reads results" on public.referendums_results
  for select using (public.has_role('mayor'));
drop policy if exists "mayor deletes tallies" on public.referendums_results;
drop policy if exists "mayor deletes results" on public.referendums_results;
create policy "mayor deletes results" on public.referendums_results
  for delete using (public.has_role('mayor'));

-- ── Vetos (rolling 7-day, date-only) ─────────────────────────────────────────
-- CONFIRMED Δημότες only (cast_veto() below enforces it — there is no
-- `residency` column because a non-Δημότης can never get a row). A veto stays
-- ACTIVE for 7 days from the day it was cast, then stops counting; there is no
-- weekly Monday reset. Privacy: only two columns — `veto_date` (the Athens
-- calendar date it was cast, YYYY-MM-DD) and `voter_key`, which is hashed with
-- the week's Monday so it CHANGES weekly (archived weeks stay unlinkable). NO
-- primary key, NO timestamp. `unique(voter_key)` means a second veto in the
-- same week is a no-op; a new week is a new key, so renewal is automatic. A
-- daily workflow deletes rows older than 7 days (the counts below already
-- filter by date regardless).
do $$ begin
  drop table if exists public.veto_events;
  -- v1.4 migration: drop the old (id / day / official_resident) shape.
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'vetos'
               and column_name in ('id', 'day', 'official_resident')) then
    drop table public.vetos cascade;
  end if;
end $$;
create table if not exists public.vetos (
  veto_date date not null,
  voter_key text not null check (voter_key ~ '^[0-9a-f]{64}$'),
  unique (voter_key)
);
alter table public.vetos enable row level security;
drop policy if exists "anyone vetos" on public.vetos;
drop policy if exists "mayor reads vetos" on public.vetos;
create policy "mayor reads vetos" on public.vetos
  for select using (public.has_role('mayor'));
drop policy if exists "mayor deletes vetos" on public.vetos;
create policy "mayor deletes vetos" on public.vetos
  for delete using (public.has_role('mayor'));

-- ── Verified voting (v1.4) ───────────────────────────────────────────────────
-- Free identity tier: Supabase email OTP — citizens sign in from the app's
-- profile. Votes are written by cast_vote() (below), vetos by a direct insert
-- the «citizens veto» policy guards; both derive residency from the registry
-- server-side, so it is always correct and never client-settable. gov.gr OAuth
-- later reuses all of this unchanged — it also lands as an auth user.
create extension if not exists pgcrypto with schema extensions;

-- WHO took part — the electoral roll. Its unique(poll_id, user_id) is ALSO the
-- one-vote-per-account gate (cast_vote() inserts here first; a second vote hits
-- the unique violation and rolls the whole ballot back). It never holds the
-- choice. `tax_number` is copied from the registry ONLY when it is set there —
-- which happens only for gov.gr-verified citizens (v1.4) — so a filled ΑΦΜ IS
-- the "verified via gov.gr" signal (the old verified_via column is gone).
do $$ begin
  alter table if exists public.poll_participants rename to referendums_participants;
end $$;
create table if not exists public.referendums_participants (
  id         uuid primary key default gen_random_uuid(),
  poll_id    text not null check (char_length(poll_id) between 1 and 80),
  user_id    uuid not null,
  email      text not null default '',
  tax_number text not null default '',
  unique (poll_id, user_id)
);
alter table public.referendums_participants drop column if exists resident;
alter table public.referendums_participants drop column if exists verified_via;
alter table public.referendums_participants add column if not exists tax_number text not null default '';
alter table public.referendums_participants enable row level security;
-- No client insert policy: cast_vote() (security definer) is the only writer,
-- so participation is always recorded together with the ballot.
drop policy if exists "verified users record own participation" on public.referendums_participants;
drop policy if exists "mayor reads participants" on public.referendums_participants;
create policy "mayor reads participants" on public.referendums_participants
  for select using (public.has_role('mayor'));
drop policy if exists "mayor deletes participants" on public.referendums_participants;
create policy "mayor deletes participants" on public.referendums_participants
  for delete using (public.has_role('mayor'));

-- poll_results was merged into the referendums table (results_published +
-- updated_at); the labels it snapshotted are already referendums columns.
drop table if exists public.poll_results cascade;

-- The citizen registry (μητρώο): one row per verified account that has
-- connected to the app. The citizen writes their own NAME (synced from their
-- profile — optional, zero friction). `tax_number` is NOT self-declared — an
-- unverified ΑΦΜ can't prove identity, so a trigger blocks the client from
-- setting it; it is reserved for the future gov.gr flow (a server-side service
-- role) and the mayor. The `resident` flag is likewise the MUNICIPALITY's: the
-- mayor toggles it in /admin ▸ Δημοψηφίσματα ▸ Ψηφοφόροι.
create table if not exists public.citizens (
  user_id         uuid primary key,
  email           text not null default '',
  full_name       text not null default '',
  tax_number      text not null default '',
  resident        boolean not null default false,
  resident_set_at timestamptz,
  updated_at      timestamptz not null default now()
);
alter table public.citizens enable row level security;

create or replace function public.citizens_guard()
returns trigger language plpgsql as $$
begin
  -- Guard only API requests (they carry JWT claims). Direct SQL — the
  -- dashboard editor or psql as postgres — stays free for maintenance.
  if coalesce(current_setting('request.jwt.claims', true), '') <> ''
     and not public.has_role('mayor') then
    if tg_op = 'INSERT' and (new.resident or new.resident_set_at is not null) then
      raise exception 'resident flag is set by the municipality';
    end if;
    if tg_op = 'UPDATE' and (new.resident is distinct from old.resident
                             or new.resident_set_at is distinct from old.resident_set_at) then
      raise exception 'resident flag is set by the municipality';
    end if;
    -- ΑΦΜ is only trustworthy via gov.gr — the client may never set it.
    if tg_op = 'INSERT' and coalesce(new.tax_number, '') <> '' then
      raise exception 'tax number comes from gov.gr verification';
    end if;
    if tg_op = 'UPDATE' and new.tax_number is distinct from old.tax_number then
      raise exception 'tax number comes from gov.gr verification';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.resident is distinct from old.resident then
    new.resident_set_at = now();
  end if;
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists citizens_guard on public.citizens;
create trigger citizens_guard before insert or update on public.citizens
  for each row execute function public.citizens_guard();

drop policy if exists "own or mayor reads citizens" on public.citizens;
create policy "own or mayor reads citizens" on public.citizens
  for select using (user_id = auth.uid() or public.has_role('mayor'));
drop policy if exists "citizen inserts own row" on public.citizens;
create policy "citizen inserts own row" on public.citizens
  for insert to authenticated
  with check (user_id = auth.uid() and email = coalesce(auth.email(), ''));
drop policy if exists "citizen updates own row" on public.citizens;
create policy "citizen updates own row" on public.citizens
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and email = coalesce(auth.email(), ''));
drop policy if exists "mayor updates citizens" on public.citizens;
create policy "mayor updates citizens" on public.citizens
  for update using (public.has_role('mayor')) with check (public.has_role('mayor'));
drop policy if exists "mayor deletes citizens" on public.citizens;
create policy "mayor deletes citizens" on public.citizens
  for delete using (public.has_role('mayor'));

-- Today's Athens calendar date — the veto window is the last 7 of these.
create or replace function public.athens_today(at timestamptz default now())
returns date language sql stable set search_path = public as $$
  select (at at time zone 'Europe/Athens')::date;
$$;
-- The Monday of today's Athens calendar week — the veto voter_key is hashed
-- with it, so it CHANGES every week (archived weeks stay unlinkable).
create or replace function public.athens_veto_week(at timestamptz default now())
returns date language sql stable set search_path = public as $$
  select (public.athens_today(at)
          - ((extract(isodow from public.athens_today(at))::int - 1)))::date;
$$;

-- ── cast_vote(): the ONLY writer of the ballot ───────────────────────────────
-- Runs as SECURITY DEFINER so it can write both tables atomically while the
-- caller can write neither directly. The participation insert is the
-- one-vote-per-account gate — its unique(poll_id, user_id) raises 23505 on a
-- second attempt, which rolls back the whole ballot (surfaced to the app as
-- "already voted"). It stamps residency + the (gov.gr-only) ΑΦΜ from the
-- registry, and records the choice ONLY as an aggregate count — so nothing ever
-- links a voter to their option. p_option is the 0-based ballot index.
create or replace function public.cast_vote(p_poll_id text, p_option int)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_res boolean;
  v_tax text;
begin
  if auth.uid() is null then
    raise exception 'sign in to vote' using errcode = '42501';
  end if;
  select coalesce(c.resident, false), coalesce(c.tax_number, '')
    into v_res, v_tax
    from public.citizens c where c.user_id = auth.uid();
  v_res := coalesce(v_res, false);
  -- one ballot per account per poll — a second call raises unique_violation
  insert into public.referendums_participants (poll_id, user_id, email, tax_number)
    values (p_poll_id, auth.uid(), coalesce(auth.email(), ''), coalesce(v_tax, ''));
  -- the anonymised choice — counts only, never tied to the voter above
  insert into public.referendums_results (poll_id, option_id, residency, votes)
    values (p_poll_id, p_option, v_res, 1)
    on conflict (poll_id, option_id, residency)
      do update set votes = public.referendums_results.votes + 1;
end $$;
revoke all on function public.cast_vote(text, int) from public;
grant execute on function public.cast_vote(text, int) to authenticated;

-- The voting screen may read a poll's results ONLY while the mayor has revealed
-- them (referendums.results_published). poll_id is 'ref_<uuid>'.
drop policy if exists "public reads revealed results" on public.referendums_results;
create policy "public reads revealed results" on public.referendums_results
  for select using (
    public.has_role('mayor')
    or exists (select 1 from public.referendums r
               where 'ref_' || r.id::text = referendums_results.poll_id
                 and r.results_published)
  );

-- ── cast_veto(): the ONLY writer of vetos ────────────────────────────────────
-- SECURITY DEFINER, mirroring cast_vote(). Confirmed Δημότες only. The
-- voter_key is hashed with the WEEK's Monday, so it CHANGES every week: a
-- second veto in the same week hits the same key (unique(voter_key)) and is a
-- no-op, while a new week is a new key — the renewal is automatic, so there is
-- nothing to check or clear. The caller can't write the table directly (no
-- INSERT policy exists), so there is no way to backdate, impersonate, or veto
-- as a non-Δημότης.
create or replace function public.cast_veto()
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_key text := encode(digest(
    'lefkada-verified-v1:' || auth.uid()::text || ':veto:' || public.athens_veto_week()::text,
    'sha256'), 'hex');
begin
  if auth.uid() is null then
    raise exception 'sign in to veto' using errcode = '42501';
  end if;
  if not coalesce((select c.resident from public.citizens c where c.user_id = auth.uid()), false) then
    raise exception 'confirmed residents only' using errcode = '42501';
  end if;
  insert into public.vetos (veto_date, voter_key) values (public.athens_today(), v_key)
    on conflict (voter_key) do nothing;
end $$;
revoke all on function public.cast_veto() from public;
grant execute on function public.cast_veto() to authenticated;

drop policy if exists "citizen vetos prove identity" on public.vetos;
drop policy if exists "citizens veto" on public.vetos;

-- ── Web-push subscriptions ───────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  endpoint     text not null unique,
  -- full PushSubscription JSON (endpoint + keys)
  subscription jsonb not null
);
alter table public.push_subscriptions enable row level security;
-- NOTE: the app INSERTs plainly and treats a 23505 duplicate-endpoint error as
-- "already subscribed". Do NOT switch it to upsert: Postgres runs this table's
-- SELECT policies for the ON CONFLICT arbiter check, and citizens (anon) may
-- not read subscriptions — an upsert therefore always fails RLS. (Adding a
-- public SELECT policy instead would expose every device's push endpoint.)
drop policy if exists "anyone subscribes" on public.push_subscriptions;
create policy "anyone subscribes" on public.push_subscriptions
  for insert to anon, authenticated with check (true);
drop policy if exists "mayor reads subscriptions" on public.push_subscriptions;
create policy "mayor reads subscriptions" on public.push_subscriptions
  for select using (public.has_role('mayor'));
drop policy if exists "mayor deletes subscriptions" on public.push_subscriptions;
create policy "mayor deletes subscriptions" on public.push_subscriptions
  for delete using (public.has_role('mayor'));

-- ── Storage buckets ──────────────────────────────────────────────────────────
-- cvs: PRIVATE — citizens upload, only the mayor can read (signed URLs).
-- docs: PUBLIC — referendum / job PDFs uploaded by the mayor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 10485760,
        array['application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('docs', 'docs', true, 20971520, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "anyone uploads cvs" on storage.objects;
create policy "anyone uploads cvs" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'cvs');
drop policy if exists "mayor reads cvs" on storage.objects;
create policy "mayor reads cvs" on storage.objects
  for select using (bucket_id = 'cvs' and public.has_role('mayor'));
drop policy if exists "mayor deletes cvs" on storage.objects;
create policy "mayor deletes cvs" on storage.objects
  for delete using (bucket_id = 'cvs' and public.has_role('mayor'));

drop policy if exists "public reads docs" on storage.objects;
create policy "public reads docs" on storage.objects
  for select using (bucket_id = 'docs');
drop policy if exists "mayor writes docs" on storage.objects;
create policy "mayor writes docs" on storage.objects
  for insert to authenticated with check (bucket_id = 'docs' and public.has_role('mayor'));
drop policy if exists "mayor updates docs" on storage.objects;
create policy "mayor updates docs" on storage.objects
  for update using (bucket_id = 'docs' and public.has_role('mayor'));
drop policy if exists "mayor deletes docs" on storage.objects;
create policy "mayor deletes docs" on storage.objects
  for delete using (bucket_id = 'docs' and public.has_role('mayor'));

-- ── Starter folders for the inbox ────────────────────────────────────────────
insert into public.folders (name, color, scope, position)
select v.name, v.color, v.scope, v.position
from (values
  ('Σημαντικά',   '#DC2626', 'messages', 0),
  ('Αιτήματα',    '#0D5EAF', 'messages', 1),
  ('Παράπονα',    '#E4802C', 'messages', 2),
  ('Ιδέες',       '#16A34A', 'messages', 3),
  ('Shortlist',   '#16A34A', 'applications', 0),
  ('Αρχείο',      '#6B7280', 'applications', 1)
) as v(name, color, scope, position)
where not exists (select 1 from public.folders);

-- ═══════════════════════════════════════════════════════════════════════════
-- AFTER RUNNING THIS FILE, grant yourself the mayor role (replace nothing —
-- the email is already yours). Run this as a separate query AFTER you have
-- created the user in Authentication → Users:
--
--   insert into public.app_roles (user_id, role, display_name)
--   select id, 'mayor', 'Δήμαρχος'
--   from auth.users where email = 'iliasparaskevas3@gmail.com'
--   on conflict (user_id) do update set role = 'mayor';
--
-- For a reporter:
--   insert into public.app_roles (user_id, role, display_name)
--   select id, 'reporter', 'Lefkada Press'
--   from auth.users where email = 'REPORTER_EMAIL_HERE';
--
-- For a pharmacy (pharmacy_id must match data/pharmacies.ts, e.g. p1…p6):
--   insert into public.app_roles (user_id, role, pharmacy_id, display_name)
--   select id, 'pharmacy', 'p1', 'Φαρμακείο Καββαδάς'
--   from auth.users where email = 'PHARMACY_EMAIL_HERE';
--
-- v1.4 ONE-TIME CLEANUP — delete every existing referendum entry (run once, in
-- a separate query; it is NOT part of the idempotent schema above so it can't
-- wipe referendums on a later re-run). Their results/participants go with them
-- so nothing is left orphaned:
--
--   delete from public.referendums_results
--     where poll_id in (select 'ref_' || id::text from public.referendums);
--   delete from public.referendums_participants
--     where poll_id in (select 'ref_' || id::text from public.referendums);
--   delete from public.referendums;
-- ═══════════════════════════════════════════════════════════════════════════
