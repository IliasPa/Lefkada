# Backend setup (Supabase) — one-time guide

The app works without any of this (it falls back to the bundled demo data).
Follow these steps once to activate the real backend: mayor inbox, job
applications with CV upload, referendums, managed content, reporter news,
pharmacy duty schedules and push notifications. Everything is on the **free
tier** — no credit card needed.

---

## 1. Create the Supabase project (≈2 minutes)

1. Go to <https://supabase.com> → **Start your project** → sign in with GitHub
   or Google (use your own account: iliasparaskevas3@gmail.com).
2. **New project** → name it `lefkada`, pick the **Frankfurt (eu-central-1)**
   region (closest to Greece), generate a strong database password (store it in
   a password manager — you rarely need it again).
3. Wait ~1 minute for the project to provision.

> Free-tier note: projects pause after ~1 week with zero traffic. One click in
> the dashboard un-pauses them. With real visitors this practically never
> happens.

## 2. Create the tables and security rules

1. In the dashboard open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql)
   and press **Run**. It creates all tables, the private `cvs` bucket, the
   public `docs` bucket, and every Row-Level-Security policy. Safe to re-run.

## 3. Lock the login down to you (the mayor)

This is the part that makes `/admin` yours only:

1. **Authentication → Sign In / Up → Auth Providers → Email**: leave Email enabled, but turn
   **OFF** “Allow new users to sign up”. Nobody can ever self-register.
2. **Authentication → Users → Add user → Create new user**: email
   `iliasparaskevas3@gmail.com`, choose a strong password, tick
   **Auto Confirm User**.
3. Back in **SQL Editor**, grant that account the mayor role:

   ```sql
   insert into public.app_roles (user_id, role, display_name)
   select id, 'mayor', 'Δήμαρχος'
   from auth.users where email = 'iliasparaskevas3@gmail.com'
   on conflict (user_id) do update set role = 'mayor';
   ```

Security model (why this is safe):
- Sign-ups are disabled → only accounts **you** create in the dashboard exist.
- Even if someone somehow had an account, every table checks the `app_roles`
  row server-side (RLS). No mayor role → no messages, no CVs, no admin writes.
- The `/admin` URL being public is irrelevant — it's the database that refuses.
- Enable **2FA on your Supabase account itself** (Account → Security). Your
  Supabase login is the real key to everything.

Later, to hand over to the actual mayor: create their user the same way and
run the same SQL with their email.

## 4. Connect the app

1. Get the two values from **Project Settings**:
   - **Project URL**: under **Data API** (looks like `https://xxxx.supabase.co`).
   - **API key**: under **API Keys** → copy the **Publishable key**
     (`sb_publishable_…`). This key is *designed* to ship in the app — RLS does
     the protecting. (The older **Legacy anon key** on the same page works too;
     both are interchangeable here.)
   - ⚠️ Never put the **Secret key** (`sb_secret_…`) or the legacy
     **service_role** key anywhere in the app or in Vercel env vars starting
     with `NEXT_PUBLIC_` — those bypass all security rules. They are only for
     server-side tools (the Edge Function gets its own automatically).
2. On **Vercel** → your project → **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = the project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the publishable key
3. For local development: `cp web/.env.local.example web/.env.local` and fill
   in the same two values.
4. Redeploy (Vercel → Deployments → Redeploy). Done — `/admin`, `/reporters`
   and `/pharmacies` are now live.

## 5. Reporter and pharmacy accounts (when needed)

Same recipe as step 3 — create the user in **Authentication → Users**, then:

```sql
-- Reporter (the display name appears as the news byline)
insert into public.app_roles (user_id, role, display_name)
select id, 'reporter', 'Lefkada Press'
from auth.users where email = 'reporter@example.com';

-- Pharmacy (pharmacy_id must match web/data/pharmacies.ts: p1…p6)
insert into public.app_roles (user_id, role, pharmacy_id, display_name)
select id, 'pharmacy', 'p1', 'Φαρμακείο Καββαδάς'
from auth.users where email = 'pharmacy@example.com';
```

Send each person their email + password; they log in at `/reporters` or
`/pharmacies` respectively. You can always see/moderate their output in
`/admin`.

## 6. Push notifications (optional, ~10 minutes)

Lets you notify every subscribed citizen from `/admin ▸ Ειδοποιήσεις`
(and when publishing a risk alert).

1. Generate VAPID keys once (any machine with Node):
   `npx web-push generate-vapid-keys`
2. Add the **public** key as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in Vercel env vars
   (and `web/.env.local`), then redeploy.
3. Install the Supabase CLI and deploy the send function:

   ```sh
   npm install -g supabase
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF   # run inside this repo
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:iliasparaskevas3@gmail.com
   supabase functions deploy send-push
   ```

Citizens who enable «Ειδοποιήσεις» in the app's settings are subscribed
automatically; the count shows up in `/admin ▸ Ειδοποιήσεις`.

## What lives where

| Data | Where | Who can write | Who can read |
|---|---|---|---|
| Mayor messages | `messages` table | anyone (submit only) | mayor |
| Job applications | `applications` + private `cvs` bucket | anyone (submit only) | mayor |
| Folders/tags | `folders` table | mayor | mayor |
| Referendums | `referendums` table | mayor | everyone (published) |
| Alerts, jobs, events, decisions, tenders, bylaws, consultations, council, budget | `content` table | mayor | everyone (published) |
| News | `news` table | reporters (own) + mayor | everyone (published) |
| Pharmacy duty | `pharmacy_duty` table | pharmacies (own) + mayor | everyone |
| Push subscriptions | `push_subscriptions` table | anyone (subscribe only) | mayor |

Free-tier headroom: the 500 MB database fits millions of rows; the 1 GB `cvs`
bucket fits roughly 1,000–5,000 CVs. Deleting an application in /admin also
deletes its CV file.
