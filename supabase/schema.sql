-- ═══════════════════════════════════════════════════════════════════════════
-- Lefkada civic app — Supabase schema (v1.0 → v2.1)
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
-- v1.7 — per-referendum PROTECTIONS (the mayor picks them per poll; the app
-- shows citizens every protection a poll does NOT use):
--   hide_until_close — nobody, the mayor included, can read results while the
--                      poll is open (poll_state() below is the only reader).
--   min_votes        — results stay hidden below this many ballots, and the
--                      Δημότες / non-Δημότες split is merged while either
--                      group is smaller than it (a lone voter is never exposed).
alter table public.referendums add column if not exists hide_until_close boolean not null default false;
alter table public.referendums add column if not exists min_votes integer not null default 0;
alter table public.referendums drop constraint if exists referendums_min_votes_check;
alter table public.referendums add constraint referendums_min_votes_check check (min_votes between 0 and 100000);
-- v1.8 — ANONYMOUS BALLOTS (blind-signed tickets; see «Anonymous ballots» below)
--   anonymous_ballots — the ballot travels WITHOUT the voter's account: the
--                       server signs a ticket it cannot see, and later accepts
--                       one ballot per valid ticket. It can check «one person,
--                       one vote» but cannot link a ballot to a person.
--                       Requires hide_until_close (watching live results would
--                       undo it).
--   ticket_keys       — the two PUBLIC ticket keys of this referendum
--                       { "resident": <SPKI base64>, "other": <SPKI base64> },
--                       written only by the ballot-ticket Edge Function.
alter table public.referendums add column if not exists anonymous_ballots boolean not null default false;
alter table public.referendums add column if not exists ticket_keys jsonb;
alter table public.referendums drop constraint if exists referendums_anonymous_check;
alter table public.referendums add constraint referendums_anonymous_check
  check (not anonymous_ballots or hide_until_close);
-- v1.9 — ENCRYPTED BALLOTS (see «Encrypted ballots» below)
--   encrypted_ballots      — the phone encrypts the choice to this
--                            referendum's public key; the database holds only
--                            ciphertext, so no tally exists (for anyone, with
--                            any access) until the key holder counts after
--                            closing. Requires anonymous_ballots: the ballots
--                            are opened one by one, so they must carry no voter.
--   encryption_key         — the PUBLIC key (P-256, SPKI base64 = the body of
--                            its PEM). Its private half never touches the
--                            server — ideally it lives in a sealed hardware key.
--   encryption_attestation — optional: the device's certificate that the key
--                            was generated inside it (PEM), published as-is.
--   tallied_at             — set by publish_tally() when the count is uploaded.
alter table public.referendums add column if not exists encrypted_ballots boolean not null default false;
alter table public.referendums add column if not exists encryption_key text not null default '';
alter table public.referendums add column if not exists encryption_attestation text not null default '';
alter table public.referendums add column if not exists tallied_at timestamptz;
-- v2.1 — RETENTION of the participation roll (who voted): purge_participation()
-- deletes it some weeks after closing and leaves only these totals behind.
alter table public.referendums add column if not exists participation_purged_at timestamptz;
alter table public.referendums add column if not exists turnout_final integer;
alter table public.referendums add column if not exists turnout_residents_final integer;
-- v2.0 — TAXISnet-VERIFIED VOTERS ONLY
--   taxis_only — only accounts that proved who they are with their TAXISnet
--                codes (gov.gr sign-in; see «TAXISnet verification» below) may
--                vote. One ΑΦΜ can be linked to ONE account, so one person
--                cannot vote twice with two email addresses.
alter table public.referendums add column if not exists taxis_only boolean not null default false;
alter table public.referendums drop constraint if exists referendums_encrypted_check;
alter table public.referendums add constraint referendums_encrypted_check
  check (not encrypted_ballots or (anonymous_ballots and encryption_key <> ''));
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
   'meeting', 'ebook', 'contact', 'community',
   -- v2.1: the OFFICIAL municipal referendum (Law 5314/2026, held through
   -- ΕΔΥΤΕ's ballot box) — the app only INFORMS about it; see README.
   'official_referendum'));
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
-- v1.7: NOBODY reads this table directly any more — not even the mayor. The
-- only reader is poll_state() (below), which applies each referendum's
-- protections (hidden until close, minimum votes). Writes come only from
-- cast_vote().
drop policy if exists "mayor reads tallies" on public.referendums_results;
drop policy if exists "mayor reads results" on public.referendums_results;
drop policy if exists "public reads revealed results" on public.referendums_results;
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
-- v2.0 — when (and only when) the ΑΦΜ came from a TAXISnet sign-in. Set by
-- taxis_link() alone; a tax number typed in by hand never counts as verified.
alter table public.citizens add column if not exists taxis_verified_at timestamptz;
-- v2.1 — consent to the voting privacy notice (which version, and when).
-- Written only by accept_voting_terms(); voting is refused without it.
alter table public.citizens add column if not exists consent_version text;
alter table public.citizens add column if not exists consent_at timestamptz;
-- One ΑΦΜ ↔ one account: the wall against a second account per person.
create unique index if not exists citizens_tax_number_key
  on public.citizens (tax_number) where tax_number <> '';
