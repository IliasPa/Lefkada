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
-- Voting itself stays client-side for now (per app v1.0); this table only
-- publishes the referendum definition to the app.
create table if not exists public.referendums (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title_el   text not null,
  title_en   text not null default '',
  small_el   text not null default '',
  small_en   text not null default '',
  medium_el  text not null default '',
  medium_en  text not null default '',
  large_el   text not null default '',
  large_en   text not null default '',
  pdf_url    text not null default '',
  youtube_id text not null default '',
  -- [{ "id": "a", "el": "...", "en": "..." }, ...]
  options    jsonb not null default '[]',
  ends_at    timestamptz not null,
  published  boolean not null default false
);
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

-- ── Votes (v1.3) ─────────────────────────────────────────────────────────────
-- Hashed, insert-only event log — SIGNED-IN citizens only (no anonymous
-- device votes): voter_key = SHA-256('lefkada-verified-v1' ‖ auth-user-id ‖
-- poll-id), so one account is one voter per poll, on any device. The per-poll
-- hash keeps one account's votes unlinkable across polls in the stored data.
-- A voter may insert again to CHANGE their vote: the tally counts only the
-- LATEST row per (poll_id, voter_key). The insert policy («citizens vote»)
-- lives after the citizens table below, which it checks.
-- official_resident — the verification ladder of the voter's designation:
--   null  = account not confirmed by the municipality
--   false = confirmed by the MAYOR against the municipal roll (Δημότης)
--   true  = confirmed via gov.gr (future tier; never client-settable)
create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- 'ref_<uuid>' for /admin referendums, the bundled poll id otherwise
  poll_id    text not null check (char_length(poll_id) between 1 and 80),
  option_id  text not null check (char_length(option_id) between 1 and 40),
  voter_key  text not null check (voter_key ~ '^[0-9a-f]{64}$')
);
create index if not exists votes_poll_idx on public.votes (poll_id, voter_key, created_at desc);
alter table public.votes enable row level security;
drop policy if exists "anyone votes" on public.votes;
drop policy if exists "mayor reads votes" on public.votes;
create policy "mayor reads votes" on public.votes
  for select using (public.has_role('mayor'));
drop policy if exists "mayor deletes votes" on public.votes;
create policy "mayor deletes votes" on public.votes
  for delete using (public.has_role('mayor'));

-- ── Vetos (weekly, day-only) ─────────────────────────────────────────────────
-- CONFIRMED Δημότες only (the «citizens veto» policy below the citizens
-- table enforces it). One row per veto, no recall. Privacy: no timestamp is
-- stored at all — only `day` (1 = Monday … 7 = Sunday, Athens time; Monday
-- before 03:00 counts as Sunday). The weekly counter resets by an actions
-- workflow that WIPES the table every Monday 03:00 Europe/Athens — so the
-- table always holds exactly the current week. Weekly aggregates will be
-- archived to the private git repo in a future version.
drop table if exists public.veto_events;
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'vetos'
               and column_name = 'created_at') then
    drop table public.vetos;
  end if;
end $$;
create table if not exists public.vetos (
  id                uuid primary key default gen_random_uuid(),
  day               smallint not null check (day between 1 and 7),
  voter_key         text not null check (voter_key ~ '^[0-9a-f]{64}$'),
  official_resident boolean
);
alter table public.vetos enable row level security;
drop policy if exists "anyone vetos" on public.vetos;
drop policy if exists "mayor reads vetos" on public.vetos;
create policy "mayor reads vetos" on public.vetos
  for select using (public.has_role('mayor'));
drop policy if exists "mayor deletes vetos" on public.vetos;
create policy "mayor deletes vetos" on public.vetos
  for delete using (public.has_role('mayor'));

-- ── Verified voting (v1.3) ───────────────────────────────────────────────────
-- Free identity tier: Supabase email OTP — citizens sign in from the app's
-- profile, and their voter_key becomes SHA-256('lefkada-verified-v1' ‖ auth
-- user id ‖ poll-id) instead of the device hash. The key is computed client-
-- side but ENFORCED here (see «citizen votes prove identity» below): a row
-- may carry a non-null resident stamp only when its key equals that hash for
-- the CALLING user — so anonymous callers can never impersonate a signed-in
-- citizen, and one account is exactly one verified voter per poll.
-- gov.gr OAuth later reuses all of this unchanged — it also lands as an auth
-- user; only poll_participants.verified_via differs.
create extension if not exists pgcrypto with schema extensions;

