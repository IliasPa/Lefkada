import type { BilingualText } from './news';
import raw from './water.json';
import { mergeWaterRows, type ContentRow } from '@/lib/rows';

export type WaterAnalysisType = 'micro' | 'physico';

export interface WaterPdf { type: WaterAnalysisType; /** Month of sampling, 1-12. */ month?: number; url: string; }
export interface WaterCommunity { name: BilingualText; pdfs: WaterPdf[]; }
export interface WaterUnit { name: BilingualText; communities: WaterCommunity[]; }
export interface WaterYear { year: number; units: WaterUnit[]; }

/** Drinking-water analyses, harvested from lefkada.gov.gr (per-community PDFs),
 *  each tagged with its sampling month. water.json = { bundled: tree,
 *  baked: [content rows, kind=water] } — the baked /admin analyses (synced
 *  weekly) are merged into the tree at load, creating years/units/communities
 *  that don't exist yet. */
export const waterAnalyses: WaterYear[] = mergeWaterRows(
  raw.bundled as unknown as WaterYear[],
  raw.baked as ContentRow[],
);