alter table public.citizens enable row level security;

create or replace function public.citizens_guard()
returns trigger language plpgsql as $$
declare
  v_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::json->>'role', '');
begin
  -- Guard only API requests (they carry JWT claims). Direct SQL — the
  -- dashboard editor or psql as postgres — stays free for maintenance, and so
  -- does the service role (v2.0: the gov.gr function writes the ΑΦΜ through
  -- taxis_link()).
  if v_role not in ('', 'service_role') then
    -- v2.0: «verified via TAXISnet» is never settable from a session — not
    -- even the mayor's — and editing the ΑΦΜ by hand clears it.
    if tg_op = 'INSERT' and new.taxis_verified_at is not null then
      raise exception 'TAXISnet verification comes from gov.gr only';
    end if;
    -- v2.1: consent is recorded by accept_voting_terms() alone (it stamps the
    -- time itself), never set directly from a session.
    if coalesce(current_setting('lefkada.consent', true), '') <> 'on'
       and ((tg_op = 'INSERT' and (new.consent_version is not null or new.consent_at is not null))
         or (tg_op = 'UPDATE' and (new.consent_version, new.consent_at)
                                   is distinct from (old.consent_version, old.consent_at))) then
      raise exception 'consent is recorded through accept_voting_terms()';
    end if;
    if tg_op = 'UPDATE' then
      if new.tax_number is distinct from old.tax_number then
        new.taxis_verified_at := null;
      elsif new.taxis_verified_at is distinct from old.taxis_verified_at then
        raise exception 'TAXISnet verification comes from gov.gr only';
      end if;
    end if;
  end if;
  if v_role not in ('', 'service_role')
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

