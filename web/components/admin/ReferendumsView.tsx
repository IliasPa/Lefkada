'use client';

/**
 * Referendum management: title, short/medium/large explanation texts, options,
 * end date/time, optional PDF (uploaded to the public 'docs' bucket) and
 * YouTube id. Publishing makes it appear in the app's Profile ▸ Active votings.
 *
 * v1.4: who-voted and what-was-chosen are stored apart so nobody can find who
 * voted what. `referendums_participants` records WHO voted (its
 * unique(poll_id, user_id) is also the one-vote gate); `referendums_results`
 * holds the choice as counts only (option index + residency + votes). The donut
 * + bars read the results with municipal-roll Δημότες as the MAIN statistic;
 * there is no per-voter ballot anywhere. The Ψηφοφόροι subtab is the citizen
 * registry where the mayor designates Δημότες; the participation registry lists
 * WHO took part (ΑΦΜ or email). The 🏠 toggle sets referendums.results_published,
 * which reveals a poll's LIVE results inside the voting section. Vetos store
 * only (veto_date, voter_key).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff, FileText, Home, Landmark,
  Pencil, Plus, ShieldAlert, Trash2, UserCheck, Users, Vote, X,
} from 'lucide-react';
import { pollsData } from '@/data/voting';
import { getSupabase } from '@/lib/supabase';
import { vetoWeek, athensToday } from '@/lib/backend';
import { maybeNotifyVetoStep } from '@/lib/notify';
import AnimatedSegmented from '@/components/AnimatedSegmented';
import { Card, Field, GhostBtn, PrimaryBtn, inputCls } from './AdminShell';

interface RefRow {
  id: string;
  created_at: string;
  updated_at: string;
  title_el: string; title_en: string;
  small_el: string; small_en: string;
  medium_el: string; medium_en: string;
  large_el: string; large_en: string;
  pdf_url: string;
  youtube_id: string;
  options: { id: string; el: string; en: string }[];
  ends_at: string;
  published: boolean;
  /** The 🏠 toggle: results visible to citizens in the voting section. */
  results_published: boolean;
}

/** The choice, aggregated only — never tied to a voter. option_id is the
 *  0-based ballot index. */
interface TallyRow { poll_id: string; option_id: number; residency: boolean; votes: number; }
/** Confirmed Δημότες only (no residency column — a non-Δημότης can't insert).
 *  veto_date = the Athens day the veto was cast. */
interface VetoRow { veto_date: string; voter_key: string; }
/** WHO took part. A filled tax_number means gov.gr-verified. */
interface ParticipantRow {
  id: string; poll_id: string; user_id: string; email: string; tax_number: string;
}
interface CitizenRow {
  user_id: string; email: string; full_name: string; tax_number: string;
  resident: boolean; resident_set_at: string | null; updated_at: string;
}

type OptionDef = { id: string; el: string; en: string };

const shortKey = (k: string) => k.slice(0, 10) + '…';

/** One colour per option — donut segments and bars stay in sync. */
const PALETTE = ['#0D5EAF', '#E4802C', '#16A34A', '#DC2626', '#7C3AED', '#0891B2'];

/** Per-option counts (all vs. confirmed Δημότες) read from referendums_results.
 *  The row's option_id is the option's ballot index. */
function countsFor(tallies: TallyRow[], index: number) {
  const rows = tallies.filter((t) => t.option_id === index);
  const all = rows.reduce((a, t) => a + t.votes, 0);
  const resident = rows.filter((t) => t.residency).reduce((a, t) => a + t.votes, 0);
  return { all, resident };
}

