import type { BilingualText } from './news';
import raw from './voting.json';
import { mapReferendumRows, type ReferendumRow } from '@/lib/rows';

export interface PollOption {
  id: string;
  text: BilingualText;
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
}

// voting.json = { bundled: [...], baked: [raw referendum rows] } — referendums
// created in /admin (synced weekly) map onto the Poll shape and come first;
// finished ones surface in Governance ▸ Consultations as history.
export const pollsData: Poll[] = [
  ...mapReferendumRows(raw.baked as unknown as ReferendumRow[]),
  ...(raw.bundled as unknown as Poll[]),
];
