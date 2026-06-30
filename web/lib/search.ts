'use client';

/**
 * Universal app search. Assembles one flat, accent-insensitive index across the
 * bundled data sources, each entry carrying an in-app route ({tab} + optional
 * deep-link intent) so a hit can jump straight to where it lives. The big
 * decisions corpus (3,975 rows in /public/decisions.json) is lazy-loaded on
 * first search-open and merged in — it never touches the initial bundle.
 */

import { translations } from '@/lib/i18n';
import type { BilingualText } from '@/data/news';
import type { TabKey } from '@/context/AppContext';

import { newsData } from '@/data/news';
import { govEServices, ePayments, infoServices } from '@/data/services';
import { tendersData, bylawsData, consultationsData, decisionArchive } from '@/data/governanceActs';
import { governanceData } from '@/data/governance';
import { placesData, CULTURAL_PLACE_CATEGORIES } from '@/data/places';
import { contactsData } from '@/data/contacts';
import { jobsData } from '@/data/jobs';
import { lessonsData } from '@/data/education';
import { ebooksData } from '@/data/ebooks';

export type SearchCat =
  | 'nav'
  | 'news'
  | 'services'
  | 'governance'
  | 'decisions'
  | 'culture'
  | 'contacts'
  | 'jobs'
  | 'education'
  | 'ebooks';

/** Where a result takes the user — always inside the app. */
export interface SearchRoute {
  tab: TabKey;
  govIntent?: { type?: string; annTag?: string };
  cultureIntent?: string;
}

export interface SearchEntry {
  id: string;
  cat: SearchCat;
  title: BilingualText;
  sub?: BilingualText;
  route: SearchRoute;
  /** Pre-normalised el+en haystack used for matching. */
  hay: string;
}

/** Order categories appear in the results list. */
export const CAT_ORDER: SearchCat[] = [
  'nav',
  'news',
  'governance',
  'decisions',
  'services',
  'culture',
  'contacts',
  'jobs',
  'education',
  'ebooks',
];

/** lowercase + strip diacritics + fold final sigma, so "λευκαδα" finds "Λευκάδα". */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ς/g, 'σ') // ς → σ
    .replace(/\s+/g, ' ')
    .trim();
}

function entry(
  id: string,
  cat: SearchCat,
  title: BilingualText,
  route: SearchRoute,
  sub?: BilingualText,
): SearchEntry {
  const hay = norm(
    `${title.el} ${title.en}${sub ? ` ${sub.el} ${sub.en}` : ''}`,
  );
  return { id, cat, title, sub, route, hay };
}

function bi(el: string, en: string): BilingualText {
  return { el, en };
}

// ── Navigation: the tabs + a few high-value section shortcuts ────────────────
const NAV_TABS: TabKey[] = [
  'home', 'culture', 'health', 'financials', 'governance',
  'about', 'services', 'education', 'jobs', 'contacts', 'account',
];

function navTitle(k: TabKey): BilingualText {
  return bi(translations.el[`tab_${k}`] ?? k, translations.en[`tab_${k}`] ?? k);
}

let _base: SearchEntry[] | null = null;

