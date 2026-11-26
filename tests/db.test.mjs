// The database rules, on the real supabase/schema.sql.
import { makeDb, as, expectError, ok, section } from './lib/db.mjs';
import { U, M, citizen, mayor, anon, seed, newRef, refId, vote, state, closePoll } from './lib/fixtures.mjs';

const db = await makeDb();
ok(true, 'schema.sql applies, and applies again');
await seed(db, 6);

section('One account, one vote');
const p = await newRef(db);
await vote(db, 1, p, 0);
await expectError(vote(db, 1, p, 1), /23505/, 'a second vote is refused');
await expectError(vote(db, 2, p, 7), /LF002/, 'an option not on the ballot is refused');
await expectError(as(db, anon, () => db.query(`select cast_vote($1,0)`, [p])), /42501|permission/, 'signed-out voting is refused');
const draft = await newRef(db, { published: false });
await expectError(vote(db, 2, draft, 0), /LF001/, 'an unpublished poll takes no votes');
const late = await newRef(db);
await closePoll(db, late);
await expectError(vote(db, 2, late, 0), /LF001/, 'a closed poll takes no votes');

section('Consent to the privacy notice');
await db.exec(`update citizens set consent_version = null, consent_at = null where user_id = '${U(3)}'`);
await expectError(vote(db, 3, p, 0), /LF009/, 'no consent, no vote');
await expectError(as(db, citizen(3), () => db.query(`update citizens set consent_version='x', consent_at=now() where user_id=$1`, [U(3)])),
  /accept_voting_terms/, 'consent cannot be written directly');
await expectError(as(db, anon, () => db.query(`select accept_voting_terms('2026-11')`)), /42501|permission/, 'signed-out consent is refused');
await expectError(as(db, citizen(3), () => db.query(`select accept_voting_terms('bad version!')`)), /LF002/, 'a malformed version is refused');
await as(db, citizen(3), () => db.query(`select accept_voting_terms('2026-11')`));
await vote(db, 3, p, 1);
ok(true, 'after accepting, the vote goes through');
const fresh = { sub: '00000042-1111-1111-1111-111111111111', email: 'new@x.gr' };
await db.exec(`insert into auth.users values ('${fresh.sub}','${fresh.email}')`);
await as(db, fresh, () => db.query(`select accept_voting_terms('2026-11')`));
ok((await db.query(`select resident from citizens where user_id=$1`, [fresh.sub])).rows[0].resident === false,
  'a brand-new account can accept, and is not made a Δημότης');

section('Turnout and protections');
const hidden = await newRef(db, { hide_until_close: true });
await vote(db, 1, hidden, 0);
let s = await state(db, citizen(2), hidden);
ok(s.state === 'until_close' && s.turnout === 1 && s.eligible === 7, 'turnout is public while results are hidden');
ok(s.voted === false && (await state(db, citizen(1), hidden)).voted === true, 'each account sees only whether it voted');
ok((await state(db, mayor, hidden)).state === 'until_close', 'hidden from the mayor too');
await expectError(as(db, mayor, () => db.query(`update referendums set hide_until_close=false where id=$1`, [refId(hidden)])),
  /LF010/, 'protections are locked after publishing');
await expectError(as(db, mayor, () => db.query(`update referendums set options='[]' where id=$1`, [refId(hidden)])),
  /LF011/, 'options are locked once voted');
ok((await state(db, anon, draft)).turnout === null, 'a draft shows the public no turnout');

section('Retention of the participation roll');
const old = await newRef(db);
for (const n of [1, 2, 3]) await vote(db, n, old, 0);
const recent = await newRef(db);
await vote(db, 1, recent, 0);
const uncounted = await newRef(db, { encrypted_ballots: true, anonymous_ballots: true, hide_until_close: true, encryption_key: 'A'.repeat(124), published: false });
await closePoll(db, old, '91 days');
await closePoll(db, recent, '89 days');
await closePoll(db, uncounted, '200 days');
for (const who of [anon, citizen(1), mayor]) {
  await expectError(as(db, who, () => db.query(`select purge_participation(90)`)), /42501|permission/, `purge is not callable as ${who.role ?? who.email}`);
}
await expectError(db.query(`select purge_participation(1)`), /LF002/, 'retention under 7 days is refused');
const n = (await db.query(`select purge_participation(90) n`)).rows[0].n;
const roll = async (pid) => (await db.query(`select count(*)::int c from referendums_participants where poll_id=$1`, [pid])).rows[0].c;
ok(n === 1 && await roll(old) === 0 && await roll(recent) === 1, 'only the poll past the retention period is purged (an uncounted encrypted one waits)');
s = await state(db, citizen(1), old);
ok(s.voted === null && s.turnout === 3 && s.state === 'visible' && s.rows.reduce((a, r) => a + r.v, 0) === 3,
  'totals and results survive; nobody\'s participation is on record');
const r = (await db.query(`select turnout_residents_final t from referendums where id=$1`, [refId(old)])).rows[0];
ok(r.t === 2, 'the Δημότες turnout is kept');
ok((await db.query(`select purge_participation(90) n`)).rows[0].n === 0, 'running it again does nothing');
await expectError(as(db, mayor, () => db.query(`update referendums set turnout_final=999 where id=$1`, [refId(old)])),
  /LF015/, 'the saved totals cannot be edited');

section('A purged poll can never be reopened (everyone could vote twice)');
await expectError(as(db, mayor, () => db.query(`update referendums set ends_at = now() + interval '1 day' where id=$1`, [refId(old)])),
  /LF016/, 'the closing date is locked');
await expectError(as(db, mayor, () => db.query(`update referendums set options='[{"id":"a","el":"X"},{"id":"b","el":"Y"}]' where id=$1`, [refId(old)])),
  /LF011/, 'the options stay locked');
await expectError(as(db, mayor, () => db.query(`update referendums set anonymous_ballots=true where id=$1`, [refId(old)])),
  /LF010/, 'the protections stay locked');
await as(db, mayor, () => db.query(`update referendums set results_published=false where id=$1`, [refId(old)]));
ok(true, 'publishing / unpublishing results still works');
await expectError(vote(db, 4, old, 0), /LF001/, 'and nobody can vote in it');

section('The official referendum is information only');
await as(db, mayor, () => db.query(`insert into content(kind, data, published) values ('official_referendum', '{}', true)`));
ok(true, 'the mayor can announce it');
await expectError(as(db, citizen(1), () => db.query(`insert into content(kind, data, published) values ('official_referendum', '{}', true)`)),
  /42501|row-level/, 'a citizen cannot');
await db.close();