-- votes.official_resident (see the votes section above for the meaning) —
-- the block below upgrades every older database shape in place: it drops the
-- legacy verified/self-declared columns and maps the old encoding (true =
-- Δημότης) onto the new ladder (false = mayor-confirmed).
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'votes'
               and column_name = 'verified') then
    drop policy if exists "verified votes prove identity" on public.votes;
    drop policy if exists "official residency comes from the registry" on public.votes;
    alter table public.votes drop column if exists verified;
    alter table public.votes drop column if exists resident;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'votes'
               and column_name = 'resident')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'votes'
               and column_name = 'official_resident') then
    drop policy if exists "citizen votes prove identity" on public.votes;
    alter table public.votes rename column resident to official_resident;
    update public.votes set official_resident = false where official_resident = true;
  end if;
end $$;
alter table public.votes add column if not exists official_resident boolean;

-- WHO took part (verified accounts only) — deliberately stored WITHOUT any
-- timestamp and in a separate table, so a participant row can never be paired
-- with a hashed ballot row by time or by insert order. This is the electoral-
-- roll model: participation is visible to the mayor, the choice never is.
create table if not exists public.poll_participants (
  id           uuid primary key default gen_random_uuid(),
  poll_id      text not null check (char_length(poll_id) between 1 and 80),
  user_id      uuid not null,
  email        text not null default '',
  verified_via text not null default 'email' check (verified_via in ('email', 'govgr')),
  unique (poll_id, user_id)
);
alter table public.poll_participants drop column if exists resident;
alter table public.poll_participants enable row level security;
-- Plain INSERT only (same reason as push_subscriptions): an upsert would need
-- SELECT for the ON CONFLICT arbiter check, which citizens don't have — the
-- app inserts and treats a 23505 duplicate as "already registered".
drop policy if exists "verified users record own participation" on public.poll_participants;
create policy "verified users record own participation" on public.poll_participants
  for insert to authenticated
  with check (user_id = auth.uid() and email = coalesce(auth.email(), ''));
drop policy if exists "mayor reads participants" on public.poll_participants;
create policy "mayor reads participants" on public.poll_participants
  for select using (public.has_role('mayor'));
drop policy if exists "mayor deletes participants" on public.poll_participants;
create policy "mayor deletes participants" on public.poll_participants
  for delete using (public.has_role('mayor'));

-- Aggregated results the mayor chooses to publish on the app's front page.
-- Only COUNTS ever leave the votes table — never rows, keys or timestamps.
create table if not exists public.poll_results (
  poll_id    text primary key check (char_length(poll_id) between 1 and 80),
  updated_at timestamptz not null default now(),
  published  boolean not null default true,
  -- snapshot: { title_el, title_en, total, verified_total,
  --             options: [{ id, label_el, label_en, all, verified }] }
  data       jsonb not null
);
alter table public.poll_results enable row level security;
drop policy if exists "public reads published results" on public.poll_results;
create policy "public reads published results" on public.poll_results
  for select using (published or public.has_role('mayor'));
drop policy if exists "mayor writes results" on public.poll_results;
create policy "mayor writes results" on public.poll_results
  for all using (public.has_role('mayor')) with check (public.has_role('mayor'));

-- The citizen registry (μητρώο): one row per verified account that has
-- connected to the app. Identity fields are written by the citizen themselves
-- (synced from their profile — name/ΑΦΜ optional, zero friction). The
-- resident flag is the MUNICIPALITY's: the mayor checks the official roll and
-- toggles it in /admin ▸ Δημοψηφίσματα ▸ Ψηφοφόροι. A trigger (not just RLS)
-- guards the flag, so citizens can never designate themselves.
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

-- Who may INSERT votes/vetos — defined down here because both policies check
-- the citizens registry above. Signed-in accounts only; the voter_key must
-- be the CALLING user's own account hash; official_resident must mirror the
-- registry (confirmed Δημότης → false, otherwise null — «is not distinct
-- from» makes the null comparison exact). true (the gov.gr tier) is reserved
-- for the future server-side flow and can never come from a client. Vetos
-- additionally REQUIRE confirmation: non-citizens cannot veto at all.
drop policy if exists "citizen votes prove identity" on public.votes;
drop policy if exists "citizens vote" on public.votes;
create policy "citizens vote" on public.votes
  for insert to authenticated
  with check (
    voter_key = encode(extensions.digest(
      'lefkada-verified-v1:' || auth.uid()::text || ':' || poll_id, 'sha256'), 'hex')
    and official_resident is not distinct from
      (case when coalesce((select c.resident from public.citizens c where c.user_id = auth.uid()), false)
            then false else null end)
  );

drop policy if exists "citizen vetos prove identity" on public.vetos;
drop policy if exists "citizens veto" on public.vetos;
create policy "citizens veto" on public.vetos
  for insert to authenticated
  with check (
    voter_key = encode(extensions.digest(
      'lefkada-verified-v1:' || auth.uid()::text || ':veto', 'sha256'), 'hex')
    and official_resident is not distinct from
      (case when coalesce((select c.resident from public.citizens c where c.user_id = auth.uid()), false)
            then false else null end)
    and official_resident is not null
  );

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
-- ═══════════════════════════════════════════════════════════════════════════
