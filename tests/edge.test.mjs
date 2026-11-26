// Anonymous, encrypted and relayed ballots end to end: the app's own crypto
// (web/lib) → the real Edge Function handlers → the real schema.
import './lib/hooks.mjs';
import crypto from 'node:crypto';
import { makeDb, as, ok, section } from './lib/db.mjs';
import { citizen, mayor, seed, newRef, refId, state, closePoll, M } from './lib/fixtures.mjs';
import { depsFor, call } from './lib/edge.mjs';

const { handleTicket, handleCast } = await import('../supabase/functions/_shared/ballot.ts');
const { newTicket, finishTicket, receiptOf } = await import('../web/lib/ballotCrypto.ts');
const { sealBallot, sealEnvelope, openBallot } = await import('../web/lib/ballotSeal.ts');
const tally = await import('../scripts/tally.mjs');
const { createRelay } = await import('../relay/relay.mjs');
const worker = (await import('../relay/worker.js')).default;

const db = await makeDb();
await seed(db, 6);
const box = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const BOX_PEM = box.privateKey.export({ type: 'pkcs8', format: 'pem' });
const BOX_PUB = box.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
const deps = depsFor(db, { boxKey: BOX_PEM });

async function anonymousPoll(cols = {}) {
  const pid = await newRef(db, { anonymous_ballots: true, hide_until_close: true, published: false, ...cols });
  const init = await call(handleTicket, deps, { action: 'init', referendum_id: refId(pid) }, M);
  if (init.status !== 200) throw new Error('init: ' + JSON.stringify(init.body));
  await db.exec(`update referendums set published = true where id = '${refId(pid)}'`);
  return { pid, keys: init.body.keys };
}
async function ticketFor(n, { pid, keys }) {
  const resident = n <= 2;
  const t = await newTicket(pid, resident, keys);
  const res = await call(handleTicket, deps, { action: 'sign', poll_id: pid, resident, blinded: t.blinded }, citizen(n).sub);
  if (res.status !== 200) return { res };
  return { res, resident, serial: t.serial, signature: await finishTicket(pid, resident, keys, t, res.body.signature) };
}
const ballot = (poll, t, choice) => ({ poll_id: poll.pid, ...choice, resident: t.resident, serial: t.serial, signature: t.signature });

section('Anonymous ballots');
const a = await anonymousPoll();
const t1 = await ticketFor(1, a);
ok(t1.res.status === 200, 'a signed-in citizen gets a ticket');
ok((await ticketFor(1, a)).res.body.error === '23505', 'one ticket per account');
let r = await call(handleCast, deps, ballot(a, t1, { option: 0 }));
ok(r.status === 200 && r.body.receipt === await receiptOf(a.pid, t1.serial), 'the ballot is accepted with no account, and gives a receipt');
ok((await call(handleCast, deps, ballot(a, t1, { option: 1 }))).body.error === '23505', 'a ticket works once');
const t2 = await ticketFor(2, a);
ok((await call(handleCast, deps, { ...ballot(a, t2, { option: 0 }), resident: false })).status === 403, 'a Δημότης ticket cannot be passed off as another');
await db.exec(`update citizens set consent_version = null, consent_at = null where user_id = '${citizen(6).sub}'`);
ok((await ticketFor(6, a)).res.body.error === 'LF009', 'no ticket without consent');

