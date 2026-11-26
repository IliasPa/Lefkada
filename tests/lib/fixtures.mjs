// People and polls for the database tests.
import { as } from './db.mjs';

export const U = (n) => `${String(n).padStart(8, '0')}-1111-1111-1111-111111111111`;
export const M = '99999999-9999-9999-9999-999999999999';
export const citizen = (n) => ({ sub: U(n), email: `u${n}@x.gr` });
export const mayor = { sub: M, email: 'm@x.gr' };
export const anon = { role: 'anon' };

/** A mayor and n citizens (the first two are Δημότες). `consent` = they have
 *  accepted the voting privacy notice (needed to vote since v2.1). */
export async function seed(db, n = 12, { consent = true } = {}) {
  let sql = `insert into auth.users values ('${M}','m@x.gr'); insert into app_roles(user_id, role) values ('${M}','mayor');`;
  for (let i = 1; i <= n; i++) {
    sql += `insert into auth.users values ('${U(i)}','u${i}@x.gr');
      insert into citizens(user_id,email,resident,consent_version,consent_at)
        values ('${U(i)}','u${i}@x.gr', ${i <= 2}, ${consent ? "'test', now()" : 'null, null'});`;
  }
  await db.exec(sql);
}

/** Insert a poll (as the database owner). Returns its poll id ('ref_<uuid>'). */
export async function newRef(db, cols = {}) {
  const c = { title_el: 'T', options: '[{"id":"a","el":"A"},{"id":"b","el":"B"}]',
    ends_at: new Date(Date.now() + 3600e3).toISOString(), published: true, results_published: true, ...cols };
  const keys = Object.keys(c);
  const r = await db.query(
    `insert into referendums (${keys.join(',')}) values (${keys.map((_, i) => '$' + (i + 1)).join(',')}) returning id`,
    keys.map((k) => c[k]));
  return 'ref_' + r.rows[0].id;
}
export const refId = (pid) => pid.slice(4);
export const vote = (db, n, pid, opt) => as(db, citizen(n), () => db.query(`select cast_vote($1,$2)`, [pid, opt]));
export const state = (db, who, pid) => as(db, who, async () => (await db.query(`select poll_state($1) s`, [pid])).rows[0].s);

/** Move a poll's closing time into the past. */
export const closePoll = (db, pid, ago = '1 second') => db.exec(
  `alter table referendums disable trigger referendums_guard;
   update referendums set ends_at = now() - interval '${ago}' where id = '${refId(pid)}';
   alter table referendums enable trigger referendums_guard;`);
