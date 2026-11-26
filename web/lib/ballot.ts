'use client';

/**
 * Anonymous ballots (v1.8) — what the phone does when a referendum has
 * «Ανώνυμα ψηφοδέλτια» on. One tap for the citizen; underneath, two requests
 * the server cannot connect (see lib/ballotCrypto.ts and
 * supabase/functions/_shared/ballot.ts):
 *
 *   1. ballot-ticket — WITH the account: "sign this blinded ticket".
 *   2. ballot-cast   — WITHOUT the account, a few seconds later: the option
 *                      plus the unblinded ticket.
 *
 * The ticket lives only on this device. It is saved BEFORE each request, so a
 * dropped connection or a closed app never loses the vote: the next visit
 * picks up where it stopped (resumePendingBallot).
 *
 * v2.1 — step 2 is SCHEDULED, not immediate: the ballot waits a random few
 * minutes (BALLOT_DELAY) so it does not arrive right behind the ticket request,
 * which is what would let someone reading the server's request log pair the
 * two. Reliability comes first, though: if the citizen leaves the app before
 * the wait is over, the ballot is sent at that moment (flushPendingBallots) —
 * a vote is never left stranded on a phone for the sake of the delay.
 */

import type { Poll } from '@/data/voting';
import { getSupabase, supabaseUrl, supabaseAnonKey } from './supabase';
import { KEYS, storageGet, storageSet } from './storage';
import { newTicket, finishTicket, receiptOf, type BlindedTicket } from './ballotCrypto';
import { sealBallot, sealEnvelope } from './ballotSeal';
import { fetchOwnCitizenStatus, getVerifiedUser, type VoteOutcome } from './backend';

/** 'scheduled' — the ticket is signed and the ballot is waiting out its random
 *                delay; it goes by itself (or the moment the app is left).
 *  'pending'   — a delivery was tried and did not get through; it is retried
 *                (nothing is lost, nothing more to do for the citizen). */
export type BallotOutcome = VoteOutcome | 'scheduled' | 'pending';

/** The random wait between ticket and ballot, in ms: uniform between a tenth
 *  of the maximum and the maximum. NEXT_PUBLIC_BALLOT_DELAY_MAX_S (seconds,
 *  default 600 = ten minutes; 0 switches the wait off). */
const DELAY_MAX_MS = Math.max(0, Number(process.env.NEXT_PUBLIC_BALLOT_DELAY_MAX_S ?? 600) || 0) * 1000;
/** Never schedule a ballot later than this long before the poll closes. */
const CLOSING_MARGIN_MS = 120_000;

interface PendingBallot {
  pollId: string;
  /** Option id + its 0-based ballot index (the index is what is sent). */
  optionId: string;
  option: number;
  resident: boolean;
  ticket: BlindedTicket;
  /** Present once the server signed the ticket — from then on only step 2 is left. */
  signature?: string;
  endsAt: string;
  /** v1.9: the referendum's public encryption key — the ballot is then sent
   *  SEALED (a ciphertext instead of the option). */
  encryptionKey?: string;
  /** v2.1: the exact request that will be sent (sealed already, if the
   *  referendum is encrypted) and when it is due — prepared the moment the
   *  ticket is signed, so sending it later is a single request. */
  body?: string;
  sendAt?: number;
}

type Store<T> = Record<string, T>;
const keyOf = (userId: string, pollId: string) => `${userId}:${pollId}`;

const getPending = (k: string) => storageGet<Store<PendingBallot>>(KEYS.pendingBallots, {})[k];
function setPending(k: string, p: PendingBallot | null) {
  const all = storageGet<Store<PendingBallot>>(KEYS.pendingBallots, {});
  if (p) all[k] = p; else delete all[k];
  storageSet(KEYS.pendingBallots, all);
}

/** What this device still owes for a poll: the option picked and when the
 *  ballot is due (0 = now / overdue). null when nothing is waiting. */
export function pendingBallotInfo(userId: string, pollId: string): { optionId: string; dueIn: number } | null {
  const p = getPending(keyOf(userId, pollId));
  if (!p) return null;
  return { optionId: p.optionId, dueIn: p.signature && p.sendAt ? Math.max(0, p.sendAt - Date.now()) : 0 };
}

/** The receipt code of a ballot cast from this device (64 hex chars), if any. */
export function getReceipt(userId: string, pollId: string): string | undefined {
  return storageGet<Store<string>>(KEYS.ballotReceipts, {})[keyOf(userId, pollId)];
}

/** Is this receipt in the public list of counted tickets? null = could not check. */
export async function checkReceipt(pollId: string, receipt: string): Promise<boolean | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('referendums_tickets')
    .select('serial_hash').eq('poll_id', pollId).eq('serial_hash', receipt).limit(1);
  return error ? null : (data ?? []).length > 0;
}

