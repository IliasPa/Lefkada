import type { BilingualText } from './news';
import raw from './education.json';
import { mapLessonRows, mapCompetitionRows, type ContentRow, type LiveCompetition } from '@/lib/rows';

export type LessonCategory = 'sports' | 'music' | 'school' | 'robotics';

export interface Lesson {
  id: string;
  category: LessonCategory;
  title: BilingualText;
  desc: BilingualText;
  /** When & where it runs. */
  when?: BilingualText;
  ages?: string;
}

export interface RoboticsCompetition {
  id: string;
  title: BilingualText;
  date: string;          // ISO yyyy-mm-dd (or yyyy for season)
  location?: BilingualText;
  url?: string;
  past?: boolean;
}

export const LESSON_CATEGORIES: { key: LessonCategory; label: BilingualText; accent: string }[] = [
  { key: 'robotics', label: { el: 'Ρομποτική', en: 'Robotics' }, accent: '#7C3AED' },
  { key: 'sports', label: { el: 'Αθλητισμός', en: 'Sports' }, accent: '#16A34A' },
  { key: 'music', label: { el: 'Μουσική', en: 'Music' }, accent: '#E4802C' },
  { key: 'school', label: { el: 'Σχολική βοήθεια', en: 'School help' }, accent: '#0D5EAF' },
];

// education.json = { bundled: {lessons, roboticsCompetitions},
//                    baked: [content rows, kind=lesson|competition] }.
// The baked rows keep their `kind`, so each mapper filters its own.
const baked = raw.baked as ContentRow[];

export const lessonsData: Lesson[] = [
  ...mapLessonRows(baked),
  ...(raw.bundled.lessons as unknown as Lesson[]),
];

export const roboticsCompetitions: RoboticsCompetition[] =
  raw.bundled.roboticsCompetitions as unknown as RoboticsCompetition[];

/** Competitions synced from /admin ▸ Παιδεία (all lesson categories). */
export const bakedCompetitions: LiveCompetition[] = mapCompetitionRows(baked);
