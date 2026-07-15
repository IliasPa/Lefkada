import type { BilingualText } from './news';
import raw from './contacts.json';
import { mapContactRows, type ContentRow } from '@/lib/rows';

export type ContactCategory =
  | 'Administration'
  | 'Services'
  | 'Emergency'
  | 'Utilities'
  | 'Tourism'
  | 'Health';

export interface Contact {
  id: string;
  name: BilingualText;
  phone?: string;
  /** Additional phone numbers (rendered as extra call buttons). */
  phones?: string[];
  email?: string;
  /** Opening hours. When omitted, the contact keeps the STANDARD office hours
   *  (marked with a ★ in the UI to avoid repeating the same line everywhere). */
  hours?: BilingualText;
  category: ContactCategory;
}

/** The default municipal office hours shared by most departments. */
export const STANDARD_HOURS: BilingualText = {
  el: 'Δευτ–Παρ 08:00–14:00',
  en: 'Mon–Fri 08:00–14:00',
};

// contacts.json = { bundled: [...], baked: [content rows, kind=contact] } —
// /admin-added contacts (synced weekly) come ahead of the curated directory.
export const contactsData: Contact[] = [
  ...mapContactRows(raw.baked as ContentRow[]),
  ...(raw.bundled as unknown as Contact[]),
];