/** The synchronous, in-bundle index (everything except the lazy decisions). */
export function baseIndex(): SearchEntry[] {
  if (_base) return _base;
  const out: SearchEntry[] = [];

  // Navigation
  for (const k of NAV_TABS) out.push(entry(`nav-${k}`, 'nav', navTitle(k), { tab: k }));
  out.push(entry('nav-decisions', 'nav', bi('Αποφάσεις', 'Decisions'), { tab: 'governance', govIntent: { type: 'Decision' } }));
  out.push(entry('nav-tenders', 'nav', bi('Διαγωνισμοί', 'Tenders'), { tab: 'governance', govIntent: { type: 'Tender' } }));
  out.push(entry('nav-bylaws', 'nav', bi('Κανονισμοί', 'Bylaws'), { tab: 'governance', govIntent: { type: 'Bylaw' } }));
  out.push(entry('nav-consult', 'nav', bi('Διαβουλεύσεις / Δημοψηφίσματα', 'Consultations / Referendums'), { tab: 'governance', govIntent: { type: 'Consultation' } }));
  out.push(entry('nav-meetings', 'nav', bi('Συνεδριάσεις', 'Council meetings'), { tab: 'governance', govIntent: { type: 'Meeting' } }));
  out.push(entry('nav-veto', 'nav', bi('Βέτο / Διαμαρτυρία', 'Veto / Protest'), { tab: 'account' }));
  out.push(entry('nav-mayor', 'nav', bi('Μήνυμα στον Δήμαρχο', 'Message the Mayor'), { tab: 'account' }));

  // News
  for (const n of newsData) out.push(entry(`news-${n.id}`, 'news', n.title, { tab: 'home' }, n.description));

  // Services (e-services + payments + info)
  for (const s of govEServices) out.push(entry(`es-${s.id}`, 'services', s.title, { tab: 'services' }));
  for (const p of ePayments) out.push(entry(`ep-${p.id}`, 'services', p.title, { tab: 'services' }, p.description));
  for (const i of infoServices) out.push(entry(`is-${i.id}`, 'services', i.title, { tab: 'services' }, i.description));

  // Governance acts (tenders, bylaws, consultations, archive, live feed)
  const govSets = [tendersData, bylawsData, consultationsData, decisionArchive, governanceData];
  for (const set of govSets) {
    for (const g of set) {
      out.push(entry(`gov-${g.id}`, 'governance', g.title, { tab: 'governance', govIntent: { type: g.type } }, g.summary));
    }
  }

  // Culture places — cultural venues deep-link to their Spaces category
  for (const pl of placesData) {
    const cultural = (CULTURAL_PLACE_CATEGORIES as string[]).includes(pl.category);
    out.push(entry(`place-${pl.id}`, 'culture', pl.name, cultural ? { tab: 'culture', cultureIntent: pl.category } : { tab: 'culture' }, pl.description));
  }

  // Contacts
  for (const c of contactsData) out.push(entry(`contact-${c.id}`, 'contacts', c.name, { tab: 'contacts' }));

  // Jobs
  for (const j of jobsData) out.push(entry(`job-${j.id}`, 'jobs', j.title, { tab: 'jobs' }, j.company));

  // Education lessons
  for (const l of lessonsData) out.push(entry(`lesson-${l.id}`, 'education', l.title, { tab: 'education' }, l.desc));

  // e-Books (live in Education ▸ e-Books)
  ebooksData.forEach((b, i) => out.push(entry(`ebook-${i}`, 'ebooks', b.title, { tab: 'education' }, bi(b.author, b.author))));

  _base = out;
  return out;
}

// ── Lazy decisions corpus ────────────────────────────────────────────────────
interface RawDecision { t: string; n: string; d: string; b: string; f: string }
let _decisions: SearchEntry[] | null = null;
let _decisionsPromise: Promise<SearchEntry[]> | null = null;

/** Fetch + index /decisions.json once. Resolves to [] if unavailable. */
export function loadDecisions(): Promise<SearchEntry[]> {
  if (_decisions) return Promise.resolve(_decisions);
  if (_decisionsPromise) return _decisionsPromise;
  _decisionsPromise = fetch('/decisions.json')
    .then((r) => (r.ok ? r.json() : []))
    .then((rows: RawDecision[]) => {
      _decisions = rows.map((r) =>
        entry(`dec-${r.n}`, 'decisions', bi(r.t, r.t), { tab: 'governance', govIntent: { type: 'Decision' } }, bi(r.n, r.n)),
      );
      return _decisions;
    })
    .catch(() => {
      _decisions = [];
      return _decisions;
    });
  return _decisionsPromise;
}

/** Rank entries against a query: every term must appear; word-start hits score higher. */
export function runSearch(entries: SearchEntry[], query: string, limit = 60): SearchEntry[] {
  const terms = norm(query).split(' ').filter(Boolean);
  if (!terms.length) return [];
  const scored: { e: SearchEntry; score: number }[] = [];
  for (const e of entries) {
    let ok = true;
    let score = 0;
    for (const term of terms) {
      const idx = e.hay.indexOf(term);
      if (idx === -1) { ok = false; break; }
      score += idx === 0 ? 4 : e.hay[idx - 1] === ' ' ? 2 : 1;
    }
    if (ok) {
      // Nudge short, navigational entries above the long-document noise.
      if (e.cat === 'nav') score += 6;
      scored.push({ e, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.e);
}
