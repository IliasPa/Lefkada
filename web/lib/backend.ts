'use client';

/**
 * Public-app data layer over Supabase. Every fetcher resolves to the exact
 * shapes the UI already uses, and every one degrades gracefully: when the
 * backend is not configured (or a request fails) it resolves to `null` and
 * the caller keeps the bundled static data.
 */

import { useEffect, useState } from 'react';
import { getSupabase, backendConfigured } from './supabase';
import {
  mapAlertRows, mapJobRows, mapEventRows, mapGovRows, mapLessonRows,
  mapCompetitionRows, mapNewsRows, mapReferendumRows, mergeWaterRows,
  mapEbookRows, mapContactRows, mapCouncilTermRows, mergeCouncilTerms, mergeCommunityRows,
  type ContentRow, type NewsRow, type ReferendumRow, type LiveCompetition, type GovContentKind,
} from './rows';
import type { CityAlert } from '@/data/alerts';
import type { JobPosting } from '@/data/jobs';
import type { NewsItem, Reporter } from '@/data/news';
import type { CultureEvent } from '@/data/events';
import type { Poll } from '@/data/voting';
import type { GovItem } from '@/data/governance';
import type { Lesson } from '@/data/education';
import type { WaterYear } from '@/data/water';
import type { BudgetReport } from '@/data/budget';
import type { Ebook } from '@/data/ebooks';
import type { Contact } from '@/data/contacts';
import type { CouncilTerm } from '@/data/council';
import type { CommunityActs } from '@/data/communities';

// The row→shape mappers live in lib/rows.ts, shared with the baked-data
// wrappers in data/*.ts so a live item and its baked twin come out identical.
export { relativeTime, mergeById, type LiveCompetition } from './rows';

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
  return rows === null ? null : mapAlertRows(rows);
}

export async function fetchLiveJobs(): Promise<JobPosting[] | null> {
  const rows = await fetchContent('job');
  return rows === null ? null : mapJobRows(rows);
}

export async function fetchLiveEvents(): Promise<CultureEvent[] | null> {
  const rows = await fetchContent('event');
  return rows === null ? null : mapEventRows(rows);
}

/** Decisions in the RawDecision shape used by /public/decisions.json. The
 *  hidden `_id` (the Supabase row id) lets callers dedupe against the entries
 *  the weekly sync has already baked into that file. */
export async function fetchLiveDecisions(): Promise<Record<string, string>[] | null> {
  const rows = await fetchContent('decision');
  if (rows === null) return null;
  return rows.map((r) => ({ ...(r.data as Record<string, string>), _id: r.id }));
}

export async function fetchLiveGovItems(kind: GovContentKind): Promise<GovItem[] | null> {
  const rows = await fetchContent(kind);
  return rows === null ? null : mapGovRows(rows, kind);
}

export async function fetchLiveEbooks(): Promise<(Ebook & { id: string })[] | null> {
  const rows = await fetchContent('ebook');
  return rows === null ? null : mapEbookRows(rows);
}

export async function fetchLiveContacts(): Promise<Contact[] | null> {
  const rows = await fetchContent('contact');
  return rows === null ? null : mapContactRows(rows);
}

/** Live council-term overrides applied over the (already baked) bundled terms. */
export async function fetchLiveCouncilTerms(base: CouncilTerm[]): Promise<CouncilTerm[] | null> {
  const rows = await fetchContent('council');
  if (rows === null) return null;
  const terms = mapCouncilTermRows(rows);
  return terms.length === 0 ? null : mergeCouncilTerms(terms, base);
}

/** Live community decisions merged into the (already baked) per-community
 *  lists — duplicates of baked entries are skipped inside the merge. */
export async function fetchLiveCommunityActs(base: CommunityActs[]): Promise<CommunityActs[] | null> {
  const rows = await fetchContent('community');
  if (rows === null || rows.length === 0) return null;
  return mergeCommunityRows(base, rows);
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
  return mapReferendumRows(data as ReferendumRow[]);
}

export async function fetchLiveLessons(): Promise<Lesson[] | null> {
  const rows = await fetchContent('lesson');
  return rows === null ? null : mapLessonRows(rows);
}

/** Competitions added from /admin ▸ Παιδεία (any lesson category). */
export async function fetchLiveCompetitions(): Promise<LiveCompetition[] | null> {
  const rows = await fetchContent('competition');
  return rows === null ? null : mapCompetitionRows(rows);
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

/** Merge admin-added water-analysis PDFs into the (already baked) bundled
 *  year→unit→community tree — mergeWaterRows skips PDFs the tree already has,
 *  so rows both baked and still live don't double up. */
export async function fetchLiveWater(base: WaterYear[]): Promise<WaterYear[] | null> {
  const rows = await fetchContent('water');
  if (rows === null || rows.length === 0) return null;
  return mergeWaterRows(base, rows as ContentRow[]);
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
  return mapNewsRows(data as NewsRow[]);
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