/** POST to an Edge Function with the citizen's session (`token`) — step 1,
 *  the ticket request. Step 2 does NOT go through here: deliver() sends the
 *  ballot with only the project's public key, so it carries no account.
 *  (supabase.functions.invoke() would attach the session automatically, which
 *  is exactly what must not happen to a ballot.) */
async function callFn(name: string, body: unknown, token?: string): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey ?? '',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      credentials: 'omit',
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  } catch {
    return { status: 0, body: {} };
  }
}

const castUrl = () => `${supabaseUrl}/functions/v1/ballot-cast`;
const castHeaders = () => ({ 'Content-Type': 'application/json', apikey: supabaseAnonKey ?? '' });

// ── The relay (v2.1): hiding the voter's network address from the server ─────
// With NEXT_PUBLIC_BALLOT_RELAY_URL set, ballots do not go to the server
// directly: they are sealed to the ballot box's public key and handed to a
// relay run by someone else (relay/). The relay sees where the ballot came
// from but not what it is; the server sees the ballot but only the relay's
// address — pairing a ballot with a ticket request then needs BOTH parties'
// logs. If the relay or the key is unreachable the ballot WAITS; it is never
// quietly sent the direct way.
const RELAY_URL = (process.env.NEXT_PUBLIC_BALLOT_RELAY_URL ?? '').trim().replace(/\/+$/, '');
export const relayConfigured = RELAY_URL !== '';
let boxKeyPromise: Promise<string> | null = null;
/** The ballot box's public key, straight from the server (not via the relay). */
function ballotBoxKey(): Promise<string> {
  boxKeyPromise ??= fetch(castUrl(), { headers: { apikey: supabaseAnonKey ?? '' }, credentials: 'omit' })
    .then((r) => r.json())
    .then((j: { key?: string | null }) => {
      if (!j.key) throw new Error('the server has no ballot box key');
      return j.key;
    })
    .catch((e) => { boxKeyPromise = null; throw e; });
  return boxKeyPromise;
}
/** Where a prepared ballot goes, and with what headers. */
const outbound = () => relayConfigured
  ? { url: RELAY_URL, headers: { 'Content-Type': 'application/json' } }
  : { url: castUrl(), headers: castHeaders() };

/** Build the request of step 2 once — sealing the choice if the referendum is
 *  encrypted — and pick when it is due. */
async function prepare(p: PendingBallot): Promise<PendingBallot> {
  const choice = p.encryptionKey
    ? { ciphertext: await sealBallot(p.pollId, p.option, p.encryptionKey) }
    : { option: p.option };
  const ballot = JSON.stringify({
    poll_id: p.pollId, ...choice, resident: p.resident, serial: p.ticket.serial, signature: p.signature,
  });
  // Through a relay the request is one more layer: the ballot, sealed to the box.
  const body = relayConfigured ? JSON.stringify({ sealed: await sealEnvelope(await ballotBoxKey(), ballot) }) : ballot;
  const room = new Date(p.endsAt).getTime() - Date.now() - CLOSING_MARGIN_MS;
  const wait = DELAY_MAX_MS * (0.1 + 0.9 * Math.random());
  return { ...p, body, sendAt: Date.now() + Math.max(0, Math.min(wait, room)) };
}

/** Step 2: deliver the ballot with its ticket and NO account. */
async function deliver(k: string, p: PendingBallot): Promise<BallotOutcome> {
  if (!p.signature) return 'pending';
  if (!p.body) {
    try { p = await prepare(p); setPending(k, p); }
    catch { return 'pending'; } // could not seal on this device right now — keep the ticket
  }
  let status = 0;
  let code: string | undefined;
  try {
    // No Authorization header, no cookies: only the project's public key (or,
    // through a relay, nothing at all).
    const to = outbound();
    const res = await fetch(to.url, { method: 'POST', headers: to.headers, body: p.body, credentials: 'omit' });
    status = res.status;
    code = ((await res.json().catch(() => ({}))) as { error?: string }).error;
  } catch {
    status = 0;
  }
  // 23505 = this very ticket was already counted (an earlier reply was lost,
  // or the ballot went out as the app was being left).
  if (status === 200 || code === '23505') {
    const receipts = storageGet<Store<string>>(KEYS.ballotReceipts, {});
    receipts[k] = await receiptOf(p.pollId, p.ticket.serial);
    storageSet(KEYS.ballotReceipts, receipts);
    // Remember the choice on this device only. (Once a ticket is signed its
    // option can no longer change, so a retry carries the same one.)
    storageSet(KEYS.myVotes, { ...storageGet<Store<string>>(KEYS.myVotes, {}), [k]: p.optionId });
    setPending(k, null);
    return 'ok';
  }
  if (code === 'LF001' || code === 'LF002' || code === 'LF004' || code === 'LF007') {
    setPending(k, null); // the referendum closed before the ballot arrived
    return 'closed';
  }
  setPending(k, { ...p, sendAt: 0 }); // offline / server hiccup — due again at once
  return 'pending';
}

