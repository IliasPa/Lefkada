import type { BilingualText } from './news';
import raw from './voting.json';
import { mapReferendumRows, type ReferendumRow } from '@/lib/rows';

export interface PollOption {
  id: string;
  text: BilingualText;
}

/** The protections a referendum was created with (v1.7). Chosen per poll by
 *  the mayor and locked once it is published; the app shows citizens every
 *  protection a poll does NOT use (see lib/protections.ts). */
export interface PollProtections {
  /** Results unreadable by anyone — the mayor included — while the poll is open. */
  hideUntilClose: boolean;
  /** Results stay hidden below this many ballots (0 = no minimum). */
  minVotes: number;
  /** The ballot reaches the server without the voter's account (v1.8). */
  anonymous: boolean;
  /** The choice is encrypted on the phone; no tally exists until the key
   *  holder counts after closing (v1.9). */
  encrypted: boolean;
}

export interface Poll {
  id: string;
  title: BilingualText;
  options: PollOption[];
  explanations: { short: BilingualText; medium: BilingualText; full: BilingualText };
  seedVotes: Record<string, number>;
  /** ISO date string — when the poll closes. Drives the countdown / "ended" label. */
  endDate: string;
  /** YouTube video id shown between the poll info and the ballot. */
  youtubeId?: string;
  /** URL of the official PDF document for this poll. */
  pdfUrl?: string;
  /** Absent on the bundled demo polls — they use no protection at all. */
  protections?: PollProtections;
  /** The referendum's two public ticket keys (anonymous ballots only). */
  ticketKeys?: { resident: string; other: string };
  /** The referendum's public encryption key, SPKI base64 (encrypted ballots only). */
  encryptionKey?: string;
}

// voting.json = { bundled: [...], baked: [raw referendum rows] } — referendums
// created in /admin (synced weekly) map onto the Poll shape and come first;
// finished ones surface in Governance ▸ Consultations as history.
export const pollsData: Poll[] = [
  ...mapReferendumRows(raw.baked as unknown as ReferendumRow[]),
  ...(raw.bundled as unknown as Poll[]),
];
