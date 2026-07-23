/**
 * Pure Supabase-row → app-shape mappers, shared by the runtime data layer
 * (lib/backend.ts) and the baked-data wrappers in data/*.ts.
 *
 * "Baked" rows are raw Supabase rows written into the data/*.json files by the
 * weekly sync (scripts/sync-data.mjs) — git is the permanent home of published
 * content, Supabase only buffers the recent weeks. Because baked and live rows
 * pass through the SAME mappers, a baked item and its live twin come out
 * identical, which is what makes id-based dedupe (mergeById) safe.
 *
 * Everything here is dependency-free — importing it never pulls supabase-js
 * into the data chunks.
 */

import type { CityAlert } from '@/data/alerts';
import type { JobPosting } from '@/data/jobs';
import type { NewsItem, Reporter, BilingualText } from '@/data/news';
import type { CultureEvent } from '@/data/events';
import type { Poll } from '@/data/voting';
import type { GovItem, GovType } from '@/data/governance';
import type { Lesson } from '@/data/education';
import type { WaterYear, WaterAnalysisType } from '@/data/water';
import type { Ebook } from '@/data/ebooks';
import type { Contact } from '@/data/contacts';
import type { CouncilTerm } from '@/data/council';
import type { CommunityActs } from '@/data/communities';

// ── Row shapes (as stored in Supabase / baked into data/*.json) ──────────────

/** A row of the generic `content` table. */
export interface ContentRow {
  id: string;
  created_at: string;
  /** Present in baked files that hold more than one kind (e.g. education). */
  kind?: string;
  data: Record<string, unknown>;
}

/** A raw row of the `news` table. */
export interface NewsRow {
  id: string;
  created_at: string;
  reporter_name: string;
  reporter_url: string;
  title_el: string;
  title_en: string;
  subtitle_el: string;
  subtitle_en: string;
  topic: string;
  links: { instagram?: string; facebook?: string; twitter?: string } | null;
}

/** A raw row of the `referendums` table. */
export interface ReferendumRow {
  id: string;
  title_el: string;
  title_en: string;
  small_el: string;
  small_en: string;
  medium_el: string;
  medium_en: string;
  large_el: string;
  large_en: string;
  pdf_url: string;
  youtube_id: string;
  options: { id: string; el: string; en?: string }[] | null;
  ends_at: string;
}

/** Competitions added from /admin ▸ Παιδεία (any lesson category). */
export interface LiveCompetition {
  id: string;
  category: Lesson['category'];
  title: BilingualText;
  date: string;
  location?: BilingualText;
  url?: string;
  past?: boolean;
}

// ── Small helpers ────────────────────────────────────────────────────────────

/** "Πριν 2 ώρες" / "2 hours ago" from an ISO timestamp. */
export function relativeTime(iso: string): BilingualText {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return { el: `Πριν ${mins}′`, en: `${mins}m ago` };
  const hours = Math.round(mins / 60);
  if (hours < 24) return { el: `Πριν ${hours} ώρες`, en: `${hours} hours ago` };
  const days = Math.round(hours / 24);
  if (days < 30) return { el: `Πριν ${days} μέρες`, en: `${days} days ago` };
  const d = new Date(iso);
  const s = d.toLocaleDateString('el-GR');
  return { el: s, en: d.toLocaleDateString('en-GB') };
}

const bt = (el?: string, en?: string): BilingualText => ({ el: el ?? '', en: en || el || '' });

/** Live entries first, then the rest minus anything the live set already has —
 *  the item may exist twice (fetched now AND baked by a previous sync). */
export function mergeById<T extends { id: string }>(live: T[] | null | undefined, rest: T[]): T[] {
  if (!live || live.length === 0) return rest;
  const ids = new Set(live.map((x) => x.id));
  return [...live, ...rest.filter((x) => !ids.has(x.id))];
}

// ── content-table mappers (one per kind) ─────────────────────────────────────

export const mapAlertRows = (rows: ContentRow[]): CityAlert[] =>
  rows.map((r) => ({ id: r.id, ...(r.data as Omit<CityAlert, 'id'>) }));

export const mapJobRows = (rows: ContentRow[]): JobPosting[] =>
  rows.map((r) => ({
    id: r.id,
    postedAt: relativeTime(r.created_at),
    ...(r.data as Omit<JobPosting, 'id' | 'postedAt'>),
  }));

export const mapEventRows = (rows: ContentRow[]): CultureEvent[] =>
  rows.map((r) => ({ id: r.id, ...(r.data as Omit<CultureEvent, 'id'>) }));

