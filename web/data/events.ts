import type { BilingualText } from './news';
import raw from './events.json';
import { mapEventRows, type ContentRow } from '@/lib/rows';

export type EventCategory =
  | 'Festival'
  | 'Music'
  | 'Theatre'
  | 'Sports'
  | 'Religious'
  | 'Food'
  | 'Art';

export interface CultureEvent {
  id: string;
  title: BilingualText;
  /** Start date, ISO yyyy-mm-dd. */
  date: string;
  /** Optional multi-day end date, ISO yyyy-mm-dd. */
  endDate?: string;
  /** Human time, e.g. "21:00". */
  time?: string;
  location: BilingualText;
  description: BilingualText;
  category: EventCategory;
  /** Official programme PDF, if one exists. */
  pdfUrl?: string;
  /** [lat, lng] for the shared Lefkada map. Omit for island-wide events. */
  coords?: [number, number];
}

/** Banner image per category (relevant visual for each event). */
export const EVENT_IMAGES: Record<EventCategory, string> = {
  Festival: '/events/festival.png',
  Music: '/events/music.png',
  Theatre: '/events/theatre.png',
  Sports: '/events/sports.png',
  Religious: '/events/religious.png',
  Food: '/events/food.png',
  Art: '/events/art.png',
};

export const EVENT_CATEGORIES_ORDER: EventCategory[] = [
  'Festival', 'Music', 'Theatre', 'Sports', 'Religious', 'Food', 'Art',
];

export const EVENT_ACCENT: Record<EventCategory, string> = {
  Festival: '#D64836',
  Music: '#6D44C8',
  Theatre: '#A61E34',
  Sports: '#1C96A0',
  Religious: '#C4963C',
  Food: '#E4802C',
  Art: '#BE3478',
};

// events.json = { bundled: [...], baked: [content rows, kind=event] } — the
// baked /admin events (synced weekly) merge ahead of the bundled programme.
export const eventsData: CultureEvent[] = [
  ...mapEventRows(raw.baked as ContentRow[]),
  ...(raw.bundled as unknown as CultureEvent[]),
];
