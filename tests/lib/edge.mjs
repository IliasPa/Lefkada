// Runs the Edge Function handlers (supabase/functions/_shared) against the
// local database, standing in for the Supabase client they get in production.
import crypto from 'node:crypto';
import { as } from './db.mjs';

export const MASTER = crypto.randomBytes(32).toString('base64');

export function depsFor(db, extra = {}) {
  return {
    masterKey: MASTER,
    getUser: async (jwt) => (jwt ? { id: jwt } : null), // db tests use the user id as the "token"
    rpc: (fn, args) => as(db, { role: 'service_role' }, async () => {
      const keys = Object.keys(args);
      try {
        const r = await db.query(
          `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as out`,
          keys.map((k) => (args[k] !== null && typeof args[k] === 'object' ? JSON.stringify(args[k]) : args[k])));
        return { data: r.rows[0].out, error: null };
      } catch (e) { return { data: null, error: { code: e.code, message: e.message } }; }
    }),
    ...extra,
  };
}

/** POST a JSON body to a handler; `jwt` becomes the Authorization bearer. */
export async function call(handler, deps, body, jwt) {
  const res = await handler(new Request('http://x/fn', { method: 'POST',
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}, body: JSON.stringify(body) }), deps);
  return { status: res.status, body: await res.json() };
}

/** The user a fake browser session token belongs to (see mock.mjs ▸ sessionFor). */
export const userFromFakeJwt = async (jwt) => {
  try { return { id: JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url')).sub }; } catch { return null; }
};
