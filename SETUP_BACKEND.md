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
| Results reader | `poll_state(poll_id)` — the only way results leave the database; applies each referendum's protections (v1.7) | everyone (mayor included) | function |
| Ticket keys (private) | `referendum_ticket_keys` — wrapped with the `TICKET_MASTER_KEY` secret; no API access at all (v1.8) | Edge Functions only | function |
| Sealed ballots | `referendums_ballots` — `(id, poll_id, ciphertext, opening, option_id)`; no voter, no time; opening + option filled in by the count (v1.9) | everyone once the results are public (unopened ciphertexts: always) | `ballot-cast`, `publish_tally()` |
| Ballot → Δημότης flag | `referendums_ballot_groups` — used only inside `publish_tally()` (v1.9) | nobody | `ballot-cast` |
| Used tickets / receipts | `referendums_tickets` — `(poll_id, serial_hash)`, no voter, no time, no option (v1.8) | everyone (public receipt list) | `ballot-cast` only |
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

## 10. Referendum protections (v1.7)

**Upgrading from v1.6 or earlier:** re-run the whole `supabase/schema.sql` in
the SQL editor (it is safe to re-run). Do this **before** deploying the new
app — the app now reads results through a new database function.

What changes in the database:

- `referendums` gains `hide_until_close` and `min_votes` — the per-poll
  protections, set in /admin ▸ Δημοψηφίσματα ▸ the referendum form.
- `referendums_results` loses every `SELECT` policy. Results are read only
  through `poll_state(poll_id)`, which applies the protections to **everyone,
  the mayor included**, and also tells a device whether the signed-in account
  has already voted.
- `cast_vote()` now refuses ballots for a referendum that does not exist, is
  unpublished or has ended, and options that are not on the ballot. The old
  bundled demo poll ids are no longer accepted.
- A trigger (`referendums_guard`) locks a referendum's protections while it is
  published and permanently once it has a ballot, and freezes the ballot
  options once votes exist.

Nothing else to configure. Existing referendums keep working with both
protections off — and say so to citizens on the poll.

## 11. Anonymous ballots (v1.8)

Needed only if you want to switch **«Ανώνυμα ψηφοδέλτια»** on for a
referendum. Referendums without it keep working with no setup.

1. **Re-run `supabase/schema.sql`** (adds the ticket tables and functions).
2. **Set the master key — once, and never change it.** It unlocks the stored
   ticket keys; if it is lost or replaced, referendums that are still open can
   no longer issue tickets.

   ```bash
   supabase secrets set TICKET_MASTER_KEY="$(openssl rand -base64 32)"
   ```

   Do not write it anywhere else: it should exist only as the Supabase secret.
3. **Deploy the two functions.** `ballot-cast` MUST be deployed with JWT
   verification off — a ballot arrives without any account, by design:

   ```bash
   supabase functions deploy ballot-ticket
   supabase functions deploy ballot-cast --no-verify-jwt
   ```

4. In /admin ▸ Δημοψηφίσματα, create a referendum with **Ανώνυμα
   ψηφοδέλτια** ticked and save. The page asks `ballot-ticket` to create that
   referendum's keys; if the functions are missing it says so and leaves the
   referendum as a draft.

How to read the admin card of an anonymous referendum:

- **Εισιτήρια ψήφου** — accounts that received a ticket (the participation
  roll, as before).