section('Through the relay');
const forwarded = [];
const toBox = async (_url, init) => {
  forwarded.push(init);
  return handleCast(new Request('http://x/fn', init), deps);
};
const relay = createRelay({ target: 'http://x/fn', key: 'public', origin: '*', fetchImpl: toBox });
await new Promise((res) => relay.listen(0, '127.0.0.1', res));
const relayUrl = `http://127.0.0.1:${relay.address().port}`;
const viaRelay = (body) => fetch(relayUrl, { method: 'POST', body,
  headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.9', Authorization: 'Bearer secret', Cookie: 'a=b' } });
const key = (await (await handleCast(new Request('http://x/fn'), deps)).json()).key;
ok(key === BOX_PUB, 'the server hands out the ballot box PUBLIC key');
const sealed = await sealEnvelope(key, JSON.stringify(ballot(a, t2, { option: 1 })));
ok(Buffer.from(sealed, 'base64').length === 65 + 12 + 1024 + 16, 'every envelope has the same size');
const out = await viaRelay(JSON.stringify({ sealed, extra: 'dropped' }));
ok(out.status === 200 && (await out.json()).ok, 'a sealed ballot is counted through the relay');
ok(JSON.stringify(forwarded[0].headers) === JSON.stringify({ 'Content-Type': 'application/json', apikey: 'public' })
  && forwarded[0].body === JSON.stringify({ sealed }), 'nothing about the sender is forwarded');
ok((await viaRelay(JSON.stringify(ballot(a, t2, { option: 1 })))).status === 400 && forwarded.length === 1, 'an unsealed ballot is not forwarded');
ok((await viaRelay('x'.repeat(20000)).catch(() => ({ status: 413 }))).status === 413, 'oversized requests are refused');
const tampered = Buffer.from(sealed, 'base64'); tampered[200] ^= 1;
ok((await call(handleCast, deps, { sealed: tampered.toString('base64') })).body.error === 'sealed', 'a tampered envelope is refused');
ok((await call(handleCast, depsFor(db), { sealed })).body.error === 'sealed', 'without BALLOT_BOX_KEY sealed ballots are refused');
ok((await (await handleCast(new Request('http://x/fn'), depsFor(db))).json()).key === null, '…and no key is offered');
relay.close();
const realFetch = globalThis.fetch;
let sent;
globalThis.fetch = async (_u, init) => { sent = init; return new Response('{"ok":true}'); };
const w = await worker.fetch(new Request('http://w', { method: 'POST', headers: { Cookie: 'a=b' }, body: JSON.stringify({ sealed }) }),
  { BALLOT_CAST_URL: 'http://x/fn', SUPABASE_ANON_KEY: 'public' });
ok(w.status === 200 && !JSON.stringify(sent).includes('a=b'), 'the Cloudflare worker forwards only the sealed ballot');
sent = undefined;
ok((await worker.fetch(new Request('http://w', { method: 'POST', body: '{"option":1}' }), {})).status === 400 && !sent, '…and refuses unsealed ones');
globalThis.fetch = realFetch;
await closePoll(db, a.pid);
let s = await state(db, citizen(3), a.pid);
ok(s.turnout === 2 && s.rows.reduce((x, y) => x + y.v, 0) === 2, 'two tickets, two ballots, two counted');

section('Encrypted ballots, counted with the key holder\'s script logic');
const holder = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const encKey = holder.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
const e = await anonymousPoll({ encrypted_ballots: true, encryption_key: encKey });
const choices = [0, 1, 1];
for (let i = 0; i < choices.length; i++) {
  const t = await ticketFor(i + 1, e);
  const res = await call(handleCast, deps, ballot(e, t, { ciphertext: await sealBallot(e.pid, choices[i], encKey) }));
  if (res.status !== 200) throw new Error('cast: ' + JSON.stringify(res.body));
}
const t4 = await ticketFor(4, e);
ok((await call(handleCast, deps, ballot(e, t4, { option: 0 }))).body.error === 'LF007', 'a plain ballot is refused');
s = await state(db, mayor, e.pid);
ok(s.turnout === 4 && !(s.rows ?? []).length, 'no tally exists before the count, even for the mayor');
await closePoll(db, e.pid);
const rows = (await db.query(`select id, ciphertext from referendums_ballots where poll_id=$1`, [e.pid])).rows;
const count = {};
for (const row of rows) {
  const raw = Buffer.from(row.ciphertext, 'base64');
  const point = raw.subarray(0, 65);
  const eph = crypto.createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256',
    x: point.subarray(1, 33).toString('base64url'), y: point.subarray(33).toString('base64url') } });
  const jwk = holder.publicKey.export({ format: 'jwk' });
  const mine = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]);
  const k = Buffer.from(crypto.hkdfSync('sha256', crypto.diffieHellman({ privateKey: holder.privateKey, publicKey: eph }),
    Buffer.concat([point, mine]), Buffer.from('lefkada-ballot-enc-v1'), 32));
  const o = tally.openBallot(e.pid, row.ciphertext, k);
  if (o !== await openBallot(e.pid, row.ciphertext, k.toString('base64'))) throw new Error('script and app disagree');
  count[row.id] = { k: k.toString('base64'), o };
}
const done = await as(db, mayor, () => db.query(`select publish_tally($1,$2) t`, [e.pid, JSON.stringify(count)]));
ok(done.rows[0].t.counted === 3, 'the count covers all 3 ballots');
s = await state(db, citizen(5), e.pid);
const byOption = [0, 1].map((o) => s.rows.filter((x) => x.o === o).reduce((x, y) => x + y.v, 0));
ok(byOption[0] === 1 && byOption[1] === 2, 'the published result matches what was cast');
await db.close();
