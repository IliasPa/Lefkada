#!/usr/bin/env node
/**
 * Ballot relay (v2.1) — hides voters' network addresses from the voting server.
 *
 * WHO SHOULD RUN THIS: someone other than whoever runs the app's backend — the
 * whole point is that two different parties would have to compare logs to
 * connect a ballot with the account that asked for its ticket. Run by the same
 * person as the backend, it still keeps addresses away from the hosting
 * company and from anyone who breaks into one of the two — but not from you.
 *
 * WHAT IT DOES: accepts a sealed ballot from the app and passes it on to the
 * ballot-cast function. It cannot read or alter the ballot (it is encrypted to
 * the ballot box's key), it forwards NO information about the sender, and it
 * writes no logs.
 *
 *   BALLOT_CAST_URL=https://<project>.supabase.co/functions/v1/ballot-cast \
 *   SUPABASE_ANON_KEY=<the project's public key> \
 *   ALLOW_ORIGIN=https://<the app's address> \
 *   PORT=8787 node relay/relay.mjs
 *
 * Put it behind HTTPS (any reverse proxy or tunnel) and turn that proxy's
 * access log OFF — a relay that logs addresses and times defeats itself.
 * No dependencies; Node 18 or newer. relay/worker.js is the same thing for
 * Cloudflare Workers.
 */

import http from 'node:http';

const TARGET = process.env.BALLOT_CAST_URL;
const KEY = process.env.SUPABASE_ANON_KEY ?? '';
const ORIGIN = process.env.ALLOW_ORIGIN || '*';
const PORT = Number(process.env.PORT || 8787);
const MAX_BYTES = 16 * 1024;

export function createRelay({ target = TARGET, key = KEY, origin = ORIGIN, fetchImpl = fetch } = {}) {
  const cors = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
  };
  const send = (res, status, body) => {
    res.writeHead(status, { ...cors, 'Content-Type': 'application/json' });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };
  return http.createServer((req, res) => {
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    if (req.method === 'GET') return send(res, 200, { relay: 'ok' });
    if (req.method !== 'POST') return send(res, 405, { error: 'method' });
    const chunks = []; let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BYTES) { send(res, 413, { error: 'too-large' }); req.destroy(); } else chunks.push(c);
    });
    req.on('end', async () => {
      if (res.writableEnded) return;
      let sealed;
      try { sealed = JSON.parse(Buffer.concat(chunks).toString('utf8')).sealed; } catch { /* below */ }
      // Only sealed ballots pass: this is not an open proxy, and a plain ballot
      // (readable by the relay) is refused rather than forwarded.
      if (typeof sealed !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(sealed)) return send(res, 400, { error: 'sealed-only' });
      try {
        // A brand-new request: nothing of the sender's (address, headers,
        // cookies) travels on — only the sealed blob.
        const out = await fetchImpl(target, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: key },
          body: JSON.stringify({ sealed }),
        });
        send(res, out.status, await out.text());
      } catch {
        send(res, 502, { error: 'unreachable' });
      }
    });
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (!TARGET) { console.error('BALLOT_CAST_URL is required (see the comment at the top of this file)'); process.exit(1); }
  createRelay().listen(PORT, () => console.log(`ballot relay listening on :${PORT} → ${new URL(TARGET).host} (no request logging)`));
}
