import type { BilingualText } from './news';
import raw from './communities.json';
import { mergeCommunityRows, type ContentRow } from '@/lib/rows';

export interface CommunityDecision { title: BilingualText; num: string; date: string; pdf?: string; }
export interface CommunityActs { key: string; name: BilingualText; items: CommunityDecision[]; }

/* Per-community decisions harvested from the municipality's community category
 * feeds (v0.9 harvest), in communities.json.bundled. communities.json.baked
 * holds the /admin-added decisions (kind=community, synced weekly), merged
 * into each community's list at load. */
export const communityActs: CommunityActs[] = mergeCommunityRows(
  raw.bundled as unknown as CommunityActs[],
  raw.baked as ContentRow[],
);
