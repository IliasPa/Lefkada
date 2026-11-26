// The real screens in a real browser: the app is built (in a temporary copy —
// web/out is left alone) against a made-up backend address, and every request
// to it is answered by the real schema.sql + Edge Function handlers.
import './lib/hooks.mjs';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { chromium } from 'playwright-core';
import { makeDb, as, ok, section, ROOT } from './lib/db.mjs';
import { U, M, citizen, seed, newRef, refId, closePoll } from './lib/fixtures.mjs';
import { depsFor, userFromFakeJwt, call } from './lib/edge.mjs';

const { handleTicket, handleCast } = await import('../supabase/functions/_shared/ballot.ts');
const BACKEND = 'https://fake.supabase.test';
const RELAY = 'https://fake.relay.test';

// ── Build ────────────────────────────────────────────────────────────────────
const work = mkdtempSync(join(tmpdir(), 'lefkada-web-'));
const web = join(work, 'web');
cpSync(join(ROOT, 'web'), web, { recursive: true,
  filter: (p) => !/\/web\/(node_modules|\.next|out|\.env[^/]*)$/.test(p) });
symlinkSync(join(ROOT, 'web', 'node_modules'), join(web, 'node_modules'));
console.log('building the app…');
try {
  execFileSync('npx', ['next', 'build'], { cwd: web, stdio: 'pipe', env: { ...process.env,
    BUILD_COMMIT: 'test', NEXT_PUBLIC_SUPABASE_URL: BACKEND, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-test-key',
    NEXT_PUBLIC_BALLOT_RELAY_URL: RELAY, NEXT_PUBLIC_BALLOT_DELAY_MAX_S: '2', NEXT_PUBLIC_GOVGR_ENABLED: '' } });
} catch (e) { console.error(String(e.stdout), String(e.stderr)); process.exit(1); }
ok(true, 'next build succeeds');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let f = join(web, 'out', decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const APP = `http://127.0.0.1:${server.address().port}`;

// ── Fake backend ─────────────────────────────────────────────────────────────
const db = await makeDb();
await seed(db, 4, { consent: false });
const box = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const deps = depsFor(db, { boxKey: box.privateKey.export({ type: 'pkcs8', format: 'pem' }), getUser: async (jwt) => {
  const u = await userFromFakeJwt(jwt); return u?.id ? u : null; } });
const plain = await newRef(db, { title_el: 'Απλή ψηφοφορία' });
const anonPoll = await newRef(db, { title_el: 'Ανώνυμη ψηφοφορία', anonymous_ballots: true, hide_until_close: true, published: false });
await call(handleTicket, { ...deps, getUser: async () => ({ id: M }) }, { action: 'init', referendum_id: refId(anonPoll) }, 'mayor');
await db.exec(`update referendums set published = true where id = '${refId(anonPoll)}'`);
const sunday = new Date(Date.now() + 21 * 864e5); sunday.setUTCDate(sunday.getUTCDate() + ((7 - sunday.getUTCDay()) % 7));
await db.query(`insert into content(kind, data, published) values ('official_referendum', $1, true)`, [JSON.stringify({
  question: { el: 'Επίσημο ερώτημα δοκιμής', en: 'Test question' }, answerA: { el: 'ΝΑΙ', en: 'YES' }, answerB: { el: 'ΟΧΙ', en: 'NO' },
  voteDate: sunday.toISOString().slice(0, 10), emepDeadline: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) })]);

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function sessionFor(n) {
  const { sub, email } = citizen(n);
  const exp = Math.floor(Date.now() / 1000) + 86400;
  return { access_token: `${b64u({ alg: 'HS256' })}.${b64u({ sub, email, exp, role: 'authenticated' })}.x`, refresh_token: 'r',
    token_type: 'bearer', expires_in: 86400, expires_at: exp, user: { id: sub, email, aud: 'authenticated', role: 'authenticated' } };
}