const GOV_KIND_TO_TYPE: Record<string, GovType> = {
  tender: 'Tender',
  bylaw: 'Bylaw',
  consultation: 'Consultation',
  meeting: 'Meeting',
};

export type GovContentKind = 'tender' | 'bylaw' | 'consultation' | 'meeting';

export const mapGovRows = (rows: ContentRow[], kind: GovContentKind): GovItem[] =>
  rows
    .filter((r) => (r.kind ?? kind) === kind)
    .map((r) => ({
      id: r.id,
      type: GOV_KIND_TO_TYPE[kind],
      ...(r.data as Omit<GovItem, 'id' | 'type'>),
    }));

export const mapLessonRows = (rows: ContentRow[]): Lesson[] =>
  rows.filter((r) => (r.kind ?? 'lesson') === 'lesson').map((r) => ({ id: r.id, ...(r.data as Omit<Lesson, 'id'>) }));

export const mapCompetitionRows = (rows: ContentRow[]): LiveCompetition[] =>
  rows
    .filter((r) => (r.kind ?? 'competition') === 'competition')
    .map((r) => ({ id: r.id, ...(r.data as Omit<LiveCompetition, 'id'>) }));

export const mapEbookRows = (rows: ContentRow[]): (Ebook & { id: string })[] =>
  rows.map((r) => {
    const d = r.data as Omit<Ebook, 'id'>;
    // the admin form has no date field — the row's creation date stands in
    return { id: r.id, ...d, date: d.date || r.created_at.slice(0, 10) };
  });

export const mapContactRows = (rows: ContentRow[]): Contact[] =>
  rows.map((r) => ({ id: r.id, ...(r.data as Omit<Contact, 'id'>) }));

/** Council-term rows hold a full CouncilTerm in `data`. Guard against the old
 *  free-JSON placeholder rows: only rows that look like a real term map. */
export const mapCouncilTermRows = (rows: ContentRow[]): CouncilTerm[] =>
  rows
    .map((r) => r.data as unknown as CouncilTerm)
    .filter((t) => Boolean(t && t.id && t.startYear && t.mayor));

/** A term with a known id replaces the bundled one in place (corrections keep
 *  their tab position); unknown ids are prepended as the newest term. */
export function mergeCouncilTerms(overrides: CouncilTerm[], base: CouncilTerm[]): CouncilTerm[] {
  if (overrides.length === 0) return base;
  const byId = new Map(overrides.map((t) => [t.id, t]));
  const merged = base.map((t) => byId.get(t.id) ?? t);
  const added = overrides.filter((t) => !base.some((b) => b.id === t.id));
  return [...added, ...merged];
}

// ── community-decision rows → merged into the per-community lists ────────────

interface CommunityRowData {
  /** The community's `key` in the bundled communityActs. */
  community: string;
  title: BilingualText | string;
  num?: string;
  date: string;
  pdf?: string;
}

/** Merge /admin community decisions into the bundled per-community lists
 *  (newest first). A decision whose pdf — or title+date when it has no pdf —
 *  is already listed is skipped (it may arrive both baked and live). */
export function mergeCommunityRows(base: CommunityActs[], rows: ContentRow[]): CommunityActs[] {
  if (rows.length === 0) return base;
  const tree = base.map((c) => ({ ...c, items: [...c.items] }));
  for (const r of rows) {
    const d = r.data as unknown as CommunityRowData;
    if (!d?.community || !d?.title) continue;
    const community = tree.find((c) => c.key === d.community);
    if (!community) continue; // admin selects from the known keys
    const title = typeof d.title === 'string' ? { el: d.title, en: d.title } : d.title;
    const exists = community.items.some((i) =>
      d.pdf ? i.pdf === d.pdf : i.title.el === title.el && i.date === d.date,
    );
    if (exists) continue;
    community.items.unshift({ title, num: d.num ?? '', date: d.date, ...(d.pdf ? { pdf: d.pdf } : {}) });
  }
  return tree;
}

// ── referendums table → Poll ─────────────────────────────────────────────────

/** Referendum rows mapped onto the existing Poll shape so PollBlock and the
 *  voting UI work unchanged (votes stay on-device). */
