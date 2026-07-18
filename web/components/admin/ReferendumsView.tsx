'use client';

/**
 * Referendum management: title, short/medium/large explanation texts, options,
 * end date/time, optional PDF (uploaded to the public 'docs' bucket) and
 * YouTube id. Publishing makes it appear in the app's Profile ▸ Active votings.
 *
 * v1.3: votes and vetos are recorded server-side as anonymous hashed voter
 * keys (insert-only event log; a device's LATEST row per poll counts). This
 * view shows the live tallies, the veto counter, and the raw stored rows.
 *
 * v1.3 (second push): verified votes (email OTP accounts) tally separately;
 * the donut + bars visualise each poll with municipal-roll Δημότες as the
 * MAIN statistic; the Ψηφοφόροι subtab is the citizen registry where the
 * mayor designates Δημότες per the official roll; the participation registry
 * lists WHO of the verified voters took part (never what they chose — and
 * without timestamps, so the list can't be paired with the ballot rows); the
 * mayor can publish a counts-only snapshot of any poll to the front page.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff, FileText, Home, Landmark,
  Pencil, Plus, RefreshCw, ShieldAlert, Trash2, UserCheck, Users, Vote, X,
} from 'lucide-react';
import { pollsData } from '@/data/voting';
import { getSupabase } from '@/lib/supabase';
import { vetoWeek } from '@/lib/backend';
import { maybeNotifyVetoStep } from '@/lib/notify';
import AnimatedSegmented from '@/components/AnimatedSegmented';
import { Card, Field, GhostBtn, PrimaryBtn, inputCls } from './AdminShell';

interface RefRow {
  id: string;
  created_at: string;
  title_el: string; title_en: string;
  small_el: string; small_en: string;
  medium_el: string; medium_en: string;
  large_el: string; large_en: string;
  pdf_url: string;
  youtube_id: string;
  options: { id: string; el: string; en: string }[];
  ends_at: string;
  published: boolean;
}

interface VoteRow {
  id: string; created_at: string; poll_id: string; option_id: string; voter_key: string;
  /** Verification ladder (RLS-enforced): null = account not confirmed,
   *  false = confirmed by the MAYOR (Δημότης), true = via gov.gr (future).
   *  Δημότες tally = rows where this is NOT null. */
  official_resident: boolean | null;
}
interface VetoRow { id: string; day: number; voter_key: string; official_resident: boolean | null; }
interface ParticipantRow {
  id: string; poll_id: string; user_id: string; email: string;
  verified_via: 'email' | 'govgr';
}
interface ResultRow { poll_id: string; updated_at: string; published: boolean; data: unknown; }
interface CitizenRow {
  user_id: string; email: string; full_name: string; tax_number: string;
  resident: boolean; resident_set_at: string | null; updated_at: string;
}

type OptionDef = { id: string; el: string; en: string };

/** rows must be newest-first; the first row seen per voter_key is their
 *  current (latest) choice — earlier rows are the audit trail. */
function latestPerVoter<T extends { voter_key: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows) {
    if (seen.has(r.voter_key)) continue;
    seen.add(r.voter_key);
    out.push(r);
  }
  return out;
}

const shortKey = (k: string) => k.slice(0, 10) + '…';
const fmtTs = (iso: string) => new Date(iso).toLocaleString('el-GR');

/** One colour per option — donut segments and bars stay in sync. */
const PALETTE = ['#0D5EAF', '#E4802C', '#16A34A', '#DC2626', '#7C3AED', '#0891B2'];

/** The counts-only snapshot that gets published to the app's front page.
 *  `resident` = confirmed Δημότες (official_resident not null: mayor tier
 *  false or gov.gr tier true) — the MAIN statistic everywhere. */
function buildSnapshot(titleEl: string, titleEn: string, options: OptionDef[], rowsForPoll: VoteRow[]) {
  const cur = latestPerVoter(rowsForPoll);
  const curR = cur.filter((v) => v.official_resident !== null);
  return {
    title_el: titleEl,
    title_en: titleEn || titleEl,
    total: cur.length,
    resident_total: curR.length,
    options: options.map((o) => ({
      id: o.id,
      label_el: o.el,
      label_en: o.en || o.el,
      all: cur.filter((v) => v.option_id === o.id).length,
      resident: curR.filter((v) => v.option_id === o.id).length,
    })),
  };
}

const EMPTY: Omit<RefRow, 'id' | 'created_at'> = {
  title_el: '', title_en: '',
  small_el: '', small_en: '',
  medium_el: '', medium_en: '',
  large_el: '', large_en: '',
  pdf_url: '', youtube_id: '',
  options: [
    { id: 'a', el: '', en: '' },
    { id: 'b', el: '', en: '' },
  ],
  ends_at: '',
  published: false,
};

function toLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function ReferendumsView() {
  const [rows, setRows] = useState<RefRow[]>([]);
  const [editing, setEditing] = useState<Partial<RefRow> | null>(null);
  const [busy, setBusy] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [vetoEvents, setVetoEvents] = useState<VetoRow[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [citizens, setCitizens] = useState<CitizenRow[]>([]);
  const [sub, setSub] = useState<'polls' | 'voters'>('polls');

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('referendums').select('*').order('created_at', { ascending: false });
    setRows((data as RefRow[]) ?? []);
    // Everything stored server-side, newest first (mayor-only via RLS).
    const { data: v } = await sb.from('votes').select('*').order('created_at', { ascending: false }).limit(10000);
    setVotes((v as VoteRow[]) ?? []);
    const { data: ve } = await sb.from('vetos').select('*').order('day').limit(10000);
    setVetoEvents((ve as VetoRow[]) ?? []);
    // Alphabetical on purpose — NOT insertion order, which could be paired
    // with the ballot rows' order (the table itself has no timestamps).
    const { data: pp } = await sb.from('poll_participants').select('*').order('email').limit(10000);
    setParticipants((pp as ParticipantRow[]) ?? []);
    const { data: pr } = await sb.from('poll_results').select('*');
    setResults((pr as ResultRow[]) ?? []);
    // The citizen registry — every verified account that has connected.
    const { data: cz } = await sb.from('citizens').select('*').order('full_name').order('email').limit(10000);
    setCitizens((cz as CitizenRow[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  /** Municipal-roll designation per account, for the participants tables. */
  const residentByUser = useMemo(
    () => new Map(citizens.map((c) => [c.user_id, c.resident])),
    [citizens],
  );

  /** The mayor's toggle: Δημότης per the official roll. */
  const toggleResident = useCallback(async (c: CitizenRow) => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('citizens').update({ resident: !c.resident }).eq('user_id', c.user_id);
    if (error) alert('Σφάλμα: ' + error.message);
    load();
  }, [load]);

  /** Publish/refresh (upsert snapshot) or hide (published=false) on the front page. */
  const setPublishedResult = useCallback(async (pollId: string, publish: boolean, snapshot?: ReturnType<typeof buildSnapshot>) => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = publish
      ? await sb.from('poll_results').upsert({
          poll_id: pollId, published: true, updated_at: new Date().toISOString(), data: snapshot,
        })
      : await sb.from('poll_results').update({ published: false }).eq('poll_id', pollId);
    if (error) alert('Σφάλμα δημοσίευσης: ' + error.message);
    load();
  }, [load]);

  const save = async () => {
    const sb = getSupabase();
    if (!sb || !editing) return;
    if (!editing.title_el?.trim() || !editing.ends_at) { alert('Συμπληρώστε τουλάχιστον τίτλο και ημερομηνία λήξης.'); return; }
    const options = (editing.options ?? []).filter((o) => o.el.trim());
    if (options.length < 2) { alert('Χρειάζονται τουλάχιστον 2 επιλογές.'); return; }
    setBusy(true);

    let pdf_url = editing.pdf_url ?? '';
    if (pdfFile) {
      const path = `referendums/${Date.now()}-${pdfFile.name.replace(/[^\w.\-()]+/g, '_')}`;
      const { error: upErr } = await sb.storage.from('docs').upload(path, pdfFile, { contentType: 'application/pdf' });
      if (upErr) { alert('Σφάλμα ανεβάσματος PDF: ' + upErr.message); setBusy(false); return; }
      pdf_url = sb.storage.from('docs').getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      title_el: editing.title_el ?? '', title_en: editing.title_en ?? '',
      small_el: editing.small_el ?? '', small_en: editing.small_en ?? '',
      medium_el: editing.medium_el ?? '', medium_en: editing.medium_en ?? '',
      large_el: editing.large_el ?? '', large_en: editing.large_en ?? '',
      pdf_url, youtube_id: editing.youtube_id ?? '',
      options, ends_at: new Date(editing.ends_at).toISOString(),
      published: editing.published ?? false,
    };
    const { error } = editing.id
      ? await sb.from('referendums').update(payload).eq('id', editing.id)
      : await sb.from('referendums').insert(payload);
    setBusy(false);
    if (error) { alert('Σφάλμα: ' + error.message); return; }
    setEditing(null); setPdfFile(null);
    load();
  };

  const remove = async (r: RefRow) => {
    if (!confirm(`Διαγραφή δημοψηφίσματος «${r.title_el}»;`)) return;
    await getSupabase()?.from('referendums').delete().eq('id', r.id);
    load();
  };

  const togglePublish = async (r: RefRow) => {
    await getSupabase()?.from('referendums').update({ published: !r.published }).eq('id', r.id);
    load();
  };

  if (editing) {
    const e = editing;
    const set = (patch: Partial<RefRow>) => setEditing({ ...e, ...patch });
    return (
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg">{e.id ? 'Επεξεργασία' : 'Νέο'} δημοψήφισμα</h2>
          <GhostBtn onClick={() => { setEditing(null); setPdfFile(null); }}><X size={16} /></GhostBtn>
        </div>
        <Card className="p-4 space-y-4">
          <Bi label="Τίτλος (ερώτημα)" el={e.title_el ?? ''} en={e.title_en ?? ''}
            onEl={(v) => set({ title_el: v })} onEn={(v) => set({ title_en: v })} />
          <Bi label="Σύντομο κείμενο" textarea rows={2} el={e.small_el ?? ''} en={e.small_en ?? ''}
            onEl={(v) => set({ small_el: v })} onEn={(v) => set({ small_en: v })} />
          <Bi label="Μεσαίο κείμενο (προαιρετικό, υποστηρίζει **bold**)" textarea rows={5} el={e.medium_el ?? ''} en={e.medium_en ?? ''}
            onEl={(v) => set({ medium_el: v })} onEn={(v) => set({ medium_en: v })} />
          <Bi label="Πλήρες κείμενο (προαιρετικό)" textarea rows={8} el={e.large_el ?? ''} en={e.large_en ?? ''}
            onEl={(v) => set({ large_el: v })} onEn={(v) => set({ large_en: v })} />

          <Field label="Επιλογές ψήφου">
            <div className="space-y-2">
              {(e.options ?? []).map((o, i) => (
                <div key={o.id} className="flex gap-2 items-center">
                  <span className="w-6 text-center font-black text-gray-400 text-sm">{o.id.toUpperCase()}</span>
                  <input value={o.el} placeholder="Ελληνικά" className={inputCls}
                    onChange={(ev) => set({ options: e.options!.map((x, j) => (j === i ? { ...x, el: ev.target.value } : x)) })} />
                  <input value={o.en} placeholder="English (προαιρετικό)" className={inputCls}
                    onChange={(ev) => set({ options: e.options!.map((x, j) => (j === i ? { ...x, en: ev.target.value } : x)) })} />
                  {(e.options?.length ?? 0) > 2 && (
                    <GhostBtn danger onClick={() => set({ options: e.options!.filter((_, j) => j !== i) })}><X size={14} /></GhostBtn>
                  )}
                </div>
              ))}
              {(e.options?.length ?? 0) < 6 && (
                <button type="button"
                  onClick={() => set({ options: [...(e.options ?? []), { id: String.fromCharCode(97 + (e.options?.length ?? 0)), el: '', en: '' }] })}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary-300">
                  <Plus size={13} /> Προσθήκη επιλογής
                </button>
              )}
            </div>
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Λήξη ψηφοφορίας">
              <input type="datetime-local" value={toLocalInput(e.ends_at ?? '')}
                onChange={(ev) => set({ ends_at: ev.target.value })} className={inputCls} />
            </Field>
            <Field label="YouTube video id (προαιρετικό)">
              <input value={e.youtube_id ?? ''} onChange={(ev) => set({ youtube_id: ev.target.value })}
                placeholder="π.χ. zJ-m32h3HC8" className={inputCls} />
            </Field>
          </div>

          <Field label="Επίσημο PDF (προαιρετικό)">
            <div className="flex items-center gap-2 flex-wrap">
              <input type="file" accept="application/pdf" onChange={(ev) => setPdfFile(ev.target.files?.[0] ?? null)}
                className="text-xs" />
              {!pdfFile && e.pdf_url && (
                <a href={e.pdf_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-primary dark:text-primary-300">
                  <FileText size={13} /> Τρέχον PDF
                </a>
              )}
            </div>
          </Field>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={e.published ?? false} onChange={(ev) => set({ published: ev.target.checked })} />
            Δημοσιευμένο (ορατό στην εφαρμογή)
          </label>

          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => { setEditing(null); setPdfFile(null); }}>Ακύρωση</GhostBtn>
            <PrimaryBtn onClick={save} disabled={busy}>{busy ? 'Αποθήκευση…' : 'Αποθήκευση'}</PrimaryBtn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Vote size={18} className="text-primary dark:text-primary-300" />
          <h2 className="font-black text-lg">Δημοψηφίσματα</h2>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedSegmented
            size="sm"
            options={[
              { key: 'polls', label: 'Ψηφοφορίες', icon: <Vote size={13} /> },
              { key: 'voters', label: `Ψηφοφόροι (${citizens.length})`, icon: <Users size={13} /> },
            ]}
            value={sub}
            onChange={(k) => setSub(k as 'polls' | 'voters')}
          />
          {sub === 'polls' && (
            <PrimaryBtn onClick={() => setEditing({ ...EMPTY })}><Plus size={13} className="inline mr-1" />Νέο</PrimaryBtn>
          )}
        </div>
      </div>

      {sub === 'voters' ? (
        <VotersView rows={citizens} onToggle={toggleResident} />
      ) : (
        <>
          <VetoCard vetos={vetoEvents} confirmedCitizens={citizens.filter((c) => c.resident).length} />

          {rows.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">Δεν υπάρχουν δημοψηφίσματα ακόμη.</p>
          ) : (
            <div className="space-y-2.5">
              {rows.map((r) => {
                const pid = `ref_${r.id}`;
                const pollVotes = votes.filter((v) => v.poll_id === pid);
                const result = results.find((x) => x.poll_id === pid);
                return (
                  <RefCard key={r.id} r={r}
                    votes={pollVotes}
                    participants={participants.filter((p) => p.poll_id === pid)}
                    residentByUser={residentByUser}
                    resultRow={result}
                    onPublishToggle={() => setPublishedResult(pid, !result?.published,
                      buildSnapshot(r.title_el, r.title_en, r.options, pollVotes))}
                    onRefreshSnapshot={() => setPublishedResult(pid, true,
                      buildSnapshot(r.title_el, r.title_en, r.options, pollVotes))}
                    onToggle={() => togglePublish(r)} onEdit={() => setEditing(r)} onRemove={() => remove(r)} />
                );
              })}
            </div>
          )}

          <OtherPollResults votes={votes} participants={participants} results={results}
            residentByUser={residentByUser}
            knownIds={rows.map((r) => `ref_${r.id}`)} onSetPublished={setPublishedResult} />
        </>
      )}
    </div>
  );
}

// ── Ψηφοφόροι: the citizen registry (municipal roll matching) ────────────────

/** Every verified account that has connected to the app. The mayor checks the
 *  official municipal roll and toggles Δημότης per account — that flag drives
 *  the MAIN voting statistic, marks the citizen's profile, and notifies them
 *  on their next visit. All of them can vote either way; only the statistics
 *  differ. */
function VotersView({ rows, onToggle }: { rows: CitizenRow[]; onToggle: (c: CitizenRow) => void }) {
  const [q, setQ] = useState('');
  const residents = rows.filter((c) => c.resident).length;
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((c) => [c.full_name, c.tax_number, c.email].join(' ').toLowerCase().includes(needle))
    : rows;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 text-[10.5px] font-bold">
        <span className="px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary dark:text-primary-300">
          🏛 Δημότες Λευκάδας: {residents}
        </span>
        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-[#252A3A] text-gray-500 dark:text-gray-400">
          Συνδεδεμένοι λογαριασμοί: {rows.length}
        </span>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} className={inputCls}
        placeholder="Αναζήτηση: όνομα, ΑΦΜ ή email…" />
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">
          {rows.length === 0
            ? 'Κανείς δεν έχει συνδεθεί ακόμη — οι πολίτες εμφανίζονται εδώ μόλις επαληθευτούν με email στην εφαρμογή.'
            : 'Δεν βρέθηκε αντιστοιχία.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.user_id} className="p-3.5 flex items-center gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[13.5px] leading-snug">
                  {c.full_name || <span className="italic font-medium text-gray-400">Χωρίς όνομα</span>}
                </p>
                <p className="text-[11.5px] text-gray-400 mt-0.5">
                  {c.tax_number ? <>ΑΦΜ <span className="font-mono font-bold text-gray-500 dark:text-gray-300">{c.tax_number}</span> · </> : 'Χωρίς ΑΦΜ · '}
                  {c.email}
                </p>
              </div>
              <button type="button" onClick={() => onToggle(c)}
                title={c.resident ? 'Αφαίρεση από τους δημότες Λευκάδας' : 'Καταχώρηση ως δημότης Λευκάδας (κατά το δημοτολόγιο)'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-black active:scale-95 transition-all ${
                  c.resident
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'bg-gray-100 dark:bg-[#252A3A] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2F3650]'
                }`}>
                {c.resident ? <><UserCheck size={14} /> Δημότης ✓</> : <><Landmark size={14} /> Εκτός</>}
              </button>
            </Card>
          ))}
        </div>
      )}
      <p className="text-[10.5px] text-gray-400 leading-relaxed">
        Η καταχώρηση γίνεται χειροκίνητα με βάση το επίσημο δημοτολόγιο — οι πολίτες δεν χρειάζεται να
        κάνουν τίποτα. Ο χαρακτηρισμός φαίνεται στο προφίλ τους (με ειδοποίηση όταν αλλάζει), σφραγίζει
        τις επόμενες ψήφους τους και διορθώνει αυτόματα την ψήφο τους σε ανοιχτές ψηφοφορίες στην
        επόμενη επίσκεψή τους. Όλοι οι συνδεδεμένοι ψηφίζουν — τα στατιστικά ξεχωρίζουν τους δημότες·
        το ΒΕΤΟ όμως είναι διαθέσιμο μόνο σε επιβεβαιωμένους δημότες.
      </p>
    </div>
  );
}

// ── Results: one referendum ──────────────────────────────────────────────────

function RefCard({ r, votes, participants, residentByUser, resultRow, onPublishToggle, onRefreshSnapshot, onToggle, onEdit, onRemove }: {
  r: RefRow; votes: VoteRow[]; participants: ParticipantRow[]; residentByUser: Map<string, boolean>; resultRow?: ResultRow;
  onPublishToggle: () => void; onRefreshSnapshot: () => void;
  onToggle: () => void; onEdit: () => void; onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ended = new Date(r.ends_at).getTime() < Date.now();
  const current = useMemo(() => latestPerVoter(votes), [votes]);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[14px] leading-snug">{r.title_el}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {r.options.length} επιλογές · λήγει {new Date(r.ends_at).toLocaleString('el-GR')}
            {ended && ' · ΕΛΗΞΕ'}
          </p>
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-full ${
          r.published ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-gray-100 dark:bg-[#252A3A] text-gray-400'}`}>
          {r.published ? <><CheckCircle2 size={11} /> Δημοσιευμένο</> : 'Πρόχειρο'}
        </span>
        <PublishResultBtn published={Boolean(resultRow?.published)} onToggle={onPublishToggle} onRefresh={onRefreshSnapshot} />
        <GhostBtn onClick={onToggle} title={r.published ? 'Απόσυρση' : 'Δημοσίευση'}>
          {r.published ? <EyeOff size={14} /> : <Eye size={14} />}
        </GhostBtn>
        <GhostBtn onClick={onEdit} title="Επεξεργασία"><Pencil size={14} /></GhostBtn>
        <GhostBtn danger onClick={onRemove} title="Διαγραφή"><Trash2 size={14} /></GhostBtn>
      </div>
      {resultRow?.published && (
        <p className="text-[10.5px] font-semibold text-emerald-600 mt-1.5">
          <Home size={11} className="inline mr-1 -mt-0.5" />
          Τα αποτελέσματα εμφανίζονται στην αρχική σελίδα (ενημ. {fmtTs(resultRow.updated_at)}) — το ⟳ στέλνει τους τρέχοντες αριθμούς.
        </p>
      )}

      <button onClick={() => setOpen((v) => !v)}
        className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0F1219] text-[12px] font-bold text-gray-600 dark:text-gray-300">
        <span className="flex items-center gap-1.5"><Vote size={13} className="text-primary dark:text-primary-300" />
          Αποτελέσματα — {current.length} ψηφοφόροι ({votes.length} καταχωρίσεις)</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <>
          <Tally options={r.options} current={current} allRows={votes} />
          <Participants rows={participants} residentByUser={residentByUser} />
        </>
      )}
    </Card>
  );
}

