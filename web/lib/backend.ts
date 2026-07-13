'use client';

/**
 * Public-app data layer over Supabase. Every fetcher resolves to the exact
 * shapes the UI already uses, and every one degrades gracefully: when the
 * backend is not configured (or a request fails) it resolves to `null` and
 * the caller keeps the bundled static data.
 */

import { useEffect, useState } from 'react';
import { getSupabase, backendConfigured } from './supabase';
import type { CityAlert } from '@/data/alerts';
import type { JobPosting } from '@/data/jobs';
import type { NewsItem, Reporter, BilingualText } from '@/data/news';
import type { CultureEvent } from '@/data/events';
import type { Poll } from '@/data/voting';
import type { GovItem, GovType } from '@/data/governance';
import type { Lesson } from '@/data/education';
import type { WaterYear, WaterAnalysisType } from '@/data/water';
import type { BudgetReport } from '@/data/budget';

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

// ── Submissions (write paths) ────────────────────────────────────────────────

export async function submitMayorMessage(msg: {
  body: string;
  anonymous: boolean;
  name?: string;
  email?: string;
}): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('messages').insert({
    body: msg.body,
    anonymous: msg.anonymous,
    sender_name: msg.anonymous ? null : msg.name ?? null,
    sender_email: msg.anonymous ? null : msg.email ?? null,
  });
  return !error;
}