const EMPTY: Omit<RefRow, 'id' | 'created_at' | 'updated_at' | 'results_published'> = {
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
  const [tallies, setTallies] = useState<TallyRow[]>([]);
  const [vetoEvents, setVetoEvents] = useState<VetoRow[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [citizens, setCitizens] = useState<CitizenRow[]>([]);
  const [sub, setSub] = useState<'polls' | 'voters'>('polls');

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('referendums').select('*').order('created_at', { ascending: false });
    setRows((data as RefRow[]) ?? []);
    // Everything stored server-side (mayor-only via RLS). The choice lives only
    // as aggregate counts — no per-voter ballot exists.
    const { data: tl } = await sb.from('referendums_results').select('poll_id, option_id, residency, votes').limit(10000);
    setTallies((tl as TallyRow[]) ?? []);
    const { data: ve } = await sb.from('vetos').select('veto_date, voter_key').order('veto_date').limit(10000);
    setVetoEvents((ve as VetoRow[]) ?? []);
    // Alphabetical on purpose — NOT insertion order.
    const { data: pp } = await sb.from('referendums_participants').select('*').order('email').limit(10000);
    setParticipants((pp as ParticipantRow[]) ?? []);
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

  /** The 🏠 toggle: reveal/hide a referendum's live results in the voting
   *  section (referendums.results_published). Counts are read live from
   *  referendums_results, so there is nothing to "refresh". */
  const setResultsPublished = useCallback(async (refId: string, publish: boolean) => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('referendums')
      .update({ results_published: publish, updated_at: new Date().toISOString() })
      .eq('id', refId);
    if (error) alert('Σφάλμα: ' + error.message);
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
                return (
                  <RefCard key={r.id} r={r}
                    tallies={tallies.filter((t) => t.poll_id === pid)}
                    participants={participants.filter((p) => p.poll_id === pid)}
                    residentByUser={residentByUser}
                    onPublishToggle={() => setResultsPublished(r.id, !r.results_published)}
                    onToggle={() => togglePublish(r)} onEdit={() => setEditing(r)} onRemove={() => remove(r)} />
                );
              })}
            </div>
          )}

          <OtherPollResults tallies={tallies} participants={participants}
            residentByUser={residentByUser}
            knownIds={rows.map((r) => `ref_${r.id}`)} />
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

function RefCard({ r, tallies, participants, residentByUser, onPublishToggle, onToggle, onEdit, onRemove }: {
  r: RefRow; tallies: TallyRow[]; participants: ParticipantRow[];
  residentByUser: Map<string, boolean>;
  onPublishToggle: () => void; onToggle: () => void; onEdit: () => void; onRemove: () => void;
}) {
  const ended = new Date(r.ends_at).getTime() < Date.now();
  // Turnout is derived from the aggregate results (one vote per voter → the sum
  // of all option counts is the voter count).
  const totalVoters = tallies.reduce((a, t) => a + t.votes, 0);
  const residents = tallies.filter((t) => t.residency).reduce((a, t) => a + t.votes, 0);
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
        <PublishResultBtn published={r.results_published} onToggle={onPublishToggle} />
        <GhostBtn onClick={onToggle} title={r.published ? 'Απόσυρση' : 'Δημοσίευση'}>
          {r.published ? <EyeOff size={14} /> : <Eye size={14} />}
        </GhostBtn>
        <GhostBtn onClick={onEdit} title="Επεξεργασία"><Pencil size={14} /></GhostBtn>
        <GhostBtn danger onClick={onRemove} title="Διαγραφή"><Trash2 size={14} /></GhostBtn>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-gray-600 dark:text-gray-300">
        <Vote size={13} className="text-primary dark:text-primary-300" />
        Αποτελέσματα — {totalVoters} ψηφοφόροι ({residents} δημότες)
      </div>
      <Tally options={r.options} tallies={tallies} />
      <Participants rows={participants} residentByUser={residentByUser} />
    </Card>
  );
}

/** Toggle whether this poll's results are visible to citizens in the voting
 *  section (live). Green when on. */
function PublishResultBtn({ published, onToggle }: { published: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      title={published ? 'Απόκρυψη αποτελεσμάτων από την ψηφοφορία' : 'Εμφάνιση αποτελεσμάτων στην ψηφοφορία (ζωντανά)'}
      className={`px-3 py-2 rounded-xl text-[12px] font-bold active:scale-95 transition-all ${
        published
          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A]'
      }`}>
      <Home size={14} />
    </button>
  );
}

/** Always-on donut + bars per option from the aggregated tallies. A toggle
 *  picks the MAIN metric — confirmed Δημότες or all accounts — and the thin
 *  grey bar under each option always shows the OTHER one. */