export const mapReferendumRows = (rows: ReferendumRow[]): Poll[] =>
  rows.map((r) => ({
    id: `ref_${r.id}`,
    title: bt(r.title_el, r.title_en),
    options: (r.options ?? []).map((o) => ({ id: o.id, text: bt(o.el, o.en) })),
    explanations: {
      short: bt(r.small_el, r.small_en),
      medium: bt(r.medium_el || r.small_el, r.medium_en || r.small_en),
      full: bt(r.large_el || r.medium_el || r.small_el, r.large_en || r.medium_en || r.small_en),
    },
    seedVotes: {},
    endDate: r.ends_at,
    ...(r.youtube_id ? { youtubeId: r.youtube_id } : {}),
    ...(r.pdf_url ? { pdfUrl: r.pdf_url } : {}),
  }));

// ── news table → NewsItem + Reporter ─────────────────────────────────────────

/** Reporter-submitted news plus the distinct reporters that appear in it. */
export function mapNewsRows(rows: NewsRow[]): { items: NewsItem[]; reporters: Reporter[] } {
  const reporters = new Map<string, Reporter>();
  const items: NewsItem[] = rows.map((r) => {
    const name = r.reporter_name || 'Ανταποκριτής';
    const repId = 'live-' + name.toLowerCase().replace(/[^\wͰ-Ͽ]+/g, '-');
    if (!reporters.has(repId)) reporters.set(repId, { id: repId, name, url: r.reporter_url || '#' });
    const links = (r.links ?? {}) as { instagram?: string; facebook?: string; twitter?: string };
    return {
      id: `live-${r.id}`,
      title: bt(r.title_el, r.title_en),
      description: bt(r.subtitle_el, r.subtitle_en),
      timestamp: relativeTime(r.created_at),
      accentColor: '#0D5EAF',
      category: r.topic as NewsItem['category'],
      reporterId: repId,
      ...(Object.keys(links).length ? { socialLinks: links } : {}),
    };
  });
  return { items, reporters: Array.from(reporters.values()) };
}

// ── water rows → merged into the year/unit/community tree ────────────────────

interface WaterRowData {
  year: number;
  /** Municipal unit / community — stored as the Greek name (admin selects);
   *  older rows may carry {el,en} objects. */
  unit: string | { el: string; en?: string };
  community: string | { el: string; en?: string };
  month?: number;
  type: WaterAnalysisType;
  url: string;
}

/** Merge admin-added water-analysis PDFs into the bundled year→unit→community
 *  tree (creating years/units/communities that don't exist yet). A PDF whose
 *  url is already present in the community is skipped — the same row can arrive
 *  twice (baked by the sync AND fetched live before it is pruned). */
export function mergeWaterRows(base: WaterYear[], rows: ContentRow[]): WaterYear[] {
  if (rows.length === 0) return base;

  // deep-ish clone so the bundled data stays untouched
  const tree: WaterYear[] = base.map((y) => ({
    ...y,
    units: y.units.map((u) => ({ ...u, communities: u.communities.map((c) => ({ ...c, pdfs: [...c.pdfs] })) })),
  }));

  for (const r of rows) {
    const d = r.data as unknown as WaterRowData;
    if (!d?.year || !d?.url) continue;
    let year = tree.find((y) => y.year === Number(d.year));
    if (!year) {
      year = { year: Number(d.year), units: [] };
      tree.push(year);
      tree.sort((a, b) => b.year - a.year);
    }
    const unitEl = typeof d.unit === 'string' ? d.unit : d.unit?.el ?? '—';
    let unit = year.units.find((u) => u.name.el === unitEl);
    if (!unit) {
      // Reuse the English unit name from any other year that has this unit.
      const known = base.flatMap((y) => y.units).find((u) => u.name.el === unitEl);
      unit = { name: known ? { ...known.name } : bt(unitEl, unitEl), communities: [] };
      year.units.push(unit);
    }
    const commEl = typeof d.community === 'string' ? d.community : d.community?.el ?? '—';
    let community = unit.communities.find((c) => c.name.el === commEl);
    if (!community) {
      // Reuse the English community name from the bundled data when known.
      const knownComm = base
        .flatMap((y) => y.units)
        .filter((u) => u.name.el === unitEl)
        .flatMap((u) => u.communities)
        .find((c) => c.name.el === commEl);
      const commEn = typeof d.community === 'object' ? d.community?.en : undefined;
      community = { name: knownComm ? { ...knownComm.name } : bt(commEl, commEn ?? commEl), pdfs: [] };
      unit.communities.push(community);
      unit.communities.sort((a, b) => a.name.el.localeCompare(b.name.el, 'el'));
    }
    if (!community.pdfs.some((p) => p.url === d.url)) {
      community.pdfs.push({ type: d.type, ...(d.month ? { month: Number(d.month) } : {}), url: d.url });
    }
  }
  return tree;
}
