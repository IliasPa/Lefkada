/**
 * Anonymous ballots (v1.8) — the phone's half of the blind-signature ticket.
 *
 * RSA Blind Signatures, RFC 9474 (RSABSSA-SHA384-PSS-Deterministic), via
 * Cloudflare's open-source implementation — nothing cryptographic is
 * hand-rolled. Pure functions with no app imports. The protocol constants
 * mirror supabase/functions/_shared/ballot.ts.
 *
 *   1. newTicket()    — invent a random serial and BLIND it. Only the blinded
 *                       form goes to the server, together with the account.
 *   2. finishTicket() — unblind the server's signature. The result is a valid
 *                       signature over the serial that the server has never
 *                       seen and cannot connect to the request in step 1.
 *   3. The ballot is then sent with serial + signature and NO account.
 */

import { RSABSSA } from '@cloudflare/blindrsa-ts';

const suite = RSABSSA.SHA384.PSS.Deterministic();
const RSA = { name: 'RSA-PSS', hash: 'SHA-384' } as const;
const enc = new TextEncoder();

export const toB64 = (b: Uint8Array) => btoa(Array.from(b, (x) => String.fromCharCode(x)).join(''));
export const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const ticketMessage = (pollId: string, resident: boolean, serial: string) =>
  enc.encode(`lefkada-ballot-v1|${pollId}|${resident ? 'R' : 'O'}|${serial}`);

const importKey = (spkiB64: string) =>
  crypto.subtle.importKey('spki', fromB64(spkiB64) as BufferSource, RSA, true, ['verify']);

/** A referendum's two public ticket keys (SPKI, base64). */
export interface TicketKeys { resident: string; other: string }

export interface BlindedTicket {
  /** 32 random bytes, base64 — never leaves the device before the ballot. */
  serial: string;
  /** What the server signs (base64). Reveals nothing about `serial`. */
  blinded: string;
  /** The unblinding factor (base64) — stays on the device. */
  inv: string;
}

export async function newTicket(pollId: string, resident: boolean, keys: TicketKeys): Promise<BlindedTicket> {
  const serial = toB64(crypto.getRandomValues(new Uint8Array(32)));
  const pub = await importKey(resident ? keys.resident : keys.other);
  const { blindedMsg, inv } = await suite.blind(pub, ticketMessage(pollId, resident, serial));
  return { serial, blinded: toB64(blindedMsg), inv: toB64(inv) };
}

/** Unblind the server's answer into the ticket's signature (base64). Throws
 *  if the result does not verify — a wrong or tampered signature is never
 *  kept. */
export async function finishTicket(
  pollId: string, resident: boolean, keys: TicketKeys, ticket: BlindedTicket, blindSignature: string,
): Promise<string> {
  const pub = await importKey(resident ? keys.resident : keys.other);
  const msg = ticketMessage(pollId, resident, ticket.serial);
  const sig = await suite.finalize(pub, msg, fromB64(blindSignature), fromB64(ticket.inv));
  if (!(await suite.verify(pub, sig, msg))) throw new Error('ticket signature does not verify');
  return toB64(sig);
}

/** The receipt code of a ballot: what the server stores for a used ticket
 *  (public list `referendums_tickets`). 64 hex characters. */
export async function receiptOf(pollId: string, serial: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(`lefkada-serial-v1|${pollId}|${serial}`));
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, '0')).join('');
}