function Tally({ options, tallies }: {
  options: OptionDef[]; tallies: TallyRow[];
}) {
  const [view, setView] = useState<'residents' | 'all'>('residents');
  const counts = options.map((_, i) => countsFor(tallies, i));
  const totalAll = counts.reduce((a, c) => a + c.all, 0);
  const totalRes = counts.reduce((a, c) => a + c.resident, 0);
  const showResidents = view === 'residents';
  const mainTotal = showResidents ? totalRes : totalAll;
  const otherTotal = showResidents ? totalAll : totalRes;
  const mainOf = (i: number) => (showResidents ? counts[i].resident : counts[i].all);
  const otherOf = (i: number) => (showResidents ? counts[i].all : counts[i].resident);

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-end">
        <AnimatedSegmented
          size="sm"
          options={[
            { key: 'residents', label: `🏛 Δημότες (${totalRes})` },
            { key: 'all', label: `Όλοι (${totalAll})` },
          ]}
          value={view}
          onChange={(k) => setView(k as 'residents' | 'all')}
        />
      </div>
      <div className="flex items-center gap-4">
        <Donut
          segments={options.map((_, i) => ({ value: mainOf(i), color: PALETTE[i % PALETTE.length] }))}
          centerLabel={String(mainTotal)}
          centerSub={showResidents ? 'δημότες' : 'σύνολο'}
        />
        <div className="flex-1 min-w-0 space-y-2">
          {options.map((o, i) => {
            const nMain = mainOf(i);
            const nOther = otherOf(i);
            const pctMain = mainTotal ? Math.round((nMain / mainTotal) * 100) : 0;
            const pctOther = otherTotal ? Math.round((nOther / otherTotal) * 100) : 0;
            return (
              <div key={o.id}>
                <div className="flex justify-between text-[12px] mb-0.5 gap-2">
                  <span className="font-semibold min-w-0 truncate">
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                    {o.id.toUpperCase()}. {o.el}
                  </span>
                  <span className="font-black flex-shrink-0">
                    {nMain} · {pctMain}%
                    <span className="font-semibold text-gray-400"> ({nOther})</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-[#252A3A] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pctMain}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                </div>
                <div className="h-1 rounded-full bg-gray-50 dark:bg-[#1A2035] overflow-hidden mt-0.5"
                  title={`${showResidents ? 'Όλοι οι λογαριασμοί' : 'Δημότες'}: ${nOther} (${pctOther}%)`}>
                  <div className="h-full rounded-full bg-gray-300 dark:bg-[#3A4155]" style={{ width: `${pctOther}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-gray-400">
            Κύρια μπάρα: {showResidents ? 'επιβεβαιωμένοι δημότες' : 'όλοι οι λογαριασμοί'} · γκρι: {showResidents ? 'όλοι οι λογαριασμοί' : 'δημότες'}.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[10.5px] font-bold">
        <span className="px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary dark:text-primary-300">🏛 Δημότες: {totalRes}</span>
        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-[#252A3A] text-gray-500 dark:text-gray-400">Σύνολο ψηφοφόρων: {totalAll}</span>
      </div>
      <p className="text-[10px] text-gray-400">
        Η ψήφος απαιτεί σύνδεση· ο χαρακτηρισμός «Δημότης» ορίζεται από τον δήμαρχο στην καρτέλα Ψηφοφόροι.
        Αποθηκεύονται μόνο συγκεντρωτικά νούμερα ανά επιλογή — ποτέ ποιος ψήφισε τι.
      </p>
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

/** The exact stored rows — hashed voter and designation flag only (and, for
 *  vetos, the weekday). No choice, no timestamp: transparency that what
 *  Supabase holds can never reveal who voted what. */
function RawRows({ rows }: { rows: { key: string; what?: string; flag?: string }[] }) {
  const [show, setShow] = useState(false);
  if (rows.length === 0) return null;
  const hasFlag = rows.some((r) => r.flag !== undefined);
  const hasWhat = rows.some((r) => r.what !== undefined);
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
                {hasWhat && <th className="text-left px-2 py-1.5 font-bold">Ημέρα</th>}
                {hasFlag && <th className="text-left px-2 py-1.5 font-bold">Κατ.</th>}</tr>
            </thead>
            <tbody>
              {rows.map((v, i) => (
                <tr key={i} className="border-t border-gray-50 dark:border-[#1E2D4E]">
                  <td className="px-2.5 py-1 font-mono text-gray-500">{shortKey(v.key)}</td>
                  {hasWhat && <td className="px-2 py-1 font-bold">{v.what}</td>}
                  {hasFlag && (
                    <td className={`px-2 py-1 font-bold ${v.flag === '—' ? 'text-gray-300 dark:text-gray-600' : 'text-primary dark:text-primary-300'}`}>{v.flag}</td>
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
 *  there is NO timestamp column (none is stored). Shows ΑΦΜ (gov.gr-verified)
 *  falling back to email, plus the municipal-roll designation. */
function Participants({ rows, residentByUser }: {
  rows: ParticipantRow[]; residentByUser: Map<string, boolean>;
}) {
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
                <tr><th className="text-left px-2.5 py-1.5 font-bold">ΑΦΜ</th>
                  <th className="text-right px-2.5 py-1.5 font-bold">Δημοτολόγιο</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-gray-50 dark:border-[#1E2D4E]">
                    <td className="px-2.5 py-1 text-gray-600 dark:text-gray-300">
                      {p.tax_number?.trim()
                        ? <span className="font-mono">{p.tax_number.trim()}</span>
                        : (p.email || <span className="italic text-gray-400">—</span>)}
                    </td>
                    <td className={`px-2.5 py-1 text-right font-bold ${residentByUser.get(p.user_id) ? 'text-primary dark:text-primary-300' : 'text-gray-300 dark:text-gray-600'}`}>
                      {residentByUser.get(p.user_id) ? '🏛 Δημότης' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Η λίστα δείχνει ΠΟΙΟΙ συμμετείχαν, ποτέ τι ψήφισαν — η επιλογή αποθηκεύεται μόνο ως
            συγκεντρωτικό νούμερο, χωρίς καμία σύνδεση με τον ψηφοφόρο. ΑΦΜ εμφανίζεται μόνο όταν έχει
            επιβεβαιωθεί μέσω gov.gr.
          </p>
        </>
      )}
    </div>
  );
}

// ── Vetos ────────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
const WEEKDAY_SHORT = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σά', 'Κυ'];

/** 0 = Monday … 6 = Sunday, for a 'YYYY-MM-DD' date. */
function weekdayIdx(dateStr: string): number {
  return (new Date(dateStr + 'T00:00:00Z').getUTCDay() + 6) % 7;
}

interface VetoDay { date: string; count: number; idx: number }

/** Rolling 7-day veto. A veto stays active for 7 days from the day it was cast;
 *  there is no weekly reset. "active" = distinct vetos in the last 7 days. MAIN
 *  number: active over the registry's confirmed Δημότες, as Ενεργά X/Y
 *  (bottom-left) and the percentage (bottom-right). Crossing each 10% step
 *  fires a local notification (the emailed alert is the hourly GitHub workflow). */
function VetoCard({ vetos, confirmedCitizens }: { vetos: VetoRow[]; confirmedCitizens: number }) {
  const [open, setOpen] = useState(false);
  const week = vetoWeek(); // cadence key for the 10%-step notification only

  // The last 7 Athens days (index 6 = today); each day counts who STARTED
  // their veto that day.
  const { active, days } = useMemo(() => {
    const base = Date.parse(athensToday() + 'T00:00:00Z');
    const list: VetoDay[] = Array.from({ length: 7 }, (_, k) => {
      const date = new Date(base - (6 - k) * 86400000).toISOString().slice(0, 10);
      return { date, count: vetos.filter((v) => v.veto_date === date).length, idx: weekdayIdx(date) };
    });
    return { active: list.reduce((a, d) => a + d.count, 0), days: list };
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
            Τελευταίες 7 ημέρες · κάθε βέτο ισχύει για 7 ημέρες από την υποβολή
          </p>
        </div>
        <button onClick={() => setOpen((v) => !v)} title="Καταχωρίσεις & γράφημα"
          className="px-2 py-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A]">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          <VetoGraph days={days} />
          <RawRows rows={vetos.map((e) => ({
            key: e.voter_key,
            what: WEEKDAY_SHORT[weekdayIdx(e.veto_date)],
            flag: '🏛',
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

/** Interactive graph: how many Δημότες STARTED their veto on each of the last
 *  7 days (index 6 = today). Hover/tap a bar for the exact value. The period
 *  switcher is ready for months & years — that history begins accumulating
 *  once the weekly archive to the private git repo ships (a future version). */
function VetoGraph({ days }: { days: VetoDay[] }) {
  const [view, setView] = useState<'week' | 'month' | 'year'>('week');
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
          Νέα βέτο ανά ημέρα (7 ημέρες)
          {hover !== null && view === 'week' && (
            <span className="ml-2 text-red-500">{WEEKDAY_LABELS[days[hover].idx]}: {days[hover].count}</span>
          )}
        </p>
        <AnimatedSegmented
          size="sm"
          options={[
            { key: 'week', label: '7 ημέρες' },
            { key: 'month', label: 'Μήνας' },
            { key: 'year', label: 'Έτος' },
          ]}
          value={view}
          onChange={(k) => setView(k as 'week' | 'month' | 'year')}
        />
      </div>
      {view === 'week' ? (
        <div className="flex items-end gap-1.5 h-24">
          {days.map((d, i) => (
            <button key={d.date} type="button"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)} onBlur={() => setHover(null)}
              title={`${WEEKDAY_LABELS[d.idx]} ${new Date(d.date + 'T00:00:00').toLocaleDateString('el-GR')}: ${d.count} νέα βέτο`}
              className="flex-1 flex flex-col items-center gap-1 min-w-0 cursor-default">
              <div className="w-full flex-1 flex items-end">
                <div className={`w-full rounded-t transition-colors ${
                  hover === i ? 'bg-red-600' : d.count > 0 ? 'bg-red-500' : 'bg-gray-200 dark:bg-[#252A3A]'}`}
                  style={{ height: `${Math.max(d.count > 0 ? 12 : 4, (d.count / max) * 100)}%` }} />
              </div>
              <span className={`text-[9.5px] font-bold ${i === 6 ? 'text-red-500' : 'text-gray-400'}`}>
                {WEEKDAY_SHORT[d.idx]}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="h-24 flex items-center justify-center text-center text-[11.5px] text-gray-400 px-4">
          Το ιστορικό ανά {view === 'month' ? 'μήνα' : 'έτος'} θα γεμίζει από το εβδομαδιαίο αρχείο στο
          ιδιωτικό αποθετήριο (επόμενη έκδοση) — προς το παρόν υπάρχουν μόνο οι τελευταίες 7 ημέρες.
        </p>
      )}
    </div>
  );
}

// ── Results for the bundled (pre-backend) polls — read-only ──────────────────

function OtherPollResults({ tallies, participants, residentByUser, knownIds }: {
  tallies: TallyRow[]; participants: ParticipantRow[];
  residentByUser: Map<string, boolean>; knownIds: string[];
}) {
  const pollIds = Array.from(new Set(tallies.map((t) => t.poll_id).filter((pid) => !knownIds.includes(pid))));
  if (pollIds.length === 0) return null;
  return (
    <div className="space-y-2.5">
      <h3 className="font-black text-[14px] text-gray-500 dark:text-gray-400 mt-2">Ενσωματωμένες ψηφοφορίες</h3>
      {pollIds.map((pid) => {
        const pollTallies = tallies.filter((t) => t.poll_id === pid);
        const bundled = pollsData.find((p) => p.id === pid);
        const options: OptionDef[] = bundled
          ? bundled.options.map((o) => ({ id: o.id, el: o.text.el, en: o.text.en }))
          : Array.from(new Set(pollTallies.map((t) => t.option_id))).sort((a, b) => a - b)
              .map((i) => ({ id: String(i), el: `Επιλογή ${i + 1}`, en: `Option ${i + 1}` }));
        return (
          <Card key={pid} className="p-4">
            <p className="font-bold text-[13.5px]">{bundled ? bundled.title.el : pid}</p>
            <Tally options={options} tallies={pollTallies} />
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