const direct = [];   // ballots that reached ballot-cast without the relay
const relayed = [];  // requests to the relay
const unknown = new Set();
const traffic = [];  // every request body / URL sent to the backend
async function backend(route) {
  const req = route.request(); const url = new URL(req.url()); const method = req.method();
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
  const reply = (status, body) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
  if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
  const jwt = (req.headers()['authorization'] ?? '').replace(/^Bearer\s+/i, '');
  traffic.push(`${url.href} ${req.postData() ?? ''}`);
  const user = await userFromFakeJwt(jwt).catch(() => null);
  const who = user?.id ? { sub: user.id, email: `u${Number(user.id.slice(0, 8))}@x.gr` } : { role: 'anon' };
  const fn = async (handler, body, h = {}) => {
    const res = await handler(new Request('http://x/fn', { method, headers: h, body: method === 'POST' ? body : undefined }), deps);
    return reply(res.status, await res.json());
  };
  if (url.origin === RELAY) { relayed.push({ headers: req.headers(), body: req.postData() }); return fn(handleCast, req.postData()); }
  if (url.pathname === '/functions/v1/ballot-ticket') return fn(handleTicket, req.postData(), { Authorization: `Bearer ${jwt}` });
  if (url.pathname === '/functions/v1/ballot-cast') { if (method === 'POST') direct.push(req.postData()); return fn(handleCast, req.postData()); }
  const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/)?.[1];
  const table = url.pathname.match(/^\/rest\/v1\/(\w+)$/)?.[1];
  try {
    if (rpc) {
      const args = JSON.parse(req.postData() || '{}'); const keys = Object.keys(args);
      const r = await as(db, who, () => db.query(`select public.${rpc}(${keys.map((k, i) => `${k} => $${i + 1}`)}) o`, keys.map((k) => args[k])));
      return reply(200, r.rows[0].o);
    }
    if (method === 'GET' && ['referendums', 'content', 'citizens', 'referendums_tickets', 'referendums_ballots'].includes(table)) {
      const where = []; const vals = [];
      for (const [k, v] of url.searchParams) {
        const m = v.match(/^eq\.(.*)$/); if (!m) continue;
        vals.push(m[1]); where.push(`${k} = $${vals.length}`);
      }
      const r = await as(db, who, () => db.query(`select * from public.${table}${where.length ? ' where ' + where.join(' and ') : ''}`, vals));
      return reply(200, r.rows);
    }
  } catch (e) { return reply(400, { code: e.code, message: e.message }); }
  unknown.add(`${method} ${url.pathname}`);
  return reply(200, []);
}

