import type { BilingualText } from './news';
import raw from './ebooks.json';
import { mapEbookRows, type ContentRow } from '@/lib/rows';

export interface Ebook {
  /** Present on /admin-added books (the Supabase row id); the harvested bundled
   *  registers have none — dedupe against live entries uses the pdf URL. */
  id?: string;
  title: BilingualText;
  author: string;
  desc: BilingualText;
  pdf: string;
  cover: string;
  date: string;
}

/* Digitised historical registers from the General State Archives (Lefkada),
 * harvested from the /books/ e-library (v0.9 harvest), in ebooks.json.bundled.
 * ebooks.json.baked holds the /admin-added books (kind=ebook, synced weekly),
 * merged ahead. */
export const ebooksData: Ebook[] = [
  ...mapEbookRows(raw.baked as ContentRow[]),
  ...(raw.bundled as unknown as Ebook[]),
];