/** Front-page toggle: filled green when the poll's results are live on the
 *  app's home screen; the refresh button pushes updated counts. */
function PublishResultBtn({ published, onToggle, onRefresh }: {
  published: boolean; onToggle: () => void; onRefresh: () => void;
}) {
  return (
    <span className="flex items-center">
      <button type="button" onClick={onToggle}
        title={published ? 'Απόκρυψη αποτελεσμάτων από την αρχική' : 'Εμφάνιση αποτελεσμάτων στην αρχική σελίδα'}
        className={`px-3 py-2 rounded-xl text-[12px] font-bold active:scale-95 transition-all ${
          published
            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A]'
        }`}>
        <Home size={14} />
      </button>
      {published && (
        <GhostBtn onClick={onRefresh} title="Ενημέρωση των δημοσιευμένων αριθμών (νέο στιγμιότυπο)">
          <RefreshCw size={14} />
        </GhostBtn>
      )}
    </span>
  );
}

/** Donut + bars per option (latest vote per voter). MAIN statistic = votes of
 *  confirmed Δημότες (official_resident not null — mayor or gov.gr tier);
 *  the thin grey bar is every account. Falls back to the all-votes view while
 *  no confirmed Δημότης has voted yet. */
function Tally({ options, current, allRows }: {
  options: OptionDef[]; current: VoteRow[]; allRows: VoteRow[];
}) {
  const total = current.length;
  const residentCur = current.filter((v) => v.official_resident !== null);
  const mainIsResidents = residentCur.length > 0;
  const main = mainIsResidents ? residentCur : current;

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-4">
        <Donut
          segments={options.map((o, i) => ({
            value: main.filter((v) => v.option_id === o.id).length,
            color: PALETTE[i % PALETTE.length],
          }))}
          centerLabel={String(main.length)}
          centerSub={mainIsResidents ? 'δημότες' : 'σύνολο'}
        />
        <div className="flex-1 min-w-0 space-y-2">
          {options.map((o, i) => {
            const nMain = main.filter((v) => v.option_id === o.id).length;
            const nAll = current.filter((v) => v.option_id === o.id).length;
            const pctMain = main.length ? Math.round((nMain / main.length) * 100) : 0;
            const pctAll = total ? Math.round((nAll / total) * 100) : 0;
            return (
              <div key={o.id}>
                <div className="flex justify-between text-[12px] mb-0.5 gap-2">
                  <span className="font-semibold min-w-0 truncate">
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                    {o.id.toUpperCase()}. {o.el}
                  </span>
                  <span className="font-black flex-shrink-0">
                    {nMain} · {pctMain}%
                    {mainIsResidents && <span className="font-semibold text-gray-400"> ({nAll} συν.)</span>}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-[#252A3A] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pctMain}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                </div>
                {mainIsResidents && (
                  <div className="h-1 rounded-full bg-gray-50 dark:bg-[#1A2035] overflow-hidden mt-0.5"
                    title={`Όλοι οι λογαριασμοί: ${nAll} (${pctAll}%)`}>
                    <div className="h-full rounded-full bg-gray-300 dark:bg-[#3A4155]" style={{ width: `${pctAll}%` }} />
                  </div>
                )}
              </div>
            );
          })}
          {mainIsResidents && (
            <p className="text-[10px] text-gray-400">Κύρια μπάρα: επιβεβαιωμένοι δημότες · γκρι: όλοι οι λογαριασμοί.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[10.5px] font-bold">
        <span className="px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary dark:text-primary-300">🏛 Δημότες (δημοτολόγιο): {residentCur.length}</span>
        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-[#252A3A] text-gray-500 dark:text-gray-400">Σύνολο λογαριασμών: {total}</span>
      </div>
      <p className="text-[10px] text-gray-400">
        Η ψήφος απαιτεί σύνδεση· ο χαρακτηρισμός «Δημότης» ορίζεται από τον δήμαρχο στην καρτέλα Ψηφοφόροι.
        Ένδειξη εγγραφών: Δ = δημότης (δήμαρχος) · G = gov.gr (μελλοντικά) · — = μη επιβεβαιωμένος.
      </p>

      <RawRows rows={allRows.map((v) => ({
        id: v.id, created_at: v.created_at, key: v.voter_key,
        what: v.option_id.toUpperCase(),
        flag: v.official_resident === true ? 'G' : v.official_resident === false ? 'Δ' : '—',
      }))} />
    </div>
  );
}

/** SVG donut — one segment per option, total in the middle. */
function Donut({ segments, centerLabel, centerSub }: {
  segments: { value: number; color: string }[]; centerLabel: string; centerSub?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const R = 40;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 flex-shrink-0" role="img" aria-label={`Σύνολο ${centerLabel}`}>
      <circle cx="50" cy="50" r={R} fill="none" strokeWidth="12" stroke="currentColor"
        className="text-gray-100 dark:text-[#252A3A]" />
      {total > 0 && segments.filter((s) => s.value > 0).map((s, i) => {
        const dash = (s.value / total) * C;
        const offset = -acc;
        acc += dash;
        return (
          <circle key={i} cx="50" cy="50" r={R} fill="none" strokeWidth="12" stroke={s.color}
            strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={offset}
            transform="rotate(-90 50 50)" />
        );
      })}
      <text x="50" y={centerSub ? '49' : '54'} textAnchor="middle" fontSize="17" fontWeight="800"
        className="fill-gray-900 dark:fill-white">{centerLabel}</text>
      {centerSub && (
        <text x="50" y="61" textAnchor="middle" fontSize="7.5" className="fill-gray-400">{centerSub}</text>
      )}
    </svg>
  );
}

/** The exact stored rows — hashed voter, choice, designation flag and (when
 *  the table has one) the timestamp. Transparency: what Supabase holds is
 *  what the mayor sees, nothing more exists. */
function RawRows({ rows }: { rows: { id: string; created_at?: string; key: string; what: string; flag?: string }[] }) {
  const [show, setShow] = useState(false);
  if (rows.length === 0) return null;
  const hasFlag = rows.some((r) => r.flag !== undefined);
  const hasTime = rows.some((r) => r.created_at !== undefined);
  return (
    <div>
      <button onClick={() => setShow((v) => !v)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        {show ? 'Απόκρυψη' : 'Εμφάνιση'} αποθηκευμένων εγγραφών ({rows.length})
      </button>
      {show && (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-[#1E2D4E]">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-gray-50 dark:bg-[#0F1219] text-gray-400">
              <tr><th className="text-left px-2.5 py-1.5 font-bold">Κρυπτογραφημένος ψηφοφόρος</th>
                <th className="text-left px-2 py-1.5 font-bold">Επιλογή</th>
                {hasFlag && <th className="text-left px-2 py-1.5 font-bold">Κατ.</th>}
                {hasTime && <th className="text-right px-2.5 py-1.5 font-bold">Χρόνος</th>}</tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-t border-gray-50 dark:border-[#1E2D4E]">
                  <td className="px-2.5 py-1 font-mono text-gray-500">{shortKey(v.key)}</td>
                  <td className="px-2 py-1 font-bold">{v.what}</td>
                  {hasFlag && (
                    <td className={`px-2 py-1 font-bold ${v.flag === '—' ? 'text-gray-300 dark:text-gray-600' : 'text-primary dark:text-primary-300'}`}>{v.flag}</td>
                  )}
                  {hasTime && (
                    <td className="px-2.5 py-1 text-right text-gray-400">{v.created_at ? fmtTs(v.created_at) : '—'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** WHO of the verified voters took part — the electoral-roll view. On purpose
 *  there is NO timestamp column anywhere (none is stored) and the order is
 *  alphabetical: the list can never be paired with the hashed ballot rows. */
function Participants({ rows, residentByUser }: { rows: ParticipantRow[]; residentByUser: Map<string, boolean> }) {
  const [show, setShow] = useState(false);
  if (rows.length === 0) return null;
  return (
    <div className="mt-2">
      <button onClick={() => setShow((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <Users size={12} />
        {show ? 'Απόκρυψη' : 'Εμφάνιση'} συμμετεχόντων — {rows.length} επαληθευμένοι
      </button>
      {show && (
        <>
          <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-[#1E2D4E]">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-gray-50 dark:bg-[#0F1219] text-gray-400">
                <tr><th className="text-left px-2.5 py-1.5 font-bold">Email</th>
                  <th className="text-left px-2 py-1.5 font-bold">Δημοτολόγιο</th>
                  <th className="text-right px-2.5 py-1.5 font-bold">Μέσω</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-gray-50 dark:border-[#1E2D4E]">
                    <td className="px-2.5 py-1 text-gray-600 dark:text-gray-300">{p.email}</td>
                    <td className={`px-2 py-1 font-bold ${residentByUser.get(p.user_id) ? 'text-primary dark:text-primary-300' : 'text-gray-300 dark:text-gray-600'}`}>
                      {residentByUser.get(p.user_id) ? '🏛 Δημότης' : '—'}
                    </td>
                    <td className="px-2.5 py-1 text-right font-bold text-gray-500">
                      {p.verified_via === 'govgr' ? 'gov.gr' : 'email'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Η λίστα δείχνει ΠΟΙΟΙ συμμετείχαν, ποτέ τι ψήφισαν. Δεν αποθηκεύεται χρονοσήμανση συμμετοχής —
            έτσι δεν μπορεί να αντιστοιχηθεί με τις κρυπτογραφημένες ψήφους.
          </p>
        </>
      )}
    </div>
  );
}

// ── Vetos ────────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
const WEEKDAY_SHORT = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σά', 'Κυ'];

/** Weekly veto. Rows carry ONLY the weekday (1–7) — the table holds exactly
 *  the current week (a workflow wipes it every Monday 03:00 Athens), so
 *  "active" is simply the distinct confirmed voters in the table. MAIN
 *  number: active over the registry's confirmed Δημότες, as Ενεργά X/Y
 *  (bottom-left) and the percentage (bottom-right). Crossing each 10% step
 *  also fires a local notification (the emailed alert is the hourly GitHub
 *  workflow). */
function VetoCard({ vetos, confirmedCitizens }: { vetos: VetoRow[]; confirmedCitizens: number }) {
  const [open, setOpen] = useState(false);
  const week = vetoWeek();

  const { active, others, perDay } = useMemo(() => {
    const distinct = latestPerVoter(vetos); // one row per voter
    const residents = distinct.filter((v) => v.official_resident !== null);
    const dayCounts = new Array(7).fill(0) as number[];
    for (const v of residents) {
      if (v.day >= 1 && v.day <= 7) dayCounts[v.day - 1] += 1;
    }
    let acc = 0;
    const cumulative = dayCounts.map((n) => (acc += n));
    return { active: residents.length, others: distinct.length - residents.length, perDay: cumulative };
  }, [vetos]);

  const pct = confirmedCitizens > 0 ? Math.round((active / confirmedCitizens) * 100) : 0;

  // One local notification per 10% step per week, on the mayor's own device.
  useEffect(() => {
    maybeNotifyVetoStep(week, pct, active, confirmedCitizens);
  }, [week, pct, active, confirmedCitizens]);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
          <ShieldAlert size={19} className="text-red-500" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[15px]">Βέτο πολιτών</p>
          <p className="text-[12px] text-gray-400">
            Εβδομάδα από {new Date(week + 'T00:00:00').toLocaleDateString('el-GR')} · μηδενίζεται κάθε Δευτέρα 03:00
            {others > 0 && <> · +{others} εγγραφές εκτός δημοτολογίου</>}
          </p>
        </div>
        <button onClick={() => setOpen((v) => !v)} title="Καταχωρίσεις & γράφημα"
          className="px-2 py-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A]">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          <VetoGraph perDay={perDay} week={week} />
          <RawRows rows={vetos.map((e) => ({
            id: e.id, key: e.voter_key,
            what: `ΒΕΤΟ · ${WEEKDAY_SHORT[(e.day - 1 + 7) % 7]}`,
            flag: e.official_resident === true ? 'G' : e.official_resident === false ? 'Δ' : '—',
          }))} />
        </div>
      )}

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[15px] font-black text-gray-700 dark:text-gray-200">
          Ενεργά: <span className="text-red-500">{active}</span>/{confirmedCitizens}
        </p>
        <p className="text-3xl font-black text-red-500 leading-none">{pct}%</p>
      </div>
    </Card>
  );
}

/** Interactive per-day graph of the active vetos (cumulative, Δημότες only).
 *  Hover/tap a bar for the exact value. The period switcher is ready for
 *  months & years — that history begins accumulating once the weekly archive
 *  to the private git repo ships (a future version); until then only the
 *  current week exists, and the other views say so honestly. */
function VetoGraph({ perDay, week }: { perDay: number[]; week: string }) {
  const [view, setView] = useState<'week' | 'month' | 'year'>('week');
  const [hover, setHover] = useState<number | null>(null);
  const todayIdx = Math.min(6, Math.max(0, Math.round(
    (Date.now() - Date.parse(week + 'T00:00:00Z')) / 86400000)));
  const max = Math.max(1, ...perDay);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
          Ενεργά ανά ημέρα (αθροιστικά)
          {hover !== null && view === 'week' && (
            <span className="ml-2 text-red-500">{WEEKDAY_LABELS[hover]}: {perDay[hover]}</span>
          )}
        </p>
        <AnimatedSegmented
          size="sm"
          options={[
            { key: 'week', label: 'Εβδομάδα' },
            { key: 'month', label: 'Μήνας' },
            { key: 'year', label: 'Έτος' },
          ]}
          value={view}
          onChange={(k) => setView(k as 'week' | 'month' | 'year')}
        />
      </div>
      {view === 'week' ? (
        <div className="flex items-end gap-1.5 h-24">
          {perDay.map((n, i) => {
            const future = i > todayIdx;
            return (
              <button key={i} type="button"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                title={future ? 'Δεν έχει έρθει ακόμη' : `${WEEKDAY_LABELS[i]}: ${n} ενεργά`}
                className="flex-1 flex flex-col items-center gap-1 min-w-0 cursor-default">
                <div className="w-full flex-1 flex items-end">
                  <div className={`w-full rounded-t transition-colors ${
                    future ? '' : hover === i ? 'bg-red-600' : n > 0 ? 'bg-red-500' : 'bg-gray-200 dark:bg-[#252A3A]'}`}
                    style={{ height: future ? 0 : `${Math.max(n > 0 ? 12 : 4, (n / max) * 100)}%` }} />
                </div>
                <span className={`text-[9.5px] font-bold ${i === todayIdx ? 'text-red-500' : 'text-gray-400'}`}>
                  {WEEKDAY_SHORT[i]}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="h-24 flex items-center justify-center text-center text-[11.5px] text-gray-400 px-4">
          Το ιστορικό ανά {view === 'month' ? 'μήνα' : 'έτος'} θα γεμίζει από το εβδομαδιαίο αρχείο στο
          ιδιωτικό αποθετήριο (επόμενη έκδοση) — προς το παρόν υπάρχει μόνο η τρέχουσα εβδομάδα.
        </p>
      )}
    </div>
  );
}

// ── Votes for the bundled (pre-backend) polls ────────────────────────────────

function OtherPollResults({ votes, participants, results, residentByUser, knownIds, onSetPublished }: {
  votes: VoteRow[]; participants: ParticipantRow[]; results: ResultRow[];
  residentByUser: Map<string, boolean>; knownIds: string[];
  onSetPublished: (pollId: string, publish: boolean, snapshot?: ReturnType<typeof buildSnapshot>) => void;
}) {
  const other = votes.filter((v) => !knownIds.includes(v.poll_id));
  const pollIds = Array.from(new Set(other.map((v) => v.poll_id)));
  if (pollIds.length === 0) return null;
  return (
    <div className="space-y-2.5">
      <h3 className="font-black text-[14px] text-gray-500 dark:text-gray-400 mt-2">Ενσωματωμένες ψηφοφορίες</h3>
      {pollIds.map((pid) => {
        const rows = other.filter((v) => v.poll_id === pid);
        const bundled = pollsData.find((p) => p.id === pid);
        const options: OptionDef[] = bundled
          ? bundled.options.map((o) => ({ id: o.id, el: o.text.el, en: o.text.en }))
          : Array.from(new Set(rows.map((v) => v.option_id))).map((id) => ({ id, el: id, en: id }));
        const titleEl = bundled ? bundled.title.el : pid;
        const titleEn = bundled ? bundled.title.en : pid;
        const result = results.find((x) => x.poll_id === pid);
        return (
          <Card key={pid} className="p-4">
            <div className="flex items-center gap-2">
              <p className="font-bold text-[13.5px] flex-1 min-w-0">{titleEl}</p>
              <PublishResultBtn published={Boolean(result?.published)}
                onToggle={() => onSetPublished(pid, !result?.published, buildSnapshot(titleEl, titleEn, options, rows))}
                onRefresh={() => onSetPublished(pid, true, buildSnapshot(titleEl, titleEn, options, rows))} />
            </div>
            {result?.published && (
              <p className="text-[10.5px] font-semibold text-emerald-600 mt-1">
                Στην αρχική σελίδα (ενημ. {fmtTs(result.updated_at)})
              </p>
            )}
            <Tally options={options} current={latestPerVoter(rows)} allRows={rows} />
            <Participants rows={participants.filter((p) => p.poll_id === pid)} residentByUser={residentByUser} />
          </Card>
        );
      })}
    </div>
  );
}

function Bi({ label, el, en, onEl, onEn, textarea, rows }: {
  label: string; el: string; en: string;
  onEl: (v: string) => void; onEn: (v: string) => void;
  textarea?: boolean; rows?: number;
}) {
  return (
    <Field label={label}>
      <div className="grid sm:grid-cols-2 gap-2">
        {textarea ? (
          <>
            <textarea value={el} onChange={(e) => onEl(e.target.value)} placeholder="Ελληνικά" rows={rows} className={inputCls} />
            <textarea value={en} onChange={(e) => onEn(e.target.value)} placeholder="English (προαιρετικό)" rows={rows} className={inputCls} />
          </>
        ) : (
          <>
            <input value={el} onChange={(e) => onEl(e.target.value)} placeholder="Ελληνικά" className={inputCls} />
            <input value={en} onChange={(e) => onEn(e.target.value)} placeholder="English (προαιρετικό)" className={inputCls} />
          </>
        )}
      </div>
    </Field>
  );
}