export async function submitApplication(app: {
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  cvFile?: File | null;
}): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'offline' };

  let cvPath = '';
  if (app.cvFile) {
    const safe = app.cvFile.name.replace(/[^\w.\-()]+/g, '_').slice(-80);
    cvPath = `${app.jobId}/${Date.now()}-${safe}`;
    const { error: upErr } = await sb.storage.from('cvs').upload(cvPath, app.cvFile, {
      contentType: app.cvFile.type || 'application/pdf',
    });
    if (upErr) return { ok: false, error: upErr.message };
  }

  const { error } = await sb.from('applications').insert({
    job_id: app.jobId,
    job_title: app.jobTitle,
    name: app.name,
    email: app.email,
    cv_path: cvPath,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ── Content fetchers (read paths) ────────────────────────────────────────────

async function fetchContent(kind: string): Promise<{ id: string; created_at: string; data: Record<string, unknown> }[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('content')
    .select('id, created_at, data')
    .eq('kind', kind)
    .eq('published', true)
    .order('created_at', { ascending: false });
  if (error) return null;
  return data as { id: string; created_at: string; data: Record<string, unknown> }[];
}

/** Live risk alerts. When the backend is configured it is the source of truth
 *  (so clearing an alert in /admin clears it in the app). */
export async function fetchLiveAlerts(): Promise<CityAlert[] | null> {
  const rows = await fetchContent('alert');
  if (rows === null) return null;
  return rows.map((r) => ({ id: r.id, ...(r.data as Omit<CityAlert, 'id'>) }));
}

export async function fetchLiveJobs(): Promise<JobPosting[] | null> {
  const rows = await fetchContent('job');
  if (rows === null) return null;
  return rows.map((r) => ({
    id: r.id,
    postedAt: relativeTime(r.created_at),
    ...(r.data as Omit<JobPosting, 'id' | 'postedAt'>),
  }));
}

export async function fetchLiveEvents(): Promise<CultureEvent[] | null> {
  const rows = await fetchContent('event');
  if (rows === null) return null;
  return rows.map((r) => ({ id: r.id, ...(r.data as Omit<CultureEvent, 'id'>) }));
}

/** Decisions in the RawDecision shape used by /public/decisions.json. */
export async function fetchLiveDecisions(): Promise<Record<string, string>[] | null> {
  const rows = await fetchContent('decision');
  if (rows === null) return null;
  return rows.map((r) => r.data as Record<string, string>);
}

const GOV_KIND_TO_TYPE: Record<string, GovType> = {
  tender: 'Tender',
  bylaw: 'Bylaw',
  consultation: 'Consultation',
};

export async function fetchLiveGovItems(kind: 'tender' | 'bylaw' | 'consultation'): Promise<GovItem[] | null> {
  const rows = await fetchContent(kind);
  if (rows === null) return null;
  return rows.map((r) => ({
    id: r.id,
    type: GOV_KIND_TO_TYPE[kind],
    ...(r.data as Omit<GovItem, 'id' | 'type'>),
  }));
}

/** Published referendums mapped onto the existing Poll shape so PollBlock and
 *  the voting UI work unchanged (votes stay on-device in v1.0). */
export async function fetchLiveReferendums(): Promise<Poll[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('referendums')
    .select('*')
    .eq('published', true)
    .order('ends_at', { ascending: false });
  if (error || !data) return null;

  return data.map((r) => ({
    id: `ref_${r.id}`,
    title: bt(r.title_el, r.title_en),
    options: ((r.options as { id: string; el: string; en?: string }[]) ?? []).map((o) => ({
      id: o.id,
      text: bt(o.el, o.en),
    })),
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
}

export async function fetchLiveLessons(): Promise<Lesson[] | null> {
  const rows = await fetchContent('lesson');
  if (rows === null) return null;
  return rows.map((r) => ({ id: r.id, ...(r.data as Omit<Lesson, 'id'>) }));
}

export interface LiveCompetition {
  id: string;
  category: Lesson['category'];
  title: BilingualText;
  date: string;
  location?: BilingualText;
  url?: string;
  past?: boolean;
}

/** Competitions added from /admin ▸ Παιδεία (any lesson category). */
export async function fetchLiveCompetitions(): Promise<LiveCompetition[] | null> {
  const rows = await fetchContent('competition');
  if (rows === null) return null;
  return rows.map((r) => ({ id: r.id, ...(r.data as Omit<LiveCompetition, 'id'>) }));
}

/** Admin-added budget documents, shaped as link-only (scanned) BudgetReports
 *  so they slot into the Financials ▸ Reports lists unchanged. */
export async function fetchLiveBudgetReports(): Promise<BudgetReport[] | null> {
  const rows = await fetchContent('budget');
  if (rows === null) return null;
  return rows
    .filter((r) => typeof r.data.pdfUrl === 'string' && r.data.pdfUrl)
    .map((r) => ({
      ...(r.data as Omit<BudgetReport, 'id' | 'scanned' | 'date'>),
      date: (r.data.date as string | undefined) ?? null,
      id: `live-${r.id}`,
      scanned: true,
    }));
}

interface WaterRow {
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
 *  tree (creating years/units/communities that don't exist yet). */
export async function fetchLiveWater(base: WaterYear[]): Promise<WaterYear[] | null> {
  const rows = await fetchContent('water');
  if (rows === null || rows.length === 0) return null;

  // deep-ish clone so the bundled data stays untouched
  const tree: WaterYear[] = base.map((y) => ({
    ...y,
    units: y.units.map((u) => ({ ...u, communities: u.communities.map((c) => ({ ...c, pdfs: [...c.pdfs] })) })),
  }));

  for (const r of rows) {
    const d = r.data as unknown as WaterRow;
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
    community.pdfs.push({ type: d.type, ...(d.month ? { month: Number(d.month) } : {}), url: d.url });
  }
  return tree;
}

export interface LiveNews {
  items: NewsItem[];
  reporters: Reporter[];
}

/** Reporter-submitted news plus the distinct reporters that appear in it. */
export async function fetchLiveNews(): Promise<LiveNews | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('news')
    .select('id, created_at, reporter_name, reporter_url, title_el, title_en, subtitle_el, subtitle_en, topic, links')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error || !data) return null;

  const reporters = new Map<string, Reporter>();
  const items: NewsItem[] = data.map((r) => {
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

export interface DutyRow {
  pharmacy_id: string;
  pharmacy_name: string;
  duty_date: string;
  hours_el: string;
  hours_en: string;
}

/** Today's (and tomorrow's) on-duty pharmacies. */
export async function fetchPharmacyDuty(): Promise<DutyRow[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from('pharmacy_duty')
    .select('pharmacy_id, pharmacy_name, duty_date, hours_el, hours_en')
    .gte('duty_date', today)
    .order('duty_date')
    .limit(20);
  if (error) return null;
  return data as DutyRow[];
}

// ── Web push ─────────────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from(raw.split('').map((c) => c.charCodeAt(0)));
}

/** 'ok' — subscribed and stored; 'unavailable' — push can't work here (no
 *  backend/VAPID key/Push API), by design silent; { error } — it should have
 *  worked but didn't, so the caller can tell the user why. */
export type PushResult = 'ok' | 'unavailable' | { error: string };

/** Subscribe this browser to web push and store the subscription server-side.
 *  iOS/Safari only allows pushManager.subscribe() while the user's tap
 *  activation is still alive (subscribe() itself shows the permission prompt
 *  when needed) — so call this FIRST inside the gesture handler, before
 *  anything else that could consume the activation. */
export async function subscribeToPush(): Promise<PushResult> {
  const sb = getSupabase();
  if (!sb || !VAPID_PUBLIC_KEY) return 'unavailable';
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'unavailable';
  try {
    const reg = await navigator.serviceWorker.ready;
    const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    let sub = await reg.pushManager.getSubscription();
    // A subscription minted under a previous VAPID key can never receive our
    // pushes — drop it and subscribe fresh with the current key.
    if (sub?.options.applicationServerKey) {
      const existing = new Uint8Array(sub.options.applicationServerKey);
      if (existing.length !== key.length || existing.some((b, i) => b !== key[i])) {
        await sub.unsubscribe().catch(() => {});
        sub = null;
      }
    }
    sub =
      sub ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key as unknown as BufferSource,
      }));
    // Plain INSERT — deliberately NOT upsert: Postgres runs the table's SELECT
    // policies for an ON CONFLICT arbiter check, and only the mayor may read
    // this table, so an upsert is always rejected by RLS for citizens. A
    // duplicate endpoint (23505) just means this device is already registered.
    const { error } = await sb
      .from('push_subscriptions')
      .insert({ endpoint: sub.endpoint, subscription: sub.toJSON() });
    return error && error.code !== '23505' ? { error: error.message } : 'ok';
  } catch (e) {
    return { error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

/** Kill this device's push subscription (notifications toggled off). The
 *  server row dies on the next send (the endpoint returns 410 and is pruned). */
export async function unsubscribeFromPush(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch {
    /* nothing to clean up */
  }
}

// ── React hook ───────────────────────────────────────────────────────────────

/** Fetch live data once on mount; `null` until (and unless) it arrives, so the
 *  caller can fall back to the bundled static data. */
export function useLive<T>(fetcher: () => Promise<T | null>): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    if (!backendConfigured) return;
    let alive = true;
    fetcher().then((v) => {
      if (alive && v !== null) setValue(v);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}
