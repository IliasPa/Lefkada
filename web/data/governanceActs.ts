import type { GovItem } from './governance';
import raw from './governanceActs.json';
import { mapGovRows, type ContentRow } from '@/lib/rows';

/* governanceActs.json = { bundled: {tenders, bylaws, consultations,
 * decisionArchive}, baked: [content rows, kind=tender|bylaw|consultation|council] }.
 * The bundled part is the v0.9 harvest (tenders, bylaws, consultations and the
 * pre-2021 Google-Drive decision archive; the 2021-2026 decisions live in
 * /public/decisions.json, lazy-loaded). The baked rows are the /admin entries
 * synced weekly by scripts/sync-data.mjs, merged ahead per type. */

const baked = raw.baked as ContentRow[];

export const tendersData: GovItem[] = [
  ...mapGovRows(baked, 'tender'),
  ...(raw.bundled.tenders as unknown as GovItem[]),
];

export const bylawsData: GovItem[] = [
  ...mapGovRows(baked, 'bylaw'),
  ...(raw.bundled.bylaws as unknown as GovItem[]),
];

export const consultationsData: GovItem[] = [
  ...mapGovRows(baked, 'consultation'),
  ...(raw.bundled.consultations as unknown as GovItem[]),
];

export const decisionArchive: GovItem[] =
  raw.bundled.decisionArchive as unknown as GovItem[];
