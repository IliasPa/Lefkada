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

// ── Voting & veto (v1.3) ─────────────────────────────────────────────────────
// Hashed, insert-only, SIGNED-IN citizens only: every ballot row carries
// voter_key = SHA-256(seed ‖ auth-user-id ‖ poll-id) — one account is one
// voter per poll, on any device — and the «citizens vote» RLS policy accepts
// a row only when its key equals that hash for the CALLING user, so nobody
// can vote as anyone else. Vote changes are new inserts; the tally counts
// each voter_key's LATEST row. Anonymous device voting was removed on
// purpose — without the backend configured, the on-device demo tally is all
// there is.
//
// The seed is a CONSTANT on purpose: it must equal the literal inside the
// policies in supabase/schema.sql (secrecy adds nothing — the user id is the
// unguessable part). gov.gr OAuth (when the municipality's ΚΕΔ approval
// lands) plugs in as a second sign-in method producing the same auth user —
// keys, tables and tallies all stay unchanged.

import { KEYS, storageGet, storageSet } from './storage';

const VERIFIED_SEED = 'lefkada-verified-v1';

async function sha256Hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

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

/** Push the profile's identity fields (name/ΑΦΜ) into the registry so the
 *  mayor can match the account against the municipal roll. Only runs while
 *  verified; the resident flag itself is untouchable from the client. */
export async function syncCitizenProfile(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const user = await getVerifiedUser();
  if (!user) return;
  const p = storageGet<{ fullName?: string; taxNumber?: string }>(KEYS.profile, {});
  await sb.from('citizens').upsert({
    user_id: user.id,
    email: user.email,
    full_name: (p.fullName ?? '').trim(),
    tax_number: (p.taxNumber ?? '').trim(),
  });
}

/** Silently refresh the official-residency stamp of this account's vote on a
 *  still-open poll: when the mayor designates a citizen AFTER they voted, the
 *  next visit to the poll re-submits their unchanged choice with the fresh
 *  stamp, so the Δημότες statistic self-heals without any citizen action. */
export async function restampVoteIfNeeded(pollId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const user = await getVerifiedUser();
  if (!user) return;
  const choice = storageGet<Record<string, string>>(KEYS.myVotes, {})[pollId];
  if (!choice) return;
  const official = (await fetchOwnCitizenStatus())?.resident ?? false;
  const stamps = storageGet<Record<string, boolean>>(KEYS.voteStamps, {});
  if (stamps[pollId] === official) return;
  await submitVote(pollId, choice); // records the fresh stamp itself
}

/** The `official_resident` stamp for the current account, mirroring exactly
 *  what the «citizens vote/veto» policies will accept: false = confirmed by
 *  the mayor against the municipal roll, null = not confirmed. (true is the
 *  gov.gr tier — server-side only, in a future version.) */
async function officialStamp(): Promise<boolean | null> {
  return (await fetchOwnCitizenStatus())?.resident ? false : null;
}

/** Record (or change) a vote — signed-in citizens only (anonymous device
 *  voting was removed). The row carries the account-bound key plus the
 *  3-state `official_resident` stamp, both re-checked by RLS. Voters also
 *  land in the participation registry. Resolves false when the backend is
 *  configured but the insert failed — the caller must SAY so, never
 *  pretend. */
export async function submitVote(pollId: string, optionId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true; // no backend — the on-device demo tally is the whole story
  try {
    const user = await getVerifiedUser();
    if (!user) return false; // the UI asks for sign-in before ever calling this
    const stamp = await officialStamp();
    const { error } = await sb.from('votes').insert({
      poll_id: pollId,
      option_id: optionId,
      voter_key: await sha256Hex(`${VERIFIED_SEED}:${user.id}:${pollId}`),
      official_resident: stamp,
    });
    if (error) return false;
    const stamps = storageGet<Record<string, boolean>>(KEYS.voteStamps, {});
    storageSet(KEYS.voteStamps, { ...stamps, [pollId]: stamp === false });
    // Participation registry: WHO took part — never what they chose. Stored
    // without any timestamp so it can't be paired with the ballot row.
    // Plain insert (not upsert — citizens can't SELECT for the ON CONFLICT
    // arbiter); a 23505 duplicate just means "already registered". Best-
    // effort: the vote above already landed.
    await sb.from('poll_participants').insert({
      poll_id: pollId,
      user_id: user.id,
      email: user.email,
      verified_via: 'email',
    });
    return true;
  } catch {
    return false;
  }
}

// ── Veto (weekly, day-only) ──────────────────────────────────────────────────
// Confirmed Δημότες only, one shot, no recall. Privacy: rows store ONLY the
// weekday (1 = Monday … 7 = Sunday, Athens; Monday before 03:00 counts as
// Sunday) — no timestamps at all. The weekly counter resets because a GitHub
// workflow wipes the table every Monday 03:00 Europe/Athens, so the table
// always holds exactly the current week.

/** The Monday of the current veto week ('YYYY-MM-DD', Athens, weeks turn at
 *  Monday 03:00). Used for the device's own weekly button reset and the
 *  admin's week label — and mirrored in the alert workflow. */
export function vetoWeek(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  // Weekday arithmetic on the Athens calendar date, done in UTC space.
  let d = Date.UTC(get('year'), get('month') - 1, get('day'));
  if (get('hour') < 3) d -= 86400000; // 00:00–02:59 still belongs to the day before
  d -= ((new Date(d).getUTCDay() + 6) % 7) * 86400000; // back to Monday
  return new Date(d).toISOString().slice(0, 10);
}

/** The 1–7 weekday (Athens) a veto cast right now belongs to. */
export function athensVetoDay(at: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  let d = Date.UTC(get('year'), get('month') - 1, get('day'));
  if (get('hour') < 3) d -= 86400000;
  return ((new Date(d).getUTCDay() + 6) % 7) + 1;
}

/** Exercise the veto for the current week — only works for signed-in,
 *  mayor-confirmed Δημότες (the UI gates on the same condition; RLS is the
 *  real wall). */
export async function submitVeto(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return true;
  try {
    const user = await getVerifiedUser();
    if (!user) return false;
    const stamp = await officialStamp();
    const { error } = await sb.from('vetos').insert({
      day: athensVetoDay(),
      voter_key: await sha256Hex(`${VERIFIED_SEED}:${user.id}:veto`),
      official_resident: stamp,
    });
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

/** Result snapshots the mayor has published to the app's front page — counts
 *  only, aggregated in /admin; vote rows never leave the mayor-only table. */
export async function fetchPublishedResults(): Promise<PublishedResult[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('poll_results')
    .select('poll_id, updated_at, data')
    .eq('published', true)
    .order('updated_at', { ascending: false })
    .limit(12);
  if (error || !data || data.length === 0) return null;
  return data as PublishedResult[];
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