// ── The screens ──────────────────────────────────────────────────────────────
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chromium' });
const errors = [];
async function open(n, waitFor = 'Απλή ψηφοφορία') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'el-GR' });
  await ctx.route((u) => !u.href.startsWith(APP), (route) => {
    const o = new URL(route.request().url()).origin;
    return o === BACKEND || o === RELAY ? backend(route) : route.abort();
  });
  // Only in the app's own page: blocked frames (YouTube) have no storage.
  if (n) await ctx.addInitScript(([s, app]) => { if (location.origin === app) localStorage.setItem('sb-fake-auth-token', s); }, [JSON.stringify(sessionFor(n)), APP]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${APP}/?tab=account`);
  await page.getByText(waitFor).first().waitFor({ timeout: 30000 });
  return { ctx, page };
}
const count = async (sql) => (await db.query(sql)).rows[0].c;
const until = async (fn, label) => { for (let i = 0; i < 100; i++) { if (await fn()) return ok(true, label); await new Promise((r) => setTimeout(r, 150)); } ok(false, label); };
/** The part of the page that belongs to one poll. */
const card = (page, title) => page.locator('.snap-start, section, article, div').filter({ has: page.getByRole('heading', { name: title }) })
  .filter({ has: page.getByText('Τι αποθηκεύεται όταν ψηφίζω;') }).last();

try {
  section('Signed out');
  let { ctx, page } = await open(0);
  await page.getByText('Επίσημο ερώτημα δοκιμής').waitFor();
  ok(await page.getByText('Η ψηφοφορία ΔΕΝ γίνεται μέσα σε αυτή την εφαρμογή').isVisible(), 'the official referendum is announced as not held in the app');
  ok(await page.getByText('Εγγραφή / έλεγχος στο Ε.Μ.Επ.').isVisible(), 'with the registration reminder');
  ok(await page.getByText('Ανεπίσημη ψηφοφορία γνώμης της εφαρμογής').count() >= 2, 'every app poll is labelled unofficial');
  await page.getByText(/Συμμετοχή: 0 από 4/).first().waitFor();
  ok(true, 'turnout is shown');

  section('Demo polls (signed out)');
  ok(await page.getByText('ΔΟΚΙΜΑΣΤΙΚΗ ΨΗΦΟΦΟΡΙΑ').count() === 3, 'all three demos are open and labelled');
  const bridge = () => page.locator('div.space-y-3')
    .filter({ has: page.getByRole('heading', { name: /μόνιμη οδική γέφυρα/ }) }).filter({ has: page.getByText('ΔΟΚΙΜΑΣΤΙΚΗ ΨΗΦΟΦΟΡΙΑ') }).first();
  await bridge().getByText(/^Ναι – μόνιμη γέφυρα/).click();
  const hold = bridge().getByRole('button', { name: /Υποβολή Ψήφου/ });
  await hold.scrollIntoViewIfNeeded();
  const hb = await hold.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down(); await page.waitForTimeout(4600); await page.mouse.up();
  await bridge().getByText('Η δοκιμαστική ψήφος καταγράφηκε').waitFor();
  ok(await bridge().getByText('Δοκιμαστικά, επινοημένα νούμερα').isVisible(), 'a vote works without signing in, and the numbers are marked invented');
  ok(await bridge().getByText('877').count() === 1, 'the vote is added to the demo tally');
  await page.reload();
  await page.getByText('Η δοκιμαστική ψήφος καταγράφηκε').waitFor();
  ok(true, 'it is remembered on the device');
  if (process.env.SHOT) { await bridge().screenshot({ path: process.env.SHOT }); }
  ok(!traffic.some((x) => /poll_bridge|poll_marina|poll_recycling/.test(x)), 'nothing about a demo ever reaches the backend');
  await ctx.close();

  section('First vote: consent, then one shot');
  ({ ctx, page } = await open(1));
  let c = card(page, 'Απλή ψηφοφορία');
  await c.getByRole('button', { name: /συμφωνήστε για να ψηφίσετε/ }).click();
  const dialog = page.getByRole('dialog');
  ok(await dialog.getByRole('button', { name: 'Συμφωνώ' }).isDisabled(), '«Συμφωνώ» waits for the tick');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Συμφωνώ' }).click();
  await dialog.waitFor({ state: 'hidden' });
  ok(await count(`select count(*)::int c from citizens where user_id='${U(1)}' and consent_version is not null`) === 1, 'consent is recorded');
  await c.getByText('A', { exact: true }).first().click();
  const submit = c.getByRole('button').filter({ hasText: /Ψηφίστε|Ψήφισε|Υποβολή|Καταχώρηση|Κρατήστε/ }).last();
  const bb = await (await submit.elementHandle({ timeout: 10000 })).boundingBox();
  await submit.scrollIntoViewIfNeeded();
  const bb2 = await submit.boundingBox() ?? bb;
  await page.mouse.move(bb2.x + bb2.width / 2, bb2.y + bb2.height / 2);
  await page.mouse.down(); await page.waitForTimeout(4600); await page.mouse.up();
  await until(async () => await count(`select count(*)::int c from referendums_participants where poll_id='${plain}'`) === 1, 'the vote reaches the server');
  await page.getByText(/Συμμετοχή: 1 από/).first().waitFor();
  ok(true, 'turnout updates');

  section('Anonymous ballot through the relay');
  c = card(page, 'Ανώνυμη ψηφοφορία');
  await c.getByText('B', { exact: true }).first().click();
  const s2 = c.getByRole('button').filter({ hasText: /Ψηφίστε|Ψήφισε|Υποβολή|Καταχώρηση|Κρατήστε/ }).last();
  await s2.scrollIntoViewIfNeeded();
  const b3 = await s2.boundingBox();
  await page.mouse.move(b3.x + b3.width / 2, b3.y + b3.height / 2);
  await page.mouse.down(); await page.waitForTimeout(4600); await page.mouse.up();
  await until(async () => await count(`select count(*)::int c from referendums_tickets where poll_id='${anonPoll}'`) === 1, 'the ballot is counted after its delay');
  ok(relayed.length === 1 && direct.length === 0, 'it went through the relay, never directly');
  ok(!relayed[0].headers.authorization && !relayed[0].headers.cookie && Object.keys(JSON.parse(relayed[0].body)).join() === 'sealed',
    'sealed, with no account attached');
  await ctx.close();

  section('Another device, after closing and retention');
  ({ ctx, page } = await open(1));
  ok(await card(page, 'Απλή ψηφοφορία').getByRole('button').filter({ hasText: /Ψηφίστε|Υποβολή|Κρατήστε/ }).count() === 0, 'no second ballot is offered');
  await ctx.close();
  await closePoll(db, plain, '91 days');
  await db.query(`select purge_participation(90)`);
  ({ ctx, page } = await open(1, 'Ανώνυμη ψηφοφορία'));
  await page.getByRole('button', { name: 'Δείτε παλαιότερες ψηφοφορίες' }).click();
  await page.getByText('Απλή ψηφοφορία').first().waitFor();
  await page.getByText('Η καταγραφή του ποιος συμμετείχε σε αυτή την ψηφοφορία έχει διαγραφεί').first().waitFor();
  ok(true, 'the finished poll says the participation record was deleted');
  ok(await page.getByText(/Συμμετοχή: 1 από/).count() >= 1, 'and still shows the turnout');
  ok(await page.getByRole('heading', { name: /μόνιμη οδική γέφυρα|μαρίνα του Νυδριού|ανακύκλωση/ }).count() === 0, 'demos never appear among past polls');
  await ctx.close();

  ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  if (unknown.size) console.log('  (requests answered with an empty list:', [...unknown].join(', '), ')');
} catch (e) {
  const p = browser.contexts().at(-1)?.pages()[0];
  if (p) { await p.screenshot({ path: join(tmpdir(), 'lefkada-failure.png'), fullPage: true }); console.log('screenshot:', join(tmpdir(), 'lefkada-failure.png')); }
  console.error(e.message.split('\n').slice(0, 12).join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close(); server.close(); await db.close();
  rmSync(work, { recursive: true, force: true });
}
