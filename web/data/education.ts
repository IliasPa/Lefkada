import type { BilingualText } from './news';

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

export const lessonsData: Lesson[] = [
  {
    id: 'robotics-spike',
    category: 'robotics',
    title: { el: 'Εκπαιδευτική Ρομποτική — LEGO SPIKE Prime', en: 'Educational Robotics — LEGO SPIKE Prime' },
    desc: {
      el: 'Μαθήματα ρομποτικής & προγραμματισμού με LEGO® Education SPIKE™ Prime: κατασκευή, αισθητήρες, κινητήρες και block-based προγραμματισμός, με προετοιμασία για διαγωνισμούς.',
      en: 'Robotics & coding classes with LEGO® Education SPIKE™ Prime: building, sensors, motors and block-based programming, with preparation for competitions.',
    },
    when: { el: 'Δηλώσεις συμμετοχής — νέο τμήμα', en: 'Registrations open — new group' },
    ages: '9–15',
  },
  {
    id: 'music-school',
    category: 'music',
    title: { el: 'Δημοτικό Ωδείο — μουσικά όργανα', en: 'Municipal Conservatory — instruments' },
    desc: { el: 'Μαθήματα μουσικής και οργάνων για παιδιά και ενήλικες.', en: 'Music and instrument lessons for children and adults.' },
  },
  {
    id: 'sports-academies',
    category: 'sports',
    title: { el: 'Αθλητικές ακαδημίες', en: 'Sports academies' },
    desc: { el: 'Δημοτικές αθλητικές δραστηριότητες (κολύμβηση, στίβος, ομαδικά αθλήματα).', en: 'Municipal sports activities (swimming, athletics, team sports).' },
  },
  {
    id: 'school-support',
    category: 'school',
    title: { el: 'Ενισχυτική διδασκαλία', en: 'Tutoring & study help' },
    desc: { el: 'Υποστήριξη μαθητών μέσω του Κέντρου Κοινότητας του Δήμου.', en: 'Pupil support through the municipality’s Community Centre.' },
  },
];

/** Robotics competitions the SPIKE Prime programme targets. */
export const roboticsCompetitions: RoboticsCompetition[] = [
  { id: 'wro-2026', title: { el: 'World Robot Olympiad (WRO) — Ελλάδα', en: 'World Robot Olympiad (WRO) — Greece' }, date: '2026', url: 'https://wro.gr/' },
  { id: 'fll-2026', title: { el: 'FIRST LEGO League', en: 'FIRST LEGO League' }, date: '2026', url: 'https://www.firstlegoleague.org/' },
  { id: 'panekfe-2026', title: { el: 'Πανελλήνιος Διαγωνισμός Εκπαιδευτικής Ρομποτικής', en: 'Panhellenic Educational Robotics Competition' }, date: '2026' },
  // Past seasons (revealed via "see older").
  { id: 'wro-2025', title: { el: 'World Robot Olympiad (WRO) 2025', en: 'World Robot Olympiad (WRO) 2025' }, date: '2025', url: 'https://wro.gr/', past: true },
  { id: 'fll-2025', title: { el: 'FIRST LEGO League 2025', en: 'FIRST LEGO League 2025' }, date: '2025', url: 'https://www.firstlegoleague.org/', past: true },
];
