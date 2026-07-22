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

// ── Voting & veto (v1.4) ─────────────────────────────────────────────────────
// SIGNED-IN citizens only, one shot (no changing a cast vote). A vote is split
// so nobody can find who voted what: public.cast_vote(poll_id, option_index)
// records WHO in `referendums_participants` (its unique(poll_id, user_id) is the
// one-vote gate) and the choice in `referendums_results` (counts only, no
// voter). The function stamps residency from the citizens registry server-side,
// so it is always correct. There is no per-voter ballot anywhere.
// For the veto, voter_key = SHA-256(seed ‖ auth-user-id ‖ 'veto' ‖ week-Monday),
// so it differs every week. The seed is a CONSTANT on purpose: it must equal
// the literal inside supabase/schema.sql (secrecy adds nothing — the user id is
// the unguessable part). gov.gr OAuth later plugs in as a second sign-in method
// producing the same auth user — everything stays unchanged.

import { KEYS, storageGet } from './storage';

export interface VerifiedUser {
  id: string;
  email: string;
}

/** The signed-in (email-verified) citizen, or null. */
export async function getVerifiedUser(): Promise<VerifiedUser | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    const u = data.session?.user;
    return u ? { id: u.id, email: u.email ?? '' } : null;
  } catch {
    return null;
  }
}

/** Some gateway failures arrive with an empty '{}' body — surface the HTTP
 *  status then, so the profile card never shows a bare «({})». */
function authErrText(error: { message?: string; status?: number }): string {
  const m = (error.message ?? '').trim();
  return m && m !== '{}' ? m : `error sending email — HTTP ${error.status ?? '?'}`;
}

/** Email an 8-digit sign-in code (first use also creates the account). */
export async function sendVerifyCode(email: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'offline' };
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  return error ? { ok: false, error: authErrText(error) } : { ok: true };
}

export async function confirmVerifyCode(email: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'offline' };
  const { error } = await sb.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
  return error ? { ok: false, error: authErrText(error) } : { ok: true };
}

/** Sign out on THIS device only, so several people can verify and vote in
 *  turn from a shared device (the same person's other devices stay signed in). */
export async function signOutVerified(): Promise<void> {
  try {
    await getSupabase()?.auth.signOut({ scope: 'local' });
  } catch {
    /* already signed out */
  }
}

// ── Citizen registry (μητρώο) ────────────────────────────────────────────────
// One row per verified account. The citizen writes their own identity fields
// (name/ΑΦΜ, optional — zero friction); the `resident` flag is the
// MUNICIPALITY's: the mayor matches each account against the official roll
// and toggles it in /admin — a database trigger blocks everyone else. That
// flag is stamped onto every verified vote (RLS-enforced to match the
// registry), making «Δημότες Λευκάδας» the app's headline voting statistic.

export interface CitizenStatus {
  resident: boolean;
  full_name: string;
  tax_number: string;
}

/** Own registry row, or null when signed out / never synced. */
export async function fetchOwnCitizenStatus(): Promise<CitizenStatus | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const user = await getVerifiedUser();
  if (!user) return null;
  const { data } = await sb
    .from('citizens')
    .select('resident, full_name, tax_number')
    .eq('user_id', user.id)
    .maybeSingle();
  return (data as CitizenStatus) ?? null;
}

/** Push the profile's NAME into the registry so the mayor can match the account
 *  against the municipal roll. Only runs while verified. The ΑΦΜ is NOT synced —
 *  a self-declared tax number can't prove identity, so it stays empty until the
 *  future gov.gr flow sets it (a database trigger also rejects it from clients);
 *  the resident flag is likewise untouchable from the client. */
export async function syncCitizenProfile(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const user = await getVerifiedUser();
  if (!user) return;
  const p = storageGet<{ fullName?: string }>(KEYS.profile, {});
  await sb.from('citizens').upsert({
    user_id: user.id,
    email: user.email,
    full_name: (p.fullName ?? '').trim(),
  });
}

/** Record a vote — signed-in citizens only, ONE shot (there is no changing a
 *  cast vote). Everything happens inside public.cast_vote(): it enforces one
 *  ballot per account per poll, stamps residency from the registry, and writes
 *  the choice only as an anonymous tally, so who-voted and what-was-chosen are
 *  never linkable. `optionIndex` is the 0-based position of the option on the
 *  ballot. Resolves true when the vote landed OR the account had already voted
 *  (23505); false only when a configured backend genuinely failed — the caller
 *  must SAY so, never pretend. */
export async function submitVote(pollId: string, optionIndex: number): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true; // no backend — the on-device demo tally is the whole story
  try {
    const user = await getVerifiedUser();
    if (!user) return false; // the UI asks for sign-in before ever calling this
    const { error } = await sb.rpc('cast_vote', { p_poll_id: pollId, p_option: optionIndex });
    // 23505 = already voted (one ballot per account) — treat as success.
    if (error && (error as { code?: string }).code !== '23505') return false;
    return true;
  } catch {
    return false;
  }
}

