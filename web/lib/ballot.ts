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
 */

import type { Poll } from '@/data/voting';
import { getSupabase, supabaseUrl, supabaseAnonKey } from './supabase';
import { KEYS, storageGet, storageSet } from './storage';
import { newTicket, finishTicket, receiptOf, type BlindedTicket } from './ballotCrypto';
import { fetchOwnCitizenStatus, getVerifiedUser, type VoteOutcome } from './backend';

/** 'pending' — the ticket is held but the ballot has not been delivered yet;
 *  it will be retried (nothing is lost, nothing more to do for the citizen). */
export type BallotOutcome = VoteOutcome | 'pending';

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
}

type Store<T> = Record<string, T>;
const keyOf = (userId: string, pollId: string) => `${userId}:${pollId}`;

const getPending = (k: string) => storageGet<Store<PendingBallot>>(KEYS.pendingBallots, {})[k];
function setPending(k: string, p: PendingBallot | null) {
  const all = storageGet<Store<PendingBallot>>(KEYS.pendingBallots, {});
  if (p) all[k] = p; else delete all[k];
  storageSet(KEYS.pendingBallots, all);
}

/** True while this account has a ticket on this device whose ballot is not delivered. */
export function hasPendingBallot(userId: string, pollId: string): boolean {
  return !!getPending(keyOf(userId, pollId));
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

/** POST to an Edge Function. `token` = the citizen's session for step 1;
 *  step 2 passes NONE on purpose — only the project's public key — so the
 *  ballot carries no account. (supabase.functions.invoke() would attach the
 *  session automatically, which is exactly what must not happen here.) */
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Step 2: deliver the ballot with its ticket and no account. */
async function deliver(k: string, p: PendingBallot): Promise<BallotOutcome> {
  if (!p.signature) return 'pending';
  // A short random wait, so the ballot does not arrive right behind the ticket
  // request — skipped when the poll is about to close.
  const left = new Date(p.endsAt).getTime() - Date.now();
  if (left > 90_000) await sleep(2000 + Math.random() * 8000);
  const r = await callFn('ballot-cast', {
    poll_id: p.pollId, option: p.option, resident: p.resident, serial: p.ticket.serial, signature: p.signature,
  });
  const code = r.body.error as string | undefined;
  // 23505 = this very ticket was already counted (the earlier reply was lost).
  if (r.status === 200 || code === '23505') {
    const receipts = storageGet<Store<string>>(KEYS.ballotReceipts, {});
    receipts[k] = await receiptOf(p.pollId, p.ticket.serial);
    storageSet(KEYS.ballotReceipts, receipts);
    // Remember the choice on this device only. (Once a ticket is signed its
    // option can no longer change, so a lost-reply retry carries the same one.)
    storageSet(KEYS.myVotes, { ...storageGet<Store<string>>(KEYS.myVotes, {}), [k]: p.optionId });
    setPending(k, null);
    return 'ok';
  }
  if (code === 'LF001' || code === 'LF002' || code === 'LF004') {
    setPending(k, null); // the referendum closed before the ballot arrived
    return 'closed';
  }
  return 'pending'; // offline / server hiccup — the ticket stays for the next try
}

/** Cast an anonymous ballot (or continue one that was interrupted). */
export async function castAnonymousBallot(poll: Poll, optionIndex: number): Promise<BallotOutcome> {
  const sb = getSupabase();
  const user = await getVerifiedUser();
  const keys = poll.ticketKeys;
  const option = poll.options[optionIndex];
  if (!sb || !user || !keys || !option) return 'failed';
  const k = keyOf(user.id, poll.id);

  let p: PendingBallot | undefined = getPending(k);
  if (p?.signature) return deliver(k, p); // only step 2 was left

  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return 'failed';

  let resident = p?.resident ?? (await fetchOwnCitizenStatus())?.resident ?? false;
  for (let attempt = 0; attempt < 2; attempt++) {
    // Reuse a saved ticket (the server re-signs the SAME blinded ticket, so a
    // lost reply costs nothing); otherwise make a fresh one and save it first.
    if (!p || p.resident !== resident) {
      p = { pollId: poll.id, optionId: option.id, option: optionIndex, resident,
            ticket: await newTicket(poll.id, resident, keys), endsAt: poll.endDate };
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
      setPending(k, p);
      return deliver(k, p);
    }
    if (code === 'LF005' && typeof r.body.resident === 'boolean' && attempt === 0) {
      resident = r.body.resident; // the registry says otherwise — nothing was recorded, redo with the right key
      p = undefined;
      continue;
    }
    if (code === '23505') { setPending(k, null); return 'already'; } // the account's ticket went to another device
    if (code === 'LF001' || code === 'LF004') { setPending(k, null); return 'closed'; }
    return 'failed'; // the saved ticket is retried on the next attempt
  }
  return 'failed';
}

/** Finish a ballot this device still owes (ticket signed, ballot not delivered). */
export async function resumePendingBallot(poll: Poll): Promise<BallotOutcome | null> {
  const user = await getVerifiedUser();
  if (!user) return null;
  const k = keyOf(user.id, poll.id);
  const p = getPending(k);
  if (!p?.signature) return null;
  return deliver(k, p);
}
