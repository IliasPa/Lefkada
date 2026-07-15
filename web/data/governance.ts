import type { BilingualText } from './news';
import raw from './governance.json';
import { mapGovRows, type ContentRow } from '@/lib/rows';

export type GovType = 'Bylaw' | 'Decision' | 'Tender' | 'Announcement' | 'Meeting' | 'Consultation';

/** Collective body a meeting/invitation belongs to. */
export type GovBody =
  | 'council'      // Δημοτικό Συμβούλιο
  | 'executive'    // Εκτελεστική Επιτροπή
  | 'finance'      // Οικονομική Επιτροπή
  | 'qol'          // Επιτροπή Ποιότητας Ζωής
  | 'municipal'    // Δημοτική Επιτροπή
  | 'consultation' // Δημοτική Επιτροπή Διαβούλευσης
  | 'tourism';     // Επιτροπή Τουριστικής Ανάπτυξης & Προβολής

export interface GovBodyMeta { key: GovBody; tag: BilingualText; name: BilingualText; }

export const GOV_BODIES: GovBodyMeta[] = [
  { key: 'council', tag: { el: 'Δ.Σ.', en: 'Council' }, name: { el: 'Δημοτικό Συμβούλιο', en: 'Municipal Council' } },
  { key: 'municipal', tag: { el: 'Δ.Ε.', en: 'Munic.' }, name: { el: 'Δημοτική Επιτροπή', en: 'Municipal Committee' } },
  { key: 'executive', tag: { el: 'Ε.Ε.', en: 'Exec.' }, name: { el: 'Εκτελεστική Επιτροπή', en: 'Executive Committee' } },
  { key: 'finance', tag: { el: 'Ο.Ε.', en: 'Finance' }, name: { el: 'Οικονομική Επιτροπή', en: 'Finance Committee' } },
  { key: 'qol', tag: { el: 'Ε.Π.Ζ.', en: 'QoL' }, name: { el: 'Επιτροπή Ποιότητας Ζωής', en: 'Quality-of-Life Committee' } },
  { key: 'consultation', tag: { el: 'Δ.Ε.Δ.', en: 'Consult.' }, name: { el: 'Δημοτική Επιτροπή Διαβούλευσης', en: 'Consultation Committee' } },
  { key: 'tourism', tag: { el: 'Ε.Τ.Α.Π.', en: 'Tourism' }, name: { el: 'Επιτροπή Τουριστικής Ανάπτυξης & Προβολής', en: 'Tourism Development & Promotion Committee' } },
];

export const GOV_BODY_ACCENT: Record<GovBody, string> = {
  council: '#16A34A', municipal: '#0D5EAF', executive: '#6D44C8',
  finance: '#E4802C', qol: '#0EA5E9', consultation: '#A61E34', tourism: '#C4963C',
};

/** Source tag for announcements (the Announcements sub-filter mirrors the Meetings one). */
export type AnnTag = 'council' | 'social' | 'depokal' | 'nsrf';
export interface AnnTagMeta { key: AnnTag; tag: BilingualText; name: BilingualText; }
export const GOV_ANN_TAGS: AnnTagMeta[] = [
  { key: 'council', tag: { el: 'Δήμος', en: 'Municipality' }, name: { el: 'Δημοτικές ανακοινώσεις', en: 'Municipal announcements' } },
  { key: 'social', tag: { el: 'Κοιν. Παντοπωλείο', en: 'Social Grocery' }, name: { el: 'Κοινωνικό Παντοπωλείο', en: 'Social Grocery' } },
  { key: 'depokal', tag: { el: 'ΔΕΠΟΚΑΛ', en: 'DEPOKAL' }, name: { el: 'ΔΕΠΟΚΑΛ — Δημοτική Κοινωφελής Επιχείρηση', en: 'DEPOKAL — municipal public-benefit enterprise' } },
  { key: 'nsrf', tag: { el: 'ΕΣΠΑ', en: 'NSRF' }, name: { el: 'ΕΣΠΑ / Συγχρηματοδοτούμενα', en: 'NSRF / co-funded programmes' } },
];
export const GOV_ANN_ACCENT: Record<AnnTag, string> = {
  council: '#6D44C8', social: '#16A34A', depokal: '#E4802C', nsrf: '#0D5EAF',
};

export interface GovItem {
  id: string;
  type: GovType;
  body?: GovBody;       // meetings/decisions
  annTag?: AnnTag;      // announcements
  title: BilingualText;
  summary: BilingualText;
  date: string;
  pdfUrl?: string;
  deadline?: string;
  jobId?: string;
  time?: string;
  youtubeId?: string;
  agendaPdf?: string;
  minutesPdf?: string;
  /** Multiple named documents (used by the pre-2021 decision archive). */
  links?: { label: BilingualText; url: string }[];
}

export const GOV_ACCENT: Record<GovType, string> = {
  Bylaw: '#0D9488', Decision: '#0D5EAF', Tender: '#E4802C', Announcement: '#6D44C8', Meeting: '#16A34A', Consultation: '#A61E34',
};

export const GOV_TYPES: GovType[] = ['Bylaw', 'Decision', 'Tender', 'Announcement', 'Meeting', 'Consultation'];

// governance.json = { bundled: [meetings + announcements],
//                     baked: [content rows, kind=meeting] } — /admin meeting
// invitations (synced weekly) merge ahead of the harvested bundled feed.
export const governanceData: GovItem[] = [
  ...mapGovRows(raw.baked as ContentRow[], 'meeting'),
  ...(raw.bundled as unknown as GovItem[]),
];