/** Deliver now if the ballot is due (or `force`), otherwise leave it scheduled. */
function deliverWhenDue(k: string, p: PendingBallot, force = false): Promise<BallotOutcome> | BallotOutcome {
  return force || !p.sendAt || Date.now() >= p.sendAt ? deliver(k, p) : 'scheduled';
}

/** The app is being left (tab hidden, phone locked, page closed): send every
 *  ballot that is still waiting, RIGHT NOW, as a request the browser finishes
 *  on its own. The reply is not awaited — the next visit asks again and the
 *  server answers "already counted", which is how the receipt gets confirmed. */
export function flushPendingBallots(): void {
  const all = storageGet<Store<PendingBallot>>(KEYS.pendingBallots, {});
  let changed = false;
  for (const [k, p] of Object.entries(all)) {
    if (!p.signature || !p.body || !p.sendAt || Date.now() >= p.sendAt) continue;
    try {
      const to = outbound();
      void fetch(to.url, { method: 'POST', headers: to.headers, body: p.body, credentials: 'omit', keepalive: true })
        .catch(() => {});
    } catch { /* the next visit retries */ }
    all[k] = { ...p, sendAt: 0 };
    changed = true;
  }
  if (changed) storageSet(KEYS.pendingBallots, all);
}

let flushInstalled = false;
/** Hook flushPendingBallots() to the moments an app is left. Safe to call often. */
export function installBallotFlush(): void {
  if (flushInstalled || typeof window === 'undefined') return;
  flushInstalled = true;
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushPendingBallots(); });
  window.addEventListener('pagehide', flushPendingBallots);
}

/** Cast an anonymous ballot (or continue one that was interrupted). */
export async function castAnonymousBallot(poll: Poll, optionIndex: number): Promise<BallotOutcome> {
  const sb = getSupabase();
  const user = await getVerifiedUser();
  const keys = poll.ticketKeys;
  const option = poll.options[optionIndex];
  const encryptionKey = poll.protections?.encrypted ? poll.encryptionKey : undefined;
  if (!sb || !user || !keys || !option) return 'failed';
  if (poll.protections?.encrypted && !encryptionKey) return 'failed'; // never fall back to an unsealed ballot
  const k = keyOf(user.id, poll.id);

  let p: PendingBallot | undefined = getPending(k);
  if (p?.signature) return deliverWhenDue(k, p); // only step 2 was left

  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return 'failed';

  let resident = p?.resident ?? (await fetchOwnCitizenStatus())?.resident ?? false;
  for (let attempt = 0; attempt < 2; attempt++) {
    // Reuse a saved ticket (the server re-signs the SAME blinded ticket, so a
    // lost reply costs nothing); otherwise make a fresh one and save it first.
    if (!p || p.resident !== resident) {
      p = { pollId: poll.id, optionId: option.id, option: optionIndex, resident,
            ticket: await newTicket(poll.id, resident, keys), endsAt: poll.endDate, encryptionKey };
    } else {
      p = { ...p, optionId: option.id, option: optionIndex };
    }
    setPending(k, p);

    const r = await callFn('ballot-ticket',
      { action: 'sign', poll_id: poll.id, resident, blinded: p.ticket.blinded }, token);
    const code = r.body.error as string | undefined;
    if (r.status === 200 && typeof r.body.signature === 'string') {
      try {
        p = { ...p, signature: await finishTicket(poll.id, resident, keys, p.ticket, r.body.signature) };
      } catch {
        return 'failed';
      }
      setPending(k, p); // the signed ticket is safe on the device from here on
      try { p = await prepare(p); setPending(k, p); }
      catch { return 'pending'; }
      return deliverWhenDue(k, p);
    }
    if (code === 'LF005' && typeof r.body.resident === 'boolean' && attempt === 0) {
      resident = r.body.resident; // the registry says otherwise — nothing was recorded, redo with the right key
      p = undefined;
      continue;
    }
    if (code === '23505') { setPending(k, null); return 'already'; } // the account's ticket went to another device
    if (code === 'LF001' || code === 'LF004') { setPending(k, null); return 'closed'; }
    if (code === 'LF008') { setPending(k, null); return 'taxis'; } // TAXISnet-verified voters only
    if (code === 'LF009') { setPending(k, null); return 'consent'; } // the privacy notice was not accepted
    return 'failed'; // the saved ticket is retried on the next attempt
  }
  return 'failed';
}

/** Finish a ballot this device still owes (ticket signed, ballot not
 *  delivered): sends it if it is due — or at once with `force` («send now»). */
export async function resumePendingBallot(poll: Poll, force = false): Promise<BallotOutcome | null> {
  const user = await getVerifiedUser();
  if (!user) return null;
  const k = keyOf(user.id, poll.id);
  const p = getPending(k);
  if (!p?.signature) return null;
  return deliverWhenDue(k, p, force);
}
