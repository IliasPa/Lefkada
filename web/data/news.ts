import raw from './news.json';
import { mapNewsRows, type NewsRow } from '@/lib/rows';

export interface BilingualText {
  el: string;
  en: string;
}

export type NewsCategory = 'Infrastructure' | 'Tourism' | 'Events' | 'Council' | 'Environment' | 'Culture';

/** A news outlet / reporter that published the item. */
export interface Reporter {
  id: string;
  name: string;
  /** The reporter's website — opened by the reporter social button. */
  url: string;
}

export interface NewsItem {
  id: string;
  title: BilingualText;
  description: BilingualText;
  timestamp: BilingualText;
  accentColor: string;
  category: NewsCategory;
  /** Id of the reporter (see `reporters`) that published this item. */
  reporterId: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

// news.json = { bundled: {reporters, news}, baked: [raw Supabase news rows] }.
// The baked rows (synced into the file weekly by scripts/sync-data.mjs) pass
// through the same mapper as the live fetch, then sit ahead of the bundled
// items — the full archive ships in the build and works offline.
const baked = mapNewsRows(raw.baked as unknown as NewsRow[]);

export const reporters: Reporter[] = [
  ...(raw.bundled.reporters as Reporter[]),
  ...baked.reporters,
];

export const newsData: NewsItem[] = [
  ...baked.items,
  ...(raw.bundled.news as unknown as NewsItem[]),
];
