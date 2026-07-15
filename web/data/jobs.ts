import type { BilingualText } from './news';
import raw from './jobs.json';
import { mapJobRows, type ContentRow } from '@/lib/rows';

export type EmploymentType = 'Full-time' | 'Part-time' | 'Seasonal' | 'Contract';
export type WorkMode = 'On-site' | 'Remote' | 'Hybrid';

export interface JobPosting {
  id: string;
  title: BilingualText;
  company: BilingualText;
  description: BilingualText;
  location: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  postedAt: BilingualText;
  /** Official PDF with the full job details. Falls back to a shared placeholder. */
  detailsPdf?: string;
}

// jobs.json = { bundled: [...], baked: [content rows, kind=job] } — postings
// created in /admin (synced weekly) come ahead of the bundled ones; postedAt
// is computed from created_at at load, so it never freezes.
export const jobsData: JobPosting[] = [
  ...mapJobRows(raw.baked as ContentRow[]),
  ...(raw.bundled as unknown as JobPosting[]),
];