// ── Veto (rolling 7-day, date-only) ──────────────────────────────────────────
// Confirmed Δημότες only. A veto stays ACTIVE for 7 days from the day it was
// cast, then stops counting — there is no weekly Monday reset. Everything runs
// inside public.cast_veto() (SECURITY DEFINER): it refuses non-Δημότες, is
// idempotent while a veto is active, and lets a citizen renew once their 7 days
// lapse. Rows store only the Athens date + a hashed key.

/** Today's Athens calendar date ('YYYY-MM-DD'). Mirrors athens_today(). */
export function athensToday(at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(at);
}

/** Whether a veto cast on `storedDate` ('YYYY-MM-DD') is still within its
 *  7-day active window (today and the 6 days before). */
export function isVetoActive(storedDate: string, at: Date = new Date()): boolean {
  if (!storedDate) return false;
  const cutoff = new Date(Date.parse(athensToday(at) + 'T00:00:00Z') - 6 * 86400000);
  return Date.parse(storedDate + 'T00:00:00Z') >= cutoff.getTime();
}

/** The Monday of the current calendar week ('YYYY-MM-DD', Athens) — used only
 *  as the cadence key for the mayor's 10%-step veto notifications, not for the
 *  veto window itself. */
export function vetoWeek(at: Date = new Date()): string {
  let d = Date.parse(athensToday(at) + 'T00:00:00Z');
  d -= ((new Date(d).getUTCDay() + 6) % 7) * 86400000; // back to Monday
  return new Date(d).toISOString().slice(0, 10);
}

/** Exercise (or renew) the veto — only works for signed-in, mayor-confirmed
 *  Δημότες (cast_veto() is the real wall). Idempotent while active. */
export async function submitVeto(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true;
  try {
    const user = await getVerifiedUser();
    if (!user) return false;
    const { error } = await sb.rpc('cast_veto');
    return !error;
  } catch {
    return false;
  }
}

// ── Published results (v1.3) ─────────────────────────────────────────────────

export interface PublishedResultOption {
  id: string;
  label_el: string;
  label_en: string;
  all: number;
  /** Votes from confirmed Δημότες — the MAIN statistic. */
  resident?: number;
  /** Legacy snapshots only (pre account-only voting). */
  verified?: number;
}

export interface PublishedResult {
  poll_id: string;
  updated_at: string;
  data: {
    title_el: string;
    title_en: string;
    total: number;
    resident_total?: number;
    /** Legacy snapshots only. */
    verified_total?: number;
    options: PublishedResultOption[];
  };
}

interface RefResultRow { option_id: number; residency: boolean; votes: number }

/** A single referendum's LIVE results, but ONLY when the mayor has revealed
 *  them (referendums.results_published) — otherwise null, so the voting section
 *  hides the aggregate and shows just the citizen's own choice. Labels come
 *  from the referendum row, counts live from referendums_results; call it from
 *  a polling hook so the mayor's toggle and fresh votes appear on their own. */
export async function fetchPollLiveResult(pollId: string): Promise<PublishedResult | null> {
  const sb = getSupabase();
  if (!sb || !pollId.startsWith('ref_')) return null; // only referendums have results
  const { data: ref, error } = await sb
    .from('referendums')
    .select('updated_at, title_el, title_en, options, results_published')
    .eq('id', pollId.slice(4))
    .eq('results_published', true)
    .maybeSingle();
  if (error || !ref) return null;
  const opts = ((ref.options as { id: string; el: string; en: string }[]) ?? []);
  const { data: t } = await sb
    .from('referendums_results')
    .select('option_id, residency, votes')
    .eq('poll_id', pollId);
  const rows = (t as RefResultRow[]) ?? [];
  const options = opts.map((o, i) => {
    const forOpt = rows.filter((r) => r.option_id === i);
    const all = forOpt.reduce((a, r) => a + r.votes, 0);
    const resident = forOpt.filter((r) => r.residency).reduce((a, r) => a + r.votes, 0);
    return { id: o.id, label_el: o.el, label_en: o.en || o.el, all, resident };
  });
  return {
    poll_id: pollId,
    updated_at: (ref.updated_at as string) ?? '',
    data: {
      title_el: ref.title_el as string,
      title_en: (ref.title_en as string) || (ref.title_el as string),
      total: options.reduce((a, o) => a + o.all, 0),
      resident_total: options.reduce((a, o) => a + o.resident, 0),
      options,
    },
  };
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

/** Like useLive but re-fetches on an interval (default 15s) AND when the tab
 *  regains focus — so published results reflect new votes and the mayor's
 *  publish/hide toggle without any refresh button. `null` stays only until the
 *  first successful fetch; a later fetch that returns null (e.g. results
 *  hidden) clears it. */
export function useLivePoll<T>(fetcher: () => Promise<T | null>, intervalMs = 15000): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    if (!backendConfigured) return;
    let alive = true;
    const run = () => fetcher().then((v) => { if (alive) setValue(v); });
    run();
    const id = setInterval(run, intervalMs);
    const onFocus = () => run();
    window.addEventListener('focus', onFocus);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}