-- ── Consent to the voting privacy notice (v2.1) ──────────────────────────────
-- How someone votes is political-opinion data. Before an account's first vote
-- the app shows what is stored and for how long, and the citizen accepts;
-- this records WHICH version of that notice and WHEN. cast_vote() and the
-- ticket functions refuse an account without it (LF009).
create or replace function public.accept_voting_terms(p_version text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'sign in first' using errcode = '42501';
  end if;
  if p_version is null or p_version !~ '^[0-9A-Za-z._-]{1,20}$' then
    raise exception 'bad notice version' using errcode = 'LF002';
  end if;
  perform set_config('lefkada.consent', 'on', true);
  insert into public.citizens (user_id, email, consent_version, consent_at)
    values (auth.uid(), coalesce(auth.email(), ''), p_version, now())
    on conflict (user_id) do update set consent_version = excluded.consent_version, consent_at = now();
  perform set_config('lefkada.consent', '', true);
end $$;
revoke all on function public.accept_voting_terms(text) from public, anon;
grant execute on function public.accept_voting_terms(text) to authenticated;

create or replace function public.voting_consent_given(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.citizens c where c.user_id = p_user and c.consent_version is not null);
$$;
revoke all on function public.voting_consent_given(uuid) from public, anon, authenticated;
grant execute on function public.voting_consent_given(uuid) to service_role;

-- Has this account proved its identity with TAXISnet codes (v2.0)?
create or replace function public.taxis_verified(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.citizens c
                 where c.user_id = p_user and c.tax_number <> '' and c.taxis_verified_at is not null);
$$;
revoke all on function public.taxis_verified(uuid) from public, anon, authenticated;
grant execute on function public.taxis_verified(uuid) to service_role;

-- ── cast_vote(): the ONLY writer of the ballot ───────────────────────────────
-- Runs as SECURITY DEFINER so it can write both tables atomically while the
-- caller can write neither directly. The participation insert is the
-- one-vote-per-account gate — its unique(poll_id, user_id) raises 23505 on a
-- second attempt, which rolls back the whole ballot (surfaced to the app as
-- "already voted"). It stamps residency + the (gov.gr-only) ΑΦΜ from the
-- registry, and records the choice ONLY as an aggregate count — so nothing ever
-- links a voter to their option. p_option is the 0-based ballot index.
-- v1.7: the server is the wall, not the app — a ballot is refused unless the
-- referendum exists, is published, is still open and the option is on the
-- ballot (custom SQLSTATEs: LF001 = not open, LF002 = invalid option,
-- LF003 = the referendum takes anonymous ballots only, LF008 = it takes
-- TAXISnet-verified voters only, LF009 = the voting privacy notice has not
-- been accepted).
create or replace function public.cast_vote(p_poll_id text, p_option int)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  r     public.referendums%rowtype;
  v_res boolean;
  v_tax text;
begin
  if auth.uid() is null then
    raise exception 'sign in to vote' using errcode = '42501';
  end if;
  select * into r from public.referendums where 'ref_' || id::text = p_poll_id;
  if not found or not r.published or now() >= r.ends_at then
    raise exception 'this referendum is not open for voting' using errcode = 'LF001';
  end if;
  if p_option is null or p_option < 0 or p_option >= jsonb_array_length(r.options) then
    raise exception 'that option is not on the ballot' using errcode = 'LF002';
  end if;
  if r.anonymous_ballots then
    -- v1.8: this path would tie the ballot to the account — tickets only.
    raise exception 'this referendum takes anonymous ballots only' using errcode = 'LF003';
  end if;
  select coalesce(c.resident, false), coalesce(c.tax_number, '')
    into v_res, v_tax
    from public.citizens c where c.user_id = auth.uid();
  v_res := coalesce(v_res, false);
  if r.taxis_only and not public.taxis_verified(auth.uid()) then
    -- v2.0: this referendum takes TAXISnet-verified voters only.
    raise exception 'verify with TAXISnet to vote in this referendum' using errcode = 'LF008';
  end if;
  if not public.voting_consent_given(auth.uid()) then
    -- v2.1: the voting privacy notice has to be accepted first.
    raise exception 'accept the voting privacy notice first' using errcode = 'LF009';
  end if;
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

-- ── poll_state(): the ONLY reader of results (v1.7) ──────────────────────────
-- One call answers everything the voting screen needs, with the referendum's
-- protections applied on the SERVER:
--   voted — has THIS account already voted (true on every device, which is how
--           a second device knows to show «already voted» instead of a ballot;
--           the choice itself is not stored per voter, so it is never returned).
--           null once the roll was deleted by purge_participation() (v2.1).
--   turnout / eligible — how many accounts voted, out of how many could
--           (v2.1; public even while the results themselves are hidden)
--   state — 'visible'     : rows holds the counts
--           'unpublished' : the mayor has not revealed the results (citizens)
--           'until_close' : hide_until_close is on and the poll is still open
--                           — applies to the MAYOR too
--           'below_min'   : fewer ballots than min_votes — mayor too
--           'awaiting_count' : encrypted ballots (v1.9), closed, but the key
--                           holder has not uploaded the count yet
--   split — false when the Δημότες / non-Δημότες breakdown was merged because
--           one of the two groups is smaller than min_votes (residency = null)
--   rows  — [{ o: option index, r: residency | null, v: votes }]
-- Bundled (pre-backend) poll ids have no referendum row: mayor-only, as before.
create or replace function public.poll_state(p_poll_id text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  r       public.referendums%rowtype;
  v_mayor boolean := public.has_role('mayor');
  v_voted boolean := false;
  v_state text := 'visible';
  v_split boolean := true;
  v_total integer;
  v_res   integer;
  v_rows  jsonb;
  v_turnout  integer;
  v_eligible integer;
begin
  select * into r from public.referendums where 'ref_' || id::text = p_poll_id;
  if r.participation_purged_at is not null then
    v_voted := null; -- the roll was deleted (retention): nobody's participation is known any more
  elsif auth.uid() is not null then
    v_voted := exists (select 1 from public.referendums_participants p
                       where p.poll_id = p_poll_id and p.user_id = auth.uid());
  end if;
  -- v2.1: turnout is public — how many voted, out of how many accounts could.
  if r.id is not null and (r.published or v_mayor) then
    v_turnout := coalesce(r.turnout_final,
      (select count(*) from public.referendums_participants where poll_id = p_poll_id)::int);
    v_eligible := (select count(*) from public.citizens c
                   where not r.taxis_only or (c.tax_number <> '' and c.taxis_verified_at is not null))::int;
  end if;
  if r.id is null then
    if not v_mayor then v_state := 'unpublished'; end if;
  elsif not (r.published or v_mayor) then
    v_state := 'unpublished';
  else
    select coalesce(sum(votes), 0), coalesce(sum(votes) filter (where residency), 0)
      into v_total, v_res
      from public.referendums_results where poll_id = p_poll_id;
    if not v_mayor and not r.results_published then
      v_state := 'unpublished';
    elsif r.hide_until_close and now() < r.ends_at then
      v_state := 'until_close';
    elsif r.encrypted_ballots and r.tallied_at is null then
      v_state := 'awaiting_count';
    elsif r.min_votes > 0 and v_total < r.min_votes then
      v_state := 'below_min';
    elsif r.min_votes > 0 and ((v_res > 0 and v_res < r.min_votes)
           or (v_total - v_res > 0 and v_total - v_res < r.min_votes)) then
      v_split := false;
    end if;
  end if;

  if v_state <> 'visible' then
    v_rows := '[]'::jsonb;
  elsif v_split then
    select coalesce(jsonb_agg(jsonb_build_object('o', option_id, 'r', residency, 'v', votes)
                              order by option_id, residency), '[]'::jsonb)
      into v_rows from public.referendums_results where poll_id = p_poll_id;
  else
    select coalesce(jsonb_agg(jsonb_build_object('o', t.option_id, 'r', null, 'v', t.v)
                              order by t.option_id), '[]'::jsonb)
      into v_rows
      from (select option_id, sum(votes)::int as v from public.referendums_results
            where poll_id = p_poll_id group by option_id) t;
  end if;
  return jsonb_build_object('voted', v_voted, 'state', v_state, 'split', v_split, 'rows', v_rows,
                            'turnout', v_turnout, 'eligible', v_eligible);
end $$;
revoke all on function public.poll_state(text) from public;
grant execute on function public.poll_state(text) to anon, authenticated;

-- ── referendums_guard: protections can't be switched off mid-vote (v1.7) ─────
-- A referendum's protections are LOCKED while it is published and for good
-- once its first ballot exists — otherwise a protection could be removed after
-- people voted under it. The ballot options freeze with the first ballot too
-- (results are stored by option index, so editing them would re-label votes).
-- v1.8: the public ticket keys can be written only by the ballot-ticket Edge
-- Function (service role) — a hijacked /admin session can't swap in its own
-- keys to forge tickets — and an anonymous-ballot referendum can't be
-- published before its keys exist.
create or replace function public.referendums_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_voted boolean := false;
  v_role  text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::json->>'role', '');
begin
  if tg_op = 'UPDATE' then
    -- (v2.1: a purged poll had voters even though its roll is gone.)
    v_voted := old.participation_purged_at is not null
      or exists (select 1 from public.referendums_participants p
                 where p.poll_id = 'ref_' || old.id::text);
    -- v2.1: with the roll deleted, «one vote per account» can no longer be
    -- enforced — so a purged poll can never be reopened.
    if old.participation_purged_at is not null and new.ends_at is distinct from old.ends_at then
      raise exception 'the closing date is locked once the participation roll is deleted' using errcode = 'LF016';
    end if;
    if (old.published or v_voted)
       and (new.hide_until_close, new.min_votes, new.anonymous_ballots,
            new.encrypted_ballots, new.encryption_key, new.encryption_attestation, new.taxis_only)
           is distinct from (old.hide_until_close, old.min_votes, old.anonymous_ballots,
            old.encrypted_ballots, old.encryption_key, old.encryption_attestation, old.taxis_only) then
      raise exception 'protections are locked once a referendum is published' using errcode = 'LF010';
    end if;
    -- v2.1: the retention snapshot is written by purge_participation() only.
    if (new.participation_purged_at, new.turnout_final, new.turnout_residents_final)
         is distinct from (old.participation_purged_at, old.turnout_final, old.turnout_residents_final)
       and coalesce(current_setting('lefkada.purge', true), '') <> 'on' then
      raise exception 'the participation snapshot is written by purge_participation() only' using errcode = 'LF015';
    end if;
    -- v1.9: «counted» is stamped by publish_tally() only.
    if new.tallied_at is distinct from old.tallied_at
       and coalesce(current_setting('lefkada.tally', true), '') <> 'on' then
      raise exception 'the count is published through publish_tally() only' using errcode = 'LF014';
    end if;
    if v_voted and new.options is distinct from old.options then
      raise exception 'the ballot options are locked once votes exist' using errcode = 'LF011';
    end if;
  end if;
  -- API callers other than the service role may never set the ticket keys.
  if v_role not in ('', 'service_role')
     and new.ticket_keys is distinct from (case when tg_op = 'UPDATE' then old.ticket_keys end) then
    raise exception 'ticket keys are written by the ballot-ticket function only' using errcode = 'LF013';
  end if;
  if tg_op = 'INSERT' and new.tallied_at is not null then
    raise exception 'the count is published through publish_tally() only' using errcode = 'LF014';
  end if;
  if new.published and new.anonymous_ballots and new.ticket_keys is null then
    raise exception 'an anonymous-ballot referendum needs its ticket keys before it is published' using errcode = 'LF012';
  end if;
  return new;
end $$;
drop trigger if exists referendums_guard on public.referendums;
create trigger referendums_guard before insert or update on public.referendums
  for each row execute function public.referendums_guard();

-- ── Anonymous ballots (v1.8) ─────────────────────────────────────────────────
-- For a referendum with anonymous_ballots on, voting is split into two steps
-- that the server cannot connect:
--   1. TICKET — the signed-in citizen's phone invents a random serial number,
--      hides («blinds») it and asks the ballot-ticket Edge Function to sign it.
--      The function checks the account is allowed and has not had a ticket for
--      this referendum (referendums_participants — the same one-per-account
--      gate as before), then signs WITHOUT being able to see the serial.
--   2. BALLOT — a little later the phone sends the option together with the
--      now-unblinded serial + signature to the ballot-cast Edge Function,
--      with NO account attached. A valid signature proves «some eligible
--      citizen», the serial can be used once, and that is all the server knows.
-- The scheme is RSA Blind Signatures (RFC 9474, RSABSSA-SHA384-PSS). Each
-- referendum has TWO key pairs — one for Δημότες, one for everyone else — so
-- a ballot still counts in the right statistic without naming its voter.
-- Everything below is callable by the Edge Functions' service role only.

-- The PRIVATE ticket keys, each wrapped (AES-256-GCM) with the Edge Function
-- secret TICKET_MASTER_KEY — a database dump alone cannot forge tickets. No
-- policies: unreadable through the API.
create table if not exists public.referendum_ticket_keys (
  referendum_id uuid primary key references public.referendums (id) on delete cascade,
  resident_key  text not null,
  other_key     text not null
);
alter table public.referendum_ticket_keys enable row level security;
revoke all on table public.referendum_ticket_keys from anon, authenticated;

-- A re-request of the SAME blinded ticket is answered again (the reply may
-- have been lost on the way) — so the roll remembers its hash. It reveals
-- nothing: a blinded serial cannot be matched to the serial on a ballot.
alter table public.referendums_participants add column if not exists ticket_blind text;

-- The serials already used, hashed — the «one ballot per ticket» gate, and the
-- public receipt list: a citizen can check their own receipt code is in it.
-- Deliberately no timestamp and no option.
create table if not exists public.referendums_tickets (
  poll_id     text not null check (char_length(poll_id) between 1 and 80),
  serial_hash text not null check (serial_hash ~ '^[0-9a-f]{64}$'),
  unique (poll_id, serial_hash)
);
alter table public.referendums_tickets enable row level security;
drop policy if exists "anyone checks a receipt" on public.referendums_tickets;
create policy "anyone checks a receipt" on public.referendums_tickets
  for select using (true);

-- The open anonymous-ballot referendum behind a poll id, or a refusal.
create or replace function public.anonymous_referendum(p_poll_id text)
returns public.referendums
language plpgsql stable security definer set search_path = public as $$
declare r public.referendums%rowtype;
begin
  select * into r from public.referendums where 'ref_' || id::text = p_poll_id;
  if not found or not r.published or now() >= r.ends_at then
    raise exception 'this referendum is not open for voting' using errcode = 'LF001';
  end if;
  if not r.anonymous_ballots or r.ticket_keys is null then
    raise exception 'this referendum does not take anonymous ballots' using errcode = 'LF004';
  end if;
  return r;
end $$;

-- Create a referendum's ticket keys (once). p_caller must be the mayor. The
-- Edge Function generates the pairs and passes the wrapped private halves;
-- if keys already exist they are kept and the existing public keys returned.
create or replace function public.ticket_init(
  p_caller uuid, p_referendum uuid, p_resident_key text, p_other_key text, p_public jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_keys jsonb;
begin
  if not exists (select 1 from public.app_roles where user_id = p_caller and role = 'mayor') then
    raise exception 'mayor only' using errcode = '42501';
  end if;
  insert into public.referendum_ticket_keys (referendum_id, resident_key, other_key)
    values (p_referendum, p_resident_key, p_other_key)
    on conflict (referendum_id) do nothing;
  if found then
    update public.referendums set ticket_keys = p_public where id = p_referendum;
  end if;
  select ticket_keys into v_keys from public.referendums where id = p_referendum;
  return v_keys;
end $$;

-- The two PUBLIC ticket keys of an open anonymous-ballot referendum — what
-- ballot-cast verifies a ticket against.
create or replace function public.ticket_public_keys(p_poll_id text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r public.referendums%rowtype := public.anonymous_referendum(p_poll_id);
begin
  return r.ticket_keys;
end $$;

-- Step 1a: what the function needs in order to sign — the citizen's residency
-- per the registry and the two wrapped private keys. Writes nothing.
create or replace function public.ticket_prepare(p_user uuid, p_poll_id text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  r public.referendums%rowtype := public.anonymous_referendum(p_poll_id);
  k public.referendum_ticket_keys%rowtype;
begin
  select * into k from public.referendum_ticket_keys where referendum_id = r.id;
  if not found then
    raise exception 'this referendum does not take anonymous ballots' using errcode = 'LF004';
  end if;
  if r.taxis_only and not public.taxis_verified(p_user) then
    raise exception 'verify with TAXISnet to vote in this referendum' using errcode = 'LF008';
  end if;
  if not public.voting_consent_given(p_user) then
    raise exception 'accept the voting privacy notice first' using errcode = 'LF009';
  end if;
  return jsonb_build_object(
    'resident', coalesce((select c.resident from public.citizens c where c.user_id = p_user), false),
    'resident_key', k.resident_key, 'other_key', k.other_key);
end $$;

-- Step 1b: record that this account has had its ticket — the one-per-account
-- gate. Raises 23505 when the account already had a DIFFERENT ticket; the same
-- blinded ticket again is fine (a lost reply being re-requested). p_resident
-- must still match the registry (LF005), so a ticket is never signed with the
-- wrong key.
create or replace function public.ticket_issue(
  p_user uuid, p_poll_id text, p_resident boolean, p_blind_hash text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  r public.referendums%rowtype := public.anonymous_referendum(p_poll_id);
  v_res  boolean;
  v_tax  text;
  v_mail text;
  v_old  text;
begin
  select coalesce(c.resident, false), coalesce(c.tax_number, ''), coalesce(c.email, '')
    into v_res, v_tax, v_mail from public.citizens c where c.user_id = p_user;
  if r.taxis_only and not public.taxis_verified(p_user) then
    raise exception 'verify with TAXISnet to vote in this referendum' using errcode = 'LF008';
  end if;
  if not public.voting_consent_given(p_user) then
    raise exception 'accept the voting privacy notice first' using errcode = 'LF009';
  end if;
  if coalesce(v_res, false) is distinct from p_resident then
    raise exception 'the registry designation changed — request the ticket again' using errcode = 'LF005';
  end if;
  select p.ticket_blind into v_old from public.referendums_participants p
    where p.poll_id = p_poll_id and p.user_id = p_user;
  if found then
    if v_old is not distinct from p_blind_hash then return; end if;
    raise exception 'this account already had its ticket' using errcode = '23505';
  end if;
  insert into public.referendums_participants (poll_id, user_id, email, tax_number, ticket_blind)
    values (p_poll_id, p_user,
            coalesce(nullif(v_mail, ''), (select u.email from auth.users u where u.id = p_user), ''),
            coalesce(v_tax, ''), p_blind_hash);
end $$;

-- Step 2: count one anonymous ballot. The Edge Function has already verified
-- the ticket's signature; here the serial is burned (23505 if it was used) and
-- the tally incremented, atomically. Ballots can never outnumber tickets
-- (LF006) — if that ever trips, a ticket key has leaked.
create or replace function public.ballot_record(
  p_poll_id text, p_option int, p_resident boolean, p_serial_hash text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  r public.referendums%rowtype := public.anonymous_referendum(p_poll_id);
begin
  if r.encrypted_ballots then
    raise exception 'this referendum takes encrypted ballots only' using errcode = 'LF007';
  end if;
  if p_option is null or p_option < 0 or p_option >= jsonb_array_length(r.options) then
    raise exception 'that option is not on the ballot' using errcode = 'LF002';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_poll_id));
  if exists (select 1 from public.referendums_tickets
             where poll_id = p_poll_id and serial_hash = p_serial_hash) then
    raise exception 'this ticket was already used' using errcode = '23505';
  end if;
  if (select count(*) from public.referendums_tickets where poll_id = p_poll_id)
     >= (select count(*) from public.referendums_participants where poll_id = p_poll_id) then
    raise exception 'more ballots than tickets — refused' using errcode = 'LF006';
  end if;
  insert into public.referendums_tickets (poll_id, serial_hash) values (p_poll_id, p_serial_hash);
  insert into public.referendums_results (poll_id, option_id, residency, votes)
    values (p_poll_id, p_option, p_resident, 1)
    on conflict (poll_id, option_id, residency)
      do update set votes = public.referendums_results.votes + 1;
end $$;

-- ── Encrypted ballots (v1.9) ─────────────────────────────────────────────────
-- For a referendum with encrypted_ballots on, the anonymous ballot (v1.8)
-- carries a CIPHERTEXT instead of the option:
--   · the phone encrypts the choice to the referendum's public key (ECDH P-256
--     → HKDF-SHA256 → AES-256-GCM; web/lib/ballotSeal.ts), every ciphertext the
--     same length;
--   · the database stores it as-is — no tally can exist before the count, for
--     anyone, with any level of access;
--   · after closing, whoever holds the private key (scripts/tally.mjs, with
--     the sealed hardware key plugged in) derives each ballot's one-time key —
--     its OPENING — and the mayor uploads them through publish_tally();
--   · the ballots and their openings are then public, so anyone can decrypt
--     every ballot and recount (the app has a «verify the count» button).
-- The private key is never needed again and never leaves its device.

-- One row per encrypted ballot. No voter, no timestamp, and no residency (the
-- Δημότες flag lives in a table nobody can read — below — so the per-ballot
-- public list can't expose a lone voter of a small group).
create table if not exists public.referendums_ballots (
  id         uuid primary key default gen_random_uuid(),
  poll_id    text not null check (char_length(poll_id) between 1 and 80),
  -- ephemeral key (65) ‖ iv (12) ‖ ciphertext+tag (32) = 109 bytes, base64
  ciphertext text not null check (ciphertext ~ '^[A-Za-z0-9+/]{146}==$'),
  -- set by publish_tally(): the ballot's one-time AES key (base64) and the
  -- option it decrypts to (null = it did not decrypt to a valid option)
  opening    text,
  option_id  smallint
);
create index if not exists referendums_ballots_poll_idx on public.referendums_ballots (poll_id);
alter table public.referendums_ballots enable row level security;

-- The Δημότες flag of each encrypted ballot — readable by NOBODY through the
-- API; only publish_tally() uses it, to build the aggregated statistic.
create table if not exists public.referendums_ballot_groups (
  ballot_id uuid primary key references public.referendums_ballots (id) on delete cascade,
  residency boolean not null
);
alter table public.referendums_ballot_groups enable row level security;
revoke all on table public.referendums_ballot_groups from anon, authenticated;

-- Unopened ciphertexts say nothing, so they are always readable (the count
-- script needs them). OPENED ballots are as revealing as the results, so they
-- follow the same rules: published by the mayor, and not below the minimum.
create or replace function public.opened_ballots_public(p_poll_id text)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r public.referendums%rowtype;
begin
  select * into r from public.referendums where 'ref_' || id::text = p_poll_id;
  if not found then return false; end if;
  if r.min_votes > 0
     and (select count(*) from public.referendums_ballots where poll_id = p_poll_id) < r.min_votes then
    return false;
  end if;
  return r.results_published or public.has_role('mayor');
end $$;
drop policy if exists "public reads ballots" on public.referendums_ballots;
create policy "public reads ballots" on public.referendums_ballots
  for select using (opening is null or public.opened_ballots_public(poll_id));

-- Step 2 for an encrypted referendum: burn the ticket and store the
-- ciphertext. Same gates as ballot_record().
create or replace function public.ballot_record_encrypted(
  p_poll_id text, p_resident boolean, p_serial_hash text, p_ciphertext text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  r    public.referendums%rowtype := public.anonymous_referendum(p_poll_id);
  v_id uuid;
begin
  if not r.encrypted_ballots then
    raise exception 'this referendum does not take encrypted ballots' using errcode = 'LF007';
  end if;
  perform pg_advisory_xact_lock(hashtext(p_poll_id));
  if exists (select 1 from public.referendums_tickets
             where poll_id = p_poll_id and serial_hash = p_serial_hash) then
    raise exception 'this ticket was already used' using errcode = '23505';
  end if;
  if (select count(*) from public.referendums_tickets where poll_id = p_poll_id)
     >= (select count(*) from public.referendums_participants where poll_id = p_poll_id) then
    raise exception 'more ballots than tickets — refused' using errcode = 'LF006';
  end if;
  insert into public.referendums_tickets (poll_id, serial_hash) values (p_poll_id, p_serial_hash);
  insert into public.referendums_ballots (poll_id, ciphertext) values (p_poll_id, p_ciphertext)
    returning id into v_id;
  insert into public.referendums_ballot_groups (ballot_id, residency) values (v_id, p_resident);
end $$;

-- The count. Mayor only, once, and only after closing. p_ballots maps EVERY
-- ballot id of the referendum to { "k": <opening, base64>, "o": <option index
-- or null> } — produced by scripts/tally.mjs with the private key, re-checked
-- by the admin page before it is sent. The database cannot decrypt, so it
-- takes the stated option; that is safe because the openings are published
-- with it and anyone can re-decrypt every ballot.
create or replace function public.publish_tally(p_poll_id text, p_ballots jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r       public.referendums%rowtype;
  v_n     integer;
  v_valid integer;
begin
  if not public.has_role('mayor') then
    raise exception 'mayor only' using errcode = '42501';
  end if;
  select * into r from public.referendums where 'ref_' || id::text = p_poll_id for update;
  if not found or not r.encrypted_ballots then
    raise exception 'this referendum does not take encrypted ballots' using errcode = 'LF007';
  end if;
  if now() < r.ends_at then
    raise exception 'the count can be published only after closing' using errcode = 'LF020';
  end if;
  if r.tallied_at is not null then
    raise exception 'this referendum was already counted' using errcode = 'LF021';
  end if;
  select count(*) into v_n from public.referendums_ballots where poll_id = p_poll_id;
  if jsonb_typeof(p_ballots) is distinct from 'object'
     or v_n <> (select count(*) from jsonb_object_keys(p_ballots))
     or exists (select 1 from public.referendums_ballots b
                where b.poll_id = p_poll_id and not p_ballots ? b.id::text) then
    raise exception 'the count must cover every ballot of the referendum' using errcode = 'LF022';
  end if;
  if exists (select 1 from jsonb_each(p_ballots) e
             where coalesce(e.value->>'k', '') !~ '^[A-Za-z0-9+/]{43}=$'
                or (jsonb_typeof(e.value->'o') = 'number'
                    and ((e.value->>'o')::int < 0 or (e.value->>'o')::int >= jsonb_array_length(r.options)))
                or jsonb_typeof(e.value->'o') not in ('number', 'null')) then
    raise exception 'malformed count' using errcode = 'LF002';
  end if;
  update public.referendums_ballots b
     set opening = p_ballots->b.id::text->>'k',
         option_id = (p_ballots->b.id::text->>'o')::smallint
   where b.poll_id = p_poll_id;
  delete from public.referendums_results where poll_id = p_poll_id;
  insert into public.referendums_results (poll_id, option_id, residency, votes)
    select p_poll_id, b.option_id, g.residency, count(*)::int
      from public.referendums_ballots b
      join public.referendums_ballot_groups g on g.ballot_id = b.id
     where b.poll_id = p_poll_id and b.option_id is not null
     group by b.option_id, g.residency;
  select count(*) into v_valid from public.referendums_ballots
    where poll_id = p_poll_id and option_id is not null;
  perform set_config('lefkada.tally', 'on', true);
  update public.referendums set tallied_at = now(), updated_at = now() where id = r.id;
  perform set_config('lefkada.tally', '', true);
  return jsonb_build_object('ballots', v_n, 'counted', v_valid, 'invalid', v_n - v_valid);
end $$;
revoke all on function public.publish_tally(text, jsonb) from public, anon;
grant execute on function public.publish_tally(text, jsonb) to authenticated;
revoke all on function public.ballot_record_encrypted(text, boolean, text, text) from public, anon, authenticated;
grant execute on function public.ballot_record_encrypted(text, boolean, text, text) to service_role;

do $$
declare f text;
begin
  foreach f in array array[
    'public.anonymous_referendum(text)',
    'public.ticket_init(uuid, uuid, text, text, jsonb)',
    'public.ticket_public_keys(text)',
    'public.ticket_prepare(uuid, text)',
    'public.ticket_issue(uuid, text, boolean, text)',
    'public.ballot_record(text, int, boolean, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- ── TAXISnet verification (v2.0) ─────────────────────────────────────────────
-- The govgr-auth Edge Function sends a signed-in citizen to the gov.gr sign-in
-- (ΓΓΠΣΨΔ's oAuth2.0 service), receives the citizen's ΑΦΜ straight from it,
-- and calls taxis_link() — the only place a verified ΑΦΜ is ever written.
-- Returns:
--   'linked'   — the ΑΦΜ now belongs to this account (or already did)
--   'taken'    — the ΑΦΜ is linked to ANOTHER account: one person, one account
--   'mismatch' — this account is already linked to a DIFFERENT ΑΦΜ
create or replace function public.taxis_link(p_user uuid, p_tax text, p_name text default '')
returns text
language plpgsql security definer set search_path = public as $$
declare v_cur text;
begin
  if p_tax is null or p_tax !~ '^[0-9]{9}$' then
    raise exception 'not a tax number' using errcode = 'LF002';
  end if;
  perform pg_advisory_xact_lock(hashtext('taxis:' || p_tax));
  if exists (select 1 from public.citizens where tax_number = p_tax and user_id <> p_user) then
    return 'taken';
  end if;
  select tax_number into v_cur from public.citizens where user_id = p_user;
  if found and v_cur <> '' and v_cur <> p_tax
     and exists (select 1 from public.citizens where user_id = p_user and taxis_verified_at is not null) then
    return 'mismatch';
  end if;
  insert into public.citizens (user_id, email, full_name, tax_number, taxis_verified_at)
    values (p_user, coalesce((select u.email from auth.users u where u.id = p_user), ''),
            coalesce(p_name, ''), p_tax, now())
    on conflict (user_id) do update
      set tax_number = excluded.tax_number,
          taxis_verified_at = now(),
          full_name = case when public.citizens.full_name = '' then excluded.full_name
                           else public.citizens.full_name end;
  return 'linked';
end $$;
revoke all on function public.taxis_link(uuid, text, text) from public, anon, authenticated;
grant execute on function public.taxis_link(uuid, text, text) to service_role;

-- ── Retention of the participation roll (v2.1) ───────────────────────────────
-- WHO voted is needed while a poll is open (one vote per account) and for a
-- while after it (so anyone can check «the records say I voted / did not»).
-- After that it is only a list of who took part in what. This deletes it
-- p_days after closing — once the poll is counted, for encrypted ones — and
-- keeps just the totals. Run daily by .github/workflows/participation-purge.yml
-- (as the database owner; it is not callable through the API). Returns the
-- number of polls purged.
create or replace function public.purge_participation(p_days integer default 90)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  r public.referendums%rowtype;
  n integer := 0;
begin
  if p_days is null or p_days < 7 then
    raise exception 'retention must be at least 7 days' using errcode = 'LF002';
  end if;
  perform set_config('lefkada.purge', 'on', true);
  for r in
    select * from public.referendums
     where participation_purged_at is null
       and ends_at < now() - make_interval(days => p_days)
       and (not encrypted_ballots or tallied_at is not null)
     for update
  loop
    update public.referendums set
      turnout_final = (select count(*) from public.referendums_participants p
                       where p.poll_id = 'ref_' || r.id::text),
      turnout_residents_final = (select count(*) from public.referendums_participants p
                                 join public.citizens c on c.user_id = p.user_id and c.resident
                                 where p.poll_id = 'ref_' || r.id::text),
      participation_purged_at = now()
     where id = r.id;
    delete from public.referendums_participants where poll_id = 'ref_' || r.id::text;
    n := n + 1;
  end loop;
  perform set_config('lefkada.purge', '', true);
  return n;
end $$;
revoke all on function public.purge_participation(integer) from public, anon, authenticated;

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
