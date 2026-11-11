'use client';

/**
 * Encrypted ballots (v1.9) — reading the public ballot list and recounting it.
 * Used twice: by /admin before it publishes an uploaded count file, and by the
 * «verify the count» button every citizen has on a counted referendum.
 */

import { getSupabase } from './supabase';
import { openBallot } from './ballotSeal';

export interface BallotRow {
  id: string;
  ciphertext: string;
  opening: string | null;
  option_id: number | null;
}

/** Every ballot of a poll that this viewer may read (paged — the API returns
 *  at most 1000 rows at a time). null = the request failed. */
export async function fetchBallots(pollId: string): Promise<BallotRow[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const all: BallotRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('referendums_ballots')
      .select('id, ciphertext, opening, option_id')
      .eq('poll_id', pollId).order('id').range(from, from + 999);
    if (error) return null;
    all.push(...((data as BallotRow[]) ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return all;
}

export interface Recount {
  /** Ballots per option index, as decrypted HERE. */
  counts: number[];
  /** Ballots whose opening does not open them. */
  invalid: number;
  total: number;
  /** Ballots where the decrypted option differs from the one stated with the opening. */
  disagreements: number;
}

/** Decrypt every ballot with the opening given for it and count.
 *  `openings` maps ballot id → { k, o } (a count file); when omitted, the
 *  openings published in the rows themselves are used. */
export async function recount(
  pollId: string, rows: BallotRow[], optionCount: number,
  openings?: Record<string, { k: string; o: number | null }>,
): Promise<Recount> {
  const out: Recount = { counts: Array(optionCount).fill(0), invalid: 0, total: rows.length, disagreements: 0 };
  for (const row of rows) {
    const given = openings ? openings[row.id] : (row.opening ? { k: row.opening, o: row.option_id } : undefined);
    let o = given ? await openBallot(pollId, row.ciphertext, given.k) : null;
    if (o !== null && o >= optionCount) o = null;
    if (o !== (given?.o ?? null)) out.disagreements++;
    if (o === null) out.invalid++; else out.counts[o]++;
  }
  return out;
}
