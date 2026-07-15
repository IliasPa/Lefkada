import type { BilingualText } from './news';
import raw from './council.json';
import { mapCouncilTermRows, mergeCouncilTerms, type ContentRow } from '@/lib/rows';

export interface CouncilPerson {
  id: string;
  name: BilingualText;
  role: BilingualText;
  /** Short note / responsibilities, shown in-app (no external link). */
  bio?: BilingualText;
  email?: string;
  phone?: string;
  /** Link to this person's published Curriculum Vitae (document), if any. */
  cv?: string;
  /** Link to this person's asset declaration / πόθεν έσχες (document), if any. */
  assetUrl?: string;
}

export interface CommitteeMembers {
  president?: string;
  regular: string[];
  alternate: string[];
}

export interface Committee {
  id: string;
  name: BilingualText;
  description: BilingualText;
  /** Elected members (where published) — shown in the committee detail sheet. */
  members?: CommitteeMembers;
}

export interface CouncilTerm {
  id: string;
  /** Year the term took office — used as the tab label. */
  startYear: number;
  /** ISO yyyy-mm-dd the council took office, if known. */
  startDate?: string;
  endYear?: number;
  mayor: CouncilPerson;
  secretaryGeneral?: CouncilPerson;
  deputyMayors: CouncilPerson[];
  /** Εντεταλμένοι Σύμβουλοι — councillors delegated specific portfolios. */
  delegatedCouncillors?: CouncilPerson[];
  committees: Committee[];
  /** Επιχειρησιακό Πρόγραμμα — strategic (A') & operational (B') planning documents for the term. */
  planning?: { period: string; strategic: string; operational: string };
  /** Shown when a past term's full composition isn't recorded in-app yet. */
  note?: BilingualText;
}

/** The official decision (document) appointing the current Deputy Mayors. */
export const DEPUTY_ASSIGNMENT_DECISION =
  'https://lefkada.gov.gr/wp-content/uploads/2026/04/8321-26-98fpoli-itha.pdf';

/** The official decision (document) appointing the current Delegated Councillors. */
export const DELEGATED_ASSIGNMENT_DECISION =
  'https://lefkada.gov.gr/wp-content/uploads/2026/01/rp42oli-d0m.pdf';

// ── City Council (Δημοτικό Συμβούλιο) composition ────────────────────────────
export interface CityCouncil {
  president: string;
  vicePresident: string;
  secretary: string;
  councillors: string[];
}

// ── Organisational tree (δομή του Δήμου) ─────────────────────────────────────
export interface OrgNode {
  name: BilingualText;
  children?: OrgNode[];
}

/* council.json = { bundled: {councilTerms, cityCouncil, orgTree},
 * baked: [content rows, kind=council] }. A baked/live term whose `id` matches
 * a bundled one REPLACES it in place (so /admin can correct the current term);
 * new ids are added in front as the newest term. Terms are newest first — the
 * first entry is the current term. */
export const councilTerms: CouncilTerm[] = mergeCouncilTerms(
  mapCouncilTermRows(raw.baked as ContentRow[]),
  raw.bundled.councilTerms as unknown as CouncilTerm[],
);

export const cityCouncil: CityCouncil = raw.bundled.cityCouncil as unknown as CityCouncil;

export const orgTree: OrgNode[] = raw.bundled.orgTree as unknown as OrgNode[];
