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

**Troubleshooting «0 συσκευές»:**

- On **iPhone/iPad** the app must be installed to the Home Screen, and the
  subscription can only be created by the Settings **toggle itself** (iOS
  requires the subscribe call to happen inside the user's tap). Devices that
  enabled notifications **before** push was fixed/configured must toggle
  **off → on** once — the app now shows the real error if registration fails,
  instead of silently staying unsubscribed.
- If you ever **regenerate the VAPID keys**, update Vercel, `web/.env.local`
  *and* the Supabase secrets together, then redeploy both the site and the
  `send-push` function. Devices subscribed under the old key re-subscribe
  themselves the next time the toggle is used (the app detects the key change).
- `/admin` warns on this tab if `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is missing from
  the deployment it is running on.

## What lives where

| Data | Where | Who can write | Who can read |
|---|---|---|---|
| Mayor messages | `messages` table | anyone (submit only) | mayor |
| Job applications | `applications` + private `cvs` bucket | anyone (submit only) | mayor |
| Folders/tags | `folders` table | mayor | mayor |
| Referendums | `referendums` table | mayor | everyone (published) |
| Alerts, jobs, events, decisions, meetings, tenders, bylaws, consultations, council terms, community decisions, budget, water, lessons, competitions, e-books, contacts | `content` table | mayor | everyone (published) |
| News | `news` table | reporters (own) + mayor | everyone (published) |
| Pharmacy duty | `pharmacy_duty` table | pharmacies (own) + mayor | everyone |
| Push subscriptions | `push_subscriptions` table | anyone (subscribe only) | mayor |
| Votes (what) | `referendums_results` table — `(poll_id, option_id INT, residency, votes)`, counts only, never tied to a voter | `cast_vote()` only (security definer) | mayor + public for **shown** polls |
| Votes (who) | `referendums_participants` table — `(poll_id, user_id, email, tax_number)`; its `unique(poll_id, user_id)` is the one-vote-per-account gate; a filled ΑΦΜ means gov.gr-verified | `cast_vote()` only | mayor |
| Vetos | `vetos` table — `(veto_date, voter_key)` only, no PK/timestamp; confirmed Δημότες only; each veto stays active 7 days (rolling); voter_key hashed with the week's Monday so it's one veto per week | `cast_veto()` only | mayor |
| Results visibility | merged into `referendums.results_published` (the 🏠 toggle) — no separate table; counts read live from `referendums_results` | mayor | everyone (shown) |
| Citizen registry | `citizens` table (name/ΑΦΜ/email self-provided; the Δημότης flag is mayor-only — a trigger blocks everyone else) | citizens (own identity) + mayor (the flag) | each their own row + mayor |

Free-tier headroom: the 500 MB database fits millions of rows; the 1 GB `cvs`
bucket fits roughly 1,000–5,000 CVs. Deleting an application in /admin also
deletes its CV file.

## 7. Weekly data sync → git (v1.2, one secret)

Since v1.2, **git is the permanent home of all published content**: every
Sunday the GitHub Action `.github/workflows/sync-data.yml` bakes the published
Supabase rows into `web/data/*.json` + `web/public/{decisions,budgetReports}.json`,
commits (the deploy redeploys with the data in the bundle), and then prunes
rows older than 30 days that are verifiably in git — so the database stays
small. Drafts, risk alerts and still-open referendums are never pruned; the
private tables (messages, applications, push subscriptions) are never synced.

One-time setup:

1. Supabase dashboard → **Project Settings → Database → Connection string** →
   copy the **Session pooler** URI (it includes the database password).
2. GitHub → repo → **Settings → Secrets and variables → Actions → New
   repository secret** — name `SUPABASE_DB_URL`, value that URI.
3. Test it: **Actions → "Weekly data sync (Supabase → git)" → Run workflow.**

Running it by hand from this machine needs no secret at all — the linked
Supabase CLI logs in for you:

```bash
node scripts/sync-data.mjs          # bake current published rows into the files
node scripts/sync-data.mjs --prune  # only after the sync is committed AND pushed
```

If the Action ever fails, GitHub emails you; nothing is lost — Supabase simply
keeps growing until the next successful run.

## 8. Keepalive & failure alarms (v1.3, zero setup)

`.github/workflows/keepalive.yml` pings the Data API **every day at 03:17 UTC**
so the free-tier project always shows activity and is never paused — the
longest possible quiet gap is 1 day, independent of the weekly sync. It needs
no secrets (it uses the public URL + publishable key that already ship in the
app bundle).

If **either** workflow fails, it automatically opens a GitHub **issue** with a
big red heading and step-by-step instructions — GitHub emails you the rendered
issue, so the alarm is unmissable without any SMTP service. Close the issue
once fixed.

Two gotchas, learned the hard way:

- The key hardcoded in `keepalive.yml` must be the **same publishable key the
  app uses** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). If you ever regenerate the API
  keys in Supabase, update the workflow file too — with a dead key the ping
  gets 401 and the alarm fires every day.
- GitHub sometimes never starts a schedule until the workflow has run once:
  after pushing, open **Actions → the workflow → Run workflow** one time by
  hand and confirm it goes green.

Two more scheduled workflows joined in v1.3 (both need the same
`SUPABASE_DB_URL` secret):

- **`veto-reset.yml`** — daily; a veto stays active for 7 days from the day it
  was cast (rolling, no weekly Monday reset), so this job just DELETES rows in
  the `vetos` table older than 7 days to keep it tidy and let a citizen veto
  again once theirs lapses. Per-day totals are printed to the run log; archival
  to the private git repo is planned for a future version.
- **`veto-alert.yml`** — hourly; whenever the veto ratio (active Δημότες of the
  last 7 days / confirmed Δημότες) crosses a new 10% step it opens a GitHub
  issue titled «🔴 ΒΕΤΟ ≥ X% — εβδομάδα …» and closes it immediately — GitHub
  **emails** the rendered issue. The veto window is rolling 7-day; the calendar
  week in the title is only the reminder cadence (≈ once a week per step). It
  skips silently while the secret is missing.

## 7b. Private data backup → a separate private repo (v1.4)

The weekly sync above archives only **published** content. The **private**
tables — `app_roles`, `applications`, `citizens`, `folders`, `messages`,
`referendums_participants`, `referendums`, and the veto **per-day counts** — are
archived by **`backup-private.yml`** into a **separate private repo** so they
are never lost even after Supabase deletes a row (a cleared message, an expired
veto). It runs **daily** (vetos live only 7 days, so their counts must be
captured before cleanup) and, like the public sync, writes the same files every
run and **merges** — the current DB state wins, and rows the DB has since
deleted keep their last backed copy. `vetos.json` is stored as
`{ perDay: { "YYYY-MM-DD": count } }` — exactly the truth behind the admin veto
bar chart, kept forever.

One-time setup:

1. Create a **private** repo named **`Lefkada_private`** under the same account,
   with an initial commit (tick "Add a README" when creating it).
2. Create a **Personal Access Token** with write access to it — fine-grained:
   *Only select repositories → Lefkada_private*, *Repository permissions →
   Contents: Read and write*.
3. In **this** repo → Settings → Secrets and variables → Actions, add it as
   **`PRIVATE_BACKUP_TOKEN`** (the workflow also reuses `SUPABASE_DB_URL`).
4. Actions → «Private data backup» → **Run workflow** once to confirm it goes
   green and the files appear in `Lefkada_private/data/`.

⚠️ These files hold personal data (ΑΦΜ, emails, messages, applications). The
target repo **must stay private**; a private GitHub repo keeps full history
forever, so treat it as the system of record and control who has access.

## 9. Citizen verification — email sign-in (v1.3)

Voting requires a signed-in citizen (anonymous device voting was removed):
the citizen verifies in Ρυθμίσεις ▸ Προσωπικά στοιχεία ▸ Επαλήθευση
ψηφοφόρου. Voting goes through `cast_vote()` (security definer): one account,
one vote per poll, from any device, enforced **in the database** by
`referendums_participants`' `unique(poll_id, user_id)`. The choice is written
**only** as an aggregate count in `referendums_results` — never next to a
voter — so nobody can ever pair a person with their option.

One-time setup in the Supabase dashboard:

1. **Authentication → Sign In / Providers → Allow new users to sign up → ON.**
   (It was deliberately OFF until v1.3.) `/admin`, `/reporters` and
   `/pharmacies` stay locked exactly as before — access there is granted by
   the `app_roles` table, not by the mere existence of an account, so citizen
   accounts have no role and see «Δεν έχετε πρόσβαση».
2. **You can test with your own email right away — but only your own.** The
   built-in mailer is test-only: it sends **~2 emails/hour** and **delivers
   only to addresses of the project's team** (Organization ▸ Team) — any
   other citizen sees «ελέγξτε το email σας» and *receives nothing*. That is
   also why the templates are locked («Set up custom SMTP to edit
   templates») and the email carries a sign-in **LINK** — the app fully
   supports the link: tapping it signs the citizen in and the verification
   card completes by itself (the code box is used when the email carries a
   code).
3. **Before real citizens can verify: connect custom SMTP — required, not
   optional.** (Free alternatives, July 2026: Brevo 300 emails/day — no own
   domain needed; Mailjet 200/day; Resend 100/day but needs a domain;
   SMTP2GO 1.000/μήνα.) The exact **Brevo** walkthrough, ~15 minutes:
   1. **brevo.com → Sign up free** with the mailbox that should appear as
      the sender (it becomes a verified sender automatically). Confirm the
      registration email, complete the short profile — no credit card.
   2. Brevo, top-right menu → **SMTP & API → tab "SMTP" → Generate a new
      SMTP key** (name it `supabase`) and **copy the key immediately** — it
      is shown only once. On the same page note the **Login** value: on new
      accounts it is a dedicated id like `9xxxxxx001@smtp-brevo.com` — that,
      **not** your account email, is the SMTP username (using the email
      fails with «535 authentication failed» → Supabase shows «Error
      sending confirmation email»). Also make sure the page shows no «SMTP
      account not yet activated» banner (brand-new accounts occasionally
      need to request activation there).
   3. Supabase → **Authentication → Emails → Set up custom SMTP** and fill:
      Sender email = the Brevo-verified address · Sender name =
      `Δήμος Λευκάδας` · Host = `smtp-relay.brevo.com` · Port = `587` ·
      Username = the **Login** from step 2 · Password = the SMTP key. Save.
   4. Supabase → **Authentication → Rate Limits → rate limit for sending
      emails → 100/hour** (Supabase self-caps at 30/ώρα after SMTP; Brevo's
      own 300/day is the real ceiling).
   5. Back on the Emails page the templates are now editable. Put the
      **code-only** body below into **Magic link or OTP** *and* **Confirm
      signup** (subject e.g. «Κωδικός σύνδεσης — Δήμος Λευκάδας»). No
      `{{ .ConfirmationURL }}` link on purpose: in the installed app a link
      opens the browser instead, while a numeric code works everywhere —
      and the app copy now leads with the code.

      ```html
      <h2>Δήμος Λευκάδας</h2>
      <p>Ο 8-ψήφιος κωδικός σας / Your sign-in code:</p>
      <p style="font-size:40px;font-weight:900;letter-spacing:8px;margin:16px 0">{{ .Token }}</p>
      <p>Γράψτε τον στην εφαρμογή για να συνδεθείτε. Ισχύει για 1 ώρα.<br>
      Type it in the app to sign in. Valid for 1 hour.</p>
      <p style="color:#888;font-size:12px">Αν δεν τον ζητήσατε εσείς, αγνοήστε αυτό το email.<br>
      If you didn't request this, you can ignore this email.</p>
      ```
   **Code length:** Supabase's `{{ .Token }}` is **8 digits** here (the
   length lives in Authentication → Sign In/Providers → Email → *Email OTP
   Length*); the app's input and copy expect 8. Change one and change the
   other, or verification will refuse a correct code.

   6. **Test with an address OUTSIDE the Supabase team** (e.g. a family
      member's): app → Ρυθμίσεις → Προσωπικά στοιχεία → Επαλήθευση →
      Αποστολή. A «Δήμος Λευκάδας» email with a large code must arrive
      (first one may land in spam — mark «not spam» once); the send also
      appears in Brevo → Statistics → Email. That proves citizens at large
      now receive mail — the team-only wall is gone.
4. **Volume for 20.000 δημότες:** each citizen costs about **one email,
   once** — the session persists on the device until they sign out (the
   weekly veto reset signs nobody out), re-verification is per *new device*,
   the 10%-step veto alerts arrive as GitHub issues (no SMTP involved) and
   push notifications are not emails. So 20.000 accounts ≈ 20.000 emails
   spread over the whole adoption curve — Brevo's free 300/day ≈ 9.000/μήνα
   normally covers it; for a launch-day spike, Amazon SES costs ~$0.10 ανά
   1.000 emails (όλες οι 20.000 ≈ $2) or upgrade Brevo for one month.
   Supabase's free plan itself allows 50.000 monthly active users — not a
   limit here.

**The citizen registry (μητρώο):** every verified account appears in
`/admin ▸ Δημοψηφίσματα ▸ Ψηφοφόροι` with the name/ΑΦΜ the citizen typed in
their profile (optional — zero friction) and their email. Check each one
against the official municipal roll and flip the **Δημότης** toggle:

- the flag is read by `cast_vote()` **server-side** and stored as each vote's
  `residency`, so it is always correct and can never be spoofed from a client;
- **«ψήφοι δημοτών» become the main statistic** in the admin graphs and on
  any published front-page results — everyone still votes, only the
  statistics differ;
- the citizen sees the 🏛 designation on their profile and gets a one-time
  notice when you change it. Because a vote is one-shot and its choice is never
  linked to the voter, designate Δημότες **before** a poll opens where you can
  — a confirmation made after someone has already voted can't retro-stamp their
  earlier ballot.

Citizens cannot set the `resident` flag — or their `tax_number` — themselves: a
database **trigger** rejects both (an unverified ΑΦΜ can't prove identity). Your
own direct SQL in the dashboard is exempt, so bulk imports from the roll remain
possible.

gov.gr OAuth (when the municipality's ΚΕΔ approval lands) plugs into the same
pipeline as a second sign-in method — same tables, same admin views. It will be
the only thing that sets `citizens.tax_number` (server-side), and a filled ΑΦΜ
on a `referendums_participants` row is exactly the "verified via gov.gr" signal
(there is no `verified_via` column).