- **Ψηφοδέλτια που παραλήφθηκαν** — ballots counted. A few fewer than tickets
  is normal (someone's phone has not delivered yet, or never did). **More
  ballots than tickets cannot happen** — the database refuses them; if the page
  ever shows it, a ticket key has leaked and the referendum must be cancelled.

What it does not hide: the function logs of your Supabase project record the
time and IP address of every request. The app waits a few random seconds
between the ticket and the ballot, but someone with access to those logs could
still try to pair requests by time and address.

## 12. Encrypted ballots (v1.9)

Needed only for referendums with **«Κρυπτογραφημένα ψηφοδέλτια»** on. It
builds on §11 (anonymous ballots must be set up), needs **no new secret and no
new function to deploy** — only a re-run of `supabase/schema.sql` and a
redeploy of `ballot-cast` (it now also accepts sealed ballots):

```bash
supabase functions deploy ballot-cast --no-verify-jwt
```

Every encrypted referendum has a key pair. The **public** half goes into the
referendum form; the **private** half opens the ballots and must stay out of
reach until the referendum has closed.

### Option A — a key file (to try it out, or for low-stakes polls)

```bash
node scripts/tally.mjs keygen --out referendum-key.pem
```

Prints the public key (paste it into the form) and its fingerprint. The file
IS the private key: anyone who copies it can read the ballots as they come in.
Keep it off the internet (a USB stick in a drawer), and treat this option as
"encrypted against outsiders", not "encrypted against whoever holds the file".

### Option B — a hardware security key (the real thing) — NOT TESTED YET

A PIV security key (for example a YubiKey 5) generates the key **inside
itself** and cannot give it out, so sealing the device in public really does
mean nobody can open ballots early. **This path was written without a device
and has never been run** — the self-test below is how you find out whether it
works with yours, before any real referendum depends on it.

```bash
brew install ykman opensc yubico-piv-tool

# 1. Generate a P-256 key INSIDE the device, in the key-management slot (9d).
ykman piv keys generate --algorithm ECCP256 9d referendum-public.pem
# 2. Optional: the device's certificate that the key was born inside it.
ykman piv keys attest 9d referendum-attestation.pem
# 3. Prove the device opens ballots sealed to it (asks for the PIV PIN).
node scripts/tally.mjs selftest --piv --pub referendum-public.pem
```

(The two `ykman` lines follow Yubico's documented syntax but were not run
here either — check them against `ykman piv keys --help`.) If step 3 prints
✓, paste `referendum-public.pem` (and the attestation) into the referendum
form. If it fails, use option A and tell the developer what it printed.

### The procedure around it

1. Create the referendum with the public key; note the **fingerprint** the
   form shows (8 groups of 4 characters).
2. Seal the key (device or USB stick) in a tamper-evident envelope, write the
   fingerprint on it, and put it somewhere visible and locked. If someone else
   created the key and you never held it, so much the better.
3. After closing, open the envelope in public, compare the fingerprint, and
   count:

   ```bash
   node scripts/tally.mjs count --poll <referendum id> --key-file referendum-key.pem
   # or:                               --piv --pub referendum-public.pem
   ```

   The referendum id is shown in /admin under the closed referendum. The
   script refuses to run before closing and refuses a key that is not this
   referendum's.
4. Upload the resulting `tally-<id>.json` in /admin ▸ Δημοψηφίσματα. The page
   re-opens every ballot, shows the totals and asks before publishing. It
   cannot be undone.
5. Anyone can now press **Επαλήθευση καταμέτρησης** on the referendum.

**One key per referendum, or one key for all?** A file key: make a new one
per referendum. A hardware key can serve several referendums, but opening its
envelope for one ends the seal for all of them — so never let two encrypted
referendums overlap on one device, and reseal it in public after each count.

**If the key is lost or the device breaks, the votes of that referendum
cannot be counted.** There is no back door, by design.

## 13. TAXISnet verification through gov.gr (v2.0) — NOT TESTED AGAINST THE REAL SERVICE

Lets a citizen prove who they are with their TAXISnet codes, links their ΑΦΜ
to exactly one account, and enables the **«Μόνο ταυτοποιημένοι με κωδικούς
TAXISnet»** switch on referendums. Everything else works without it.

**It cannot be switched on by the developer.** The sign-in service (ΓΓΠΣΨΔ
«Υπηρεσία Αυθεντικοποίησης Χρηστών oAuth2.0») is provided to organisations
through the Κέντρο Διαλειτουργικότητας. The **municipality** applies (through
the ΕΔΑ application, by its representative or its appointed web-services
administrators) describing this system; on approval it receives the service's
addresses and a client id + secret — first for the test environment, then for
production. Confirm the current procedure with ΓΓΠΣΨΔ; the code below assumes
only a standard OAuth 2.0 authorization-code flow whose user-info answer
contains the tax number, and has only ever been run against a stand-in.

1. **Re-run `supabase/schema.sql`.** If it stops at
   `citizens_tax_number_key`, two registry rows hold the same ΑΦΜ — clear one
   of them in /admin ▸ Ψηφοφόροι and run it again.
2. In the application to ΓΓΠΣΨΔ, give this as the **redirect URI**:
   `https://<project-ref>.supabase.co/functions/v1/govgr-auth`
3. **Set the secrets** with the values from the approval:

   ```bash
   supabase secrets set \
     GOVGR_AUTHORIZE_URL="…" GOVGR_TOKEN_URL="…" GOVGR_USERINFO_URL="…" \
     GOVGR_CLIENT_ID="…" GOVGR_CLIENT_SECRET="…" \
     GOVGR_REDIRECT_URI="https://<project-ref>.supabase.co/functions/v1/govgr-auth" \
     GOVGR_APP_URL="https://<the app's public address>/" \
     GOVGR_STATE_SECRET="$(openssl rand -base64 32)"
   # optional: GOVGR_SCOPE (default "read"), GOVGR_CLIENT_AUTH=basic
   ```

4. **Deploy** — without JWT verification, because gov.gr sends the browser
   back with no Supabase session (a signed `state` carries the account):

   ```bash
   supabase functions deploy govgr-auth --no-verify-jwt
   ```

5. **Try it in the test environment** with a test account: sign in to the app
   by email, open the profile, add `NEXT_PUBLIC_GOVGR_ENABLED=1` (next step)
   and press the TAXISnet button. If the app comes back with "did not
   complete", the function's log (`supabase functions logs govgr-auth`) says
   which step failed; the two settings most likely to need changing are
   `GOVGR_CLIENT_AUTH` (how the secret is sent) and `GOVGR_SCOPE`.
6. **Show it to citizens:** set `NEXT_PUBLIC_GOVGR_ENABLED=1` in
   `web/.env.local` and in the hosting provider's environment variables, and
   redeploy the app. Only now do the button and the referendum switch appear.

What is stored: the ΑΦΜ and the time it was verified, in `citizens`. The
TAXISnet codes never reach the app — they are typed on gov.gr. The "verified"
mark can be written only by this function: an ΑΦΜ typed into the registry by
hand shows as «χωρίς ταυτοποίηση» and does not let the account vote in a
TAXISnet-only referendum.

## 14. Checking the live site against the published code (v2.1)

Nothing to deploy — one variable to set, and one habit to adopt.

**What changed in the app (automatic):** every page now carries a
Content-Security-Policy (the browser refuses connections outside a short
allow-list) and the commit it was built from (Settings ▸ «Έκδοση κώδικα»).

**If an image stops showing after this update** it is hosted somewhere the
policy does not list. Images may come from this site, `lefkada.gov.gr`,
Wikimedia, the Supabase project's storage and the map tiles; anything else
(for example an e-book cover pasted from another website) must be uploaded to
one of those or its host added to `contentSecurityPolicy()` in
`web/lib/build.ts`.

**Switch the scheduled check on:**

1. GitHub ▸ the repository ▸ Settings ▸ Secrets and variables ▸ Actions ▸
   **Variables** ▸ New variable: `LIVE_URL` = the app's public address
   (e.g. `https://lefkada.example`).
2. If the hosting provider has any of these set, add each as a variable with
   the **same name and value** — they are compiled into the files, so the
   check must build with them: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `NEXT_PUBLIC_GOVGR_ENABLED`,
   `NEXT_PUBLIC_BALLOT_DELAY_MAX_S`. (None is a secret.)
3. Actions ▸ «Verify the live site against the published code» ▸ Run
   workflow, once, to see it pass.

From then on it runs four times a day and opens an issue (GitHub emails it)
if the site serves anything other than what the published commit builds to.

**The first run is a real test.** The comparison was verified on one
computer: the same commit built in different folders gives identical files,
an honest site passes, and a changed script, an added script tag or a
tampered runtime file are each caught. Whether the hosting provider's build
(Linux, its own Node version) and GitHub's build of the same commit come out
identical has **not** been tested — if the first run reports differences on
an honest deployment, send the developer the list it prints, and try setting
the `NODE_VERSION` variable to the Node version the host builds with. (One
difference is already known and allowed: the order of entries in webpack's
runtime file varies between builds.)

**Do not rely on this workflow alone.** It lives in the same repository as
the code, so whoever can change the code can change the check. For a real
vote, ask someone independent to run it from their own computer (it needs
git, Node and no passwords), ideally on a schedule:

```bash
git clone https://github.com/IliasPa/Lefkada.git && cd Lefkada
NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… \
  node scripts/verify-live.mjs --url https://<the app's public address>
```

Also worth doing now, outside the code: two-factor sign-in on GitHub, the
hosting provider and Supabase, and a rule that changes reach `main` only
after a second person has looked at them.

## 15. Non-binding opinion polls (v2.1)

**Upgrade order matters.** The new database refuses votes from the old app
(no consent recorded), and the new app cannot record consent on the old
database. So do this **while no poll is open**, in one sitting:

1. Back up the database.
2. Re-run the whole `supabase/schema.sql`.
3. Redeploy both functions (`ballot-cast` with JWT verification off):

   ```bash
   supabase functions deploy ballot-ticket
   supabase functions deploy ballot-cast --no-verify-jwt
   ```

4. Merge to `main` and deploy the web app.
5. **Retention job.** `participation-purge.yml` uses the existing
   `SUPABASE_DB_URL` secret and runs only from `main`. **Its first run
   permanently deletes the voter lists of every poll closed more than 90 days
   ago** (encrypted polls only if counted). To keep any of them, export it
   before step 4. The 90 days appear in two places that must agree:
   `RETENTION_DAYS` in the workflow and `PARTICIPATION_RETENTION_DAYS` in
   `web/lib/backend.ts`. Run the workflow once by hand and check it succeeds.
6. Run one trial poll of each kind you will use, on a real phone, from sign-in
   to published result.

**Optional relay** (only matters for anonymous polls):

```bash
node scripts/tally.mjs keygen --out box-key.pem   # the public key it prints is not needed
supabase secrets set BALLOT_BOX_KEY="$(cat box-key.pem)"
rm box-key.pem
```

Have someone else host `relay/relay.mjs` or `relay/worker.js` (settings are in
the comment at the top of `relay.mjs`; request logging off). Then set
`NEXT_PUBLIC_BALLOT_RELAY_URL` on the web host **and** as a GitHub repository
variable (the live-site check needs it), and redeploy. Do not remove or change
it while an anonymous poll is open.

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
