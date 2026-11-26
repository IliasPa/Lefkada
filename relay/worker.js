/**
 * Ballot relay for Cloudflare Workers (v2.1) — the same job as relay/relay.mjs:
 * pass a SEALED ballot on to the ballot-cast function without anything that
 * identifies the sender. Whoever deploys this should not be the one running
 * the app's backend (see relay/relay.mjs for why).
 *
 * Worker variables: BALLOT_CAST_URL, SUPABASE_ANON_KEY, ALLOW_ORIGIN.
 * Keep Workers Logs / Logpush OFF for this worker.
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Cache-Control': 'no-store',
    };
    const send = (status, body) => new Response(typeof body === 'string' ? body : JSON.stringify(body),
      { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method === 'GET') return send(200, { relay: 'ok' });
    if (request.method !== 'POST') return send(405, { error: 'method' });
    const text = await request.text();
    if (text.length > 16 * 1024) return send(413, { error: 'too-large' });
    let sealed;
    try { sealed = JSON.parse(text).sealed; } catch { /* below */ }
    if (typeof sealed !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(sealed)) return send(400, { error: 'sealed-only' });
    try {
      // A new request built from scratch: no header of the sender's is copied.
      const out = await fetch(env.BALLOT_CAST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: env.SUPABASE_ANON_KEY || '' },
        body: JSON.stringify({ sealed }),
      });
      return send(out.status, await out.text());
    } catch {
      return send(502, { error: 'unreachable' });
    }
  },
};
