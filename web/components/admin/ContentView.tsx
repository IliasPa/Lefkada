'use client';

/**
 * Generic managed-content editor (KindManager). Every kind is stored in the
 * `content` table as { kind, data } where `data` is exactly the JSON shape the
 * public app consumes. Each admin tab composes a KindManager with its own
 * kind specs. Field specs support: side-by-side layout (`half`), defaults,
 * time inputs, dependent dropdowns (`optionsFrom`), mutually-exclusive selects
 * (`clears`), button groups, PDF upload, and a `beforeSave` derivation hook.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, FileText, Pencil, Plus, Trash2, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { waterAnalyses } from '@/data/water';
import { Card, Field, GhostBtn, PrimaryBtn, inputCls } from './AdminShell';

export type Kind =
  | 'alert' | 'job' | 'event' | 'decision' | 'tender' | 'bylaw'
  | 'consultation' | 'council' | 'budget' | 'water' | 'lesson' | 'competition';

interface ContentRow {
  id: string;
  created_at: string;
  kind: Kind;
  data: Record<string, unknown>;
  published: boolean;
}

type Opt = { v: string; l: string };

interface BaseField {
  key: string;
  label: string;
  optional?: boolean;
  /** Render at half width — consecutive `half` fields share one row. */
  half?: boolean;
  /** Initial value for new entries. */
  default?: string | number;
}
type FieldSpec =
  | (BaseField & { type: 'text' | 'date' | 'time' | 'url' | 'number' })
  | (BaseField & {
      type: 'select';
      options?: Opt[];
      /** Dynamic options depending on the other values (dependent dropdowns). */
      optionsFrom?: (data: Record<string, unknown>) => Opt[];
      /** Keys reset when this value changes (mutually-exclusive selects). */
      clears?: string[];
    })
  /** A small set of choices rendered as buttons instead of a dropdown. */
  | (BaseField & { type: 'buttons'; options: Opt[] })
  | (BaseField & { type: 'bi' | 'bi-ta' })
  /** PDF: upload to the public docs bucket OR paste a URL — stored as a URL string. */
  | (BaseField & { type: 'pdf' });

export interface KindSpec {
  kind: Kind;
  label: string;
  fields: FieldSpec[] | 'json';
  jsonTemplate?: string;
  /** Derive/validate before insert — mutate `data`, return an error string or null. */
  beforeSave?: (data: Record<string, unknown>) => string | null;
}

const THIS_YEAR = new Date().getFullYear();

const MONTH_NAMES = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
  'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
const MONTH_OPTS_OPTIONAL: Opt[] = [{ v: '', l: '— μήνας —' }, ...MONTH_NAMES.map((l, i) => ({ v: String(i + 1), l }))];
const MONTH_OPTS_REQUIRED: Opt[] = [{ v: '', l: '— επιλέξτε μήνα —' }, ...MONTH_NAMES.map((l, i) => ({ v: String(i + 1), l }))];

// Municipal units / communities from the bundled water data (union across years).
const WATER_UNITS: Opt[] = Array.from(
  new Set(waterAnalyses.flatMap((y) => y.units.map((u) => u.name.el))),
).map((el) => ({ v: el, l: el }));

function waterCommunitiesOf(unitEl: string): Opt[] {
  const names = new Set<string>();
  for (const y of waterAnalyses) {
    for (const u of y.units) {
      if (u.name.el !== unitEl) continue;
      for (const c of u.communities) names.add(c.name.el);
    }
  }
  return [
    { v: '', l: '— επιλέξτε κοινότητα —' },
    ...Array.from(names).sort((a, b) => a.localeCompare(b, 'el')).map((el) => ({ v: el, l: el })),
  ];
}

// ── Kind specs, grouped per admin tab ────────────────────────────────────────

export const ALERT_KIND: KindSpec = {
  kind: 'alert', label: 'Ειδοποιήσεις κινδύνου ⚠️',
  fields: [
    { key: 'type', label: 'Τύπος', type: 'buttons', options: [
      { v: 'water', l: '💧 Νερό' }, { v: 'electricity', l: '⚡ Ρεύμα' }, { v: 'fire', l: '🔥 Φωτιά' },
      { v: 'weather', l: '🌧️ Καιρός' }, { v: 'road', l: '🚧 Δρόμοι' }], default: 'water' },
    { key: 'area', label: 'Περιοχή', type: 'bi' },
    { key: 'time', label: 'Πότε ισχύει', type: 'bi' },
    { key: 'message', label: 'Μήνυμα', type: 'bi-ta' },
  ],
};

export const JOB_KIND: KindSpec = {
  kind: 'job', label: 'Αγγελίες θέσεων',
  fields: [
    { key: 'title', label: 'Τίτλος θέσης', type: 'bi' },
    { key: 'company', label: 'Φορέας / εταιρεία', type: 'bi' },
    { key: 'description', label: 'Περιγραφή', type: 'bi-ta' },
    { key: 'location', label: 'Τοποθεσία', type: 'text' },
    { key: 'employmentType', label: 'Απασχόληση', type: 'select', half: true, options: [
      { v: 'Full-time', l: 'Πλήρης' }, { v: 'Part-time', l: 'Μερική' }, { v: 'Seasonal', l: 'Εποχική' }, { v: 'Contract', l: 'Σύμβαση' }] },
    { key: 'workMode', label: 'Τρόπος εργασίας', type: 'select', half: true, options: [
      { v: 'On-site', l: 'Με φυσική παρουσία' }, { v: 'Remote', l: 'Εξ αποστάσεως' }, { v: 'Hybrid', l: 'Υβριδικά' }] },
    { key: 'detailsPdf', label: 'PDF προκήρυξης', type: 'pdf', optional: true },
  ],
};

export const EVENT_KIND: KindSpec = {
  kind: 'event', label: 'Εκδηλώσεις',
  fields: [
    { key: 'title', label: 'Τίτλος', type: 'bi' },
    { key: 'category', label: 'Κατηγορία', type: 'select', options: [
      { v: 'Festival', l: 'Φεστιβάλ' }, { v: 'Music', l: 'Μουσική' }, { v: 'Theatre', l: 'Θέατρο' },
      { v: 'Sports', l: 'Αθλητισμός' }, { v: 'Religious', l: 'Θρησκευτικά' }, { v: 'Food', l: 'Γεύση' }, { v: 'Art', l: 'Τέχνη' }] },
    { key: 'date', label: 'Ημερομηνία', type: 'date', half: true },
    { key: 'endDate', label: 'Έως (πολυήμερο)', type: 'date', half: true, optional: true },
    { key: 'time', label: 'Ώρα', type: 'time', half: true, optional: true },
    { key: 'location', label: 'Τοποθεσία', type: 'bi' },
    { key: 'description', label: 'Περιγραφή', type: 'bi-ta' },
    { key: 'pdfUrl', label: 'PDF προγράμματος', type: 'pdf', optional: true },
  ],
};

export const BUDGET_KIND: KindSpec = {
  kind: 'budget', label: 'Δελτία εκτέλεσης προϋπολογισμού',
  fields: [
    { key: 'title', label: 'Τίτλος δελτίου (π.χ. Στατιστικό Δελτίο Σεπτεμβρίου 2026)', type: 'text' },
    { key: 'month', label: 'Μήνας', type: 'select', half: true, optional: true,
      options: MONTH_OPTS_OPTIONAL, clears: ['quarter'] },
    { key: 'quarter', label: '…ή τρίμηνο', type: 'select', half: true, optional: true, clears: ['month'],
      options: [{ v: '', l: '— τρίμηνο —' }, { v: '1', l: 'Α΄ (Q1)' }, { v: '2', l: 'Β΄ (Q2)' }, { v: '3', l: 'Γ΄ (Q3)' }, { v: '4', l: 'Δ΄ (Q4)' }] },
    { key: 'year', label: 'Έτος', type: 'number', half: true, default: THIS_YEAR },
    { key: 'pdfUrl', label: 'PDF δελτίου', type: 'pdf' },
  ],
  // Either a month or a quarter — the report kind follows from the choice.
  beforeSave: (data) => {
    if (data.month) data.kind = 'monthly';
    else if (data.quarter) data.kind = 'quarterly';
    else return 'Επιλέξτε μήνα ή τρίμηνο.';
    return null;
  },
};

export const GOVERNANCE_KINDS: KindSpec[] = [
  {
    kind: 'decision', label: 'Αποφάσεις',
    fields: [
      { key: 't', label: 'Τίτλος απόφασης', type: 'text' },
      { key: 'n', label: 'Αριθμός (π.χ. 261/2026)', type: 'text', half: true },
      { key: 'd', label: 'Ημερομηνία', type: 'date', half: true },
      { key: 'b', label: 'Όργανο', type: 'select', options: [
        { v: 'council', l: 'Δημοτικό Συμβούλιο' }, { v: 'municipal', l: 'Δημοτική Επιτροπή' },
        { v: 'executive', l: 'Εκτελεστική Επιτροπή' }, { v: 'finance', l: 'Οικονομική Επιτροπή' },
        { v: 'qol', l: 'Επιτροπή Ποιότητας Ζωής' }, { v: 'consultation', l: 'Επιτροπή Διαβούλευσης' },
        { v: 'tourism', l: 'Επιτροπή Τουρισμού' }] },
      { key: 'f', label: 'Αρχείο απόφασης', type: 'pdf', optional: true },
    ],
  },
  ...(['tender', 'bylaw', 'consultation'] as const).map((k) => ({
    kind: k as Kind,
    label: k === 'tender' ? 'Διαγωνισμοί' : k === 'bylaw' ? 'Κανονισμοί' : 'Διαβουλεύσεις',
    fields: [
      { key: 'title', label: 'Τίτλος', type: 'bi' },
      { key: 'summary', label: 'Περίληψη', type: 'bi-ta' },
      { key: 'date', label: 'Ημερομηνία', type: 'date', half: true },
      { key: 'deadline', label: 'Προθεσμία', type: 'date', half: true, optional: true },
      { key: 'pdfUrl', label: 'PDF', type: 'pdf', optional: true },
    ] as FieldSpec[],
  })),
  {
    kind: 'council', label: 'Συμβούλιο (JSON)', fields: 'json',
    jsonTemplate: '{\n  "note": "Δομή ελεύθερη — προσωρινή αποθήκευση στοιχείων συμβουλίου"\n}',
  },
];

export const WATER_KIND: KindSpec = {
  kind: 'water', label: 'Αναλύσεις πόσιμου νερού',
  fields: [
    { key: 'year', label: 'Έτος', type: 'number', half: true, default: THIS_YEAR },
    { key: 'month', label: 'Μήνας δειγματοληψίας', type: 'select', half: true, options: MONTH_OPTS_REQUIRED, default: '' },
    { key: 'unit', label: 'Δημοτική ενότητα', type: 'select', half: true, options: WATER_UNITS, clears: ['community'] },
    { key: 'community', label: 'Κοινότητα', type: 'select', half: true, default: '',
      optionsFrom: (data) => waterCommunitiesOf(String(data.unit ?? WATER_UNITS[0]?.v ?? '')) },
    { key: 'type', label: 'Είδος ανάλυσης', type: 'buttons', options: [
      { v: 'micro', l: '🧪 Μικροβιολογική' }, { v: 'physico', l: '📄 Φυσικοχημική' }], default: 'micro' },
    { key: 'url', label: 'PDF ανάλυσης', type: 'pdf' },
  ],
};

const LESSON_CATEGORY_OPTS: Opt[] = [
  { v: 'robotics', l: 'Ρομποτική' }, { v: 'sports', l: 'Αθλητισμός' },
  { v: 'music', l: 'Μουσική' }, { v: 'school', l: 'Σχολική βοήθεια' },
];

export const LESSON_KIND: KindSpec = {
  kind: 'lesson', label: 'Μαθήματα',
  fields: [
    { key: 'category', label: 'Κατηγορία', type: 'buttons', options: LESSON_CATEGORY_OPTS, default: 'robotics' },
    { key: 'title', label: 'Τίτλος', type: 'bi' },
    { key: 'desc', label: 'Περιγραφή', type: 'bi-ta' },
    { key: 'when', label: 'Πότε & πού', type: 'bi', optional: true },
    { key: 'ages', label: 'Ηλικίες (π.χ. 9–15)', type: 'text', optional: true },
  ],
};

export const COMPETITION_KIND: KindSpec = {
  kind: 'competition', label: 'Διαγωνισμοί',
  fields: [
    { key: 'category', label: 'Κατηγορία', type: 'buttons', options: LESSON_CATEGORY_OPTS, default: 'robotics' },
    { key: 'title', label: 'Τίτλος διαγωνισμού', type: 'bi' },
    { key: 'date', label: 'Ημερομηνία ή έτος (π.χ. 2026-05-10 ή 2026)', type: 'text', half: true },
    { key: 'url', label: 'Ιστοσελίδα (URL)', type: 'url', half: true, optional: true },
    { key: 'location', label: 'Τοποθεσία', type: 'bi', optional: true },
    { key: 'past', label: 'Κατάσταση', type: 'buttons', options: [
      { v: 'upcoming', l: 'Επερχόμενος' }, { v: 'past', l: 'Παλαιότερος' }], default: 'upcoming' },
  ],
  beforeSave: (data) => {
    // the app expects a boolean `past` flag
    data.past = data.past === 'past';
    return null;
  },
};

function rowTitle(r: ContentRow): string {
  const d = r.data as Record<string, { el?: string } | string | undefined>;
  const bi = (v?: { el?: string } | string) => (typeof v === 'object' ? v?.el : v);
  return (
    bi(d.title as { el?: string }) || (d.t as string) || bi(d.message as { el?: string }) ||
    (typeof d.community === 'string' ? `${d.community} — ${d.year ?? ''}` : bi(d.community as { el?: string })) ||
    bi(d.area as { el?: string }) ||
    JSON.stringify(r.data).slice(0, 80)
  );
}

// ── The manager ──────────────────────────────────────────────────────────────

export default function KindManager({ kinds, intro, onPublished }: {
  kinds: KindSpec[];
  /** Optional helper line above the list. */
  intro?: string;
  /** Called after a row is saved-as-published or toggled to published. */
  onPublished?: (kind: Kind, data: Record<string, unknown>, isNew: boolean) => void;
}) {
  const [kind, setKind] = useState<Kind>(kinds[0].kind);
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [editing, setEditing] = useState<{ id?: string; data: Record<string, unknown>; published: boolean } | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [pdfFiles, setPdfFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);

  const spec = useMemo(() => kinds.find((k) => k.kind === kind) ?? kinds[0], [kind, kinds]);

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('content').select('*').eq('kind', kind).order('created_at', { ascending: false });
    setRows((data as ContentRow[]) ?? []);
  }, [kind]);
  useEffect(() => { setEditing(null); setPdfFiles({}); load(); }, [load]);

  const startNew = () => {
    setPdfFiles({});
    if (spec.fields === 'json') { setJsonText(spec.jsonTemplate ?? '{}'); setEditing({ data: {}, published: true }); return; }
    const data: Record<string, unknown> = {};
    for (const f of spec.fields) {
      if (f.default !== undefined) data[f.key] = f.default;
      else if (f.type === 'bi' || f.type === 'bi-ta') data[f.key] = { el: '', en: '' };
      else if (f.type === 'select' || f.type === 'buttons') data[f.key] = ('options' in f && f.options?.[0]?.v) || '';
      else data[f.key] = '';
    }
    setEditing({ data, published: true });
  };

  const startEdit = (r: ContentRow) => {
    setPdfFiles({});
    if (spec.fields === 'json') setJsonText(JSON.stringify(r.data, null, 2));
    setEditing({ id: r.id, data: structuredClone(r.data), published: r.published });
  };

  const save = async () => {
    const sb = getSupabase();
    if (!sb || !editing) return;
    let data = editing.data;
    setBusy(true);

    if (spec.fields === 'json') {
      try { data = JSON.parse(jsonText); } catch { alert('Μη έγκυρο JSON.'); setBusy(false); return; }
    } else {
      // upload any chosen PDF files to the public docs bucket → URL
      for (const f of spec.fields) {
        if (f.type === 'pdf' && pdfFiles[f.key]) {
          const file = pdfFiles[f.key];
          const path = `${kind}/${Date.now()}-${file.name.replace(/[^\w.\-()]+/g, '_')}`;
          const { error: upErr } = await sb.storage.from('docs').upload(path, file, { contentType: 'application/pdf' });
          if (upErr) { alert('Σφάλμα ανεβάσματος PDF: ' + upErr.message); setBusy(false); return; }
          data[f.key] = sb.storage.from('docs').getPublicUrl(path).data.publicUrl;
        }
      }
      // validation + en→el fallback + numbers + drop empty optionals
      for (const f of spec.fields) {
        const v = data[f.key] as { el?: string; en?: string } | string | undefined;
        if (f.type === 'bi' || f.type === 'bi-ta') {
          if (typeof v === 'object' && v) {
            if (!v.el?.trim() && !f.optional) { alert(`Συμπληρώστε: ${f.label}`); setBusy(false); return; }
            if (!v.en?.trim()) v.en = v.el;
          }
        } else if (f.type === 'number') {
          const n = Number(data[f.key]);
          if (!f.optional && !n) { alert(`Συμπληρώστε: ${f.label}`); setBusy(false); return; }
          data[f.key] = n;
        } else if ((f.type === 'select' || f.type === 'buttons') && String(data[f.key] ?? '').match(/^\d+$/)) {
          // numeric select values (month/quarter) → numbers for the app
          data[f.key] = Number(data[f.key]);
        } else if (!f.optional && !String(data[f.key] ?? '').trim()) {
          alert(`Συμπληρώστε: ${f.label}`); setBusy(false); return;
        }
        if (f.optional && !String(data[f.key] ?? '').trim()) delete data[f.key];
      }
      const err = spec.beforeSave?.(data);
      if (err) { alert(err); setBusy(false); return; }
    }

    const { error } = editing.id
      ? await sb.from('content').update({ data, published: editing.published, updated_at: new Date().toISOString() }).eq('id', editing.id)
      : await sb.from('content').insert({ kind, data, published: editing.published });
    setBusy(false);
    if (error) { alert('Σφάλμα: ' + error.message); return; }
    if (editing.published) onPublished?.(kind, data, !editing.id);
    setEditing(null); setPdfFiles({});
    load();
  };

  const remove = async (r: ContentRow) => {
    if (!confirm(`Διαγραφή «${rowTitle(r)}»;`)) return;
    await getSupabase()?.from('content').delete().eq('id', r.id);
    load();
  };

  const togglePublish = async (r: ContentRow) => {
    await getSupabase()?.from('content').update({ published: !r.published }).eq('id', r.id);
    if (!r.published) onPublished?.(r.kind, r.data, false);
    load();
  };

  const setField = (f: FieldSpec, v: unknown) =>
    setEditing((e) => {
      if (!e) return e;
      const next = { ...e.data, [f.key]: v };
      // mutually-exclusive selects (e.g. month vs quarter) + dependent resets
      if ('clears' in f && f.clears && String(v ?? '').trim()) {
        for (const k of f.clears) next[k] = '';
      }
      return { ...e, data: next };
    });

  const renderField = (f: FieldSpec) => {
    if (!editing) return null;
    const v = editing.data[f.key];
    const optLabel = f.optional ? ' (προαιρετικό)' : '';
    if (f.type === 'bi' || f.type === 'bi-ta') {
      const b = (v ?? { el: '', en: '' }) as { el: string; en: string };
      const Tag = f.type === 'bi' ? 'input' : 'textarea';
      return (
        <Field key={f.key} label={f.label + optLabel}>
          <div className="grid sm:grid-cols-2 gap-2">
            <Tag value={b.el} placeholder="Ελληνικά" className={inputCls} rows={3}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(f, { ...b, el: e.target.value })} />
            <Tag value={b.en} placeholder="English (προαιρετικό)" className={inputCls} rows={3}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(f, { ...b, en: e.target.value })} />
          </div>
        </Field>
      );
    }
    if (f.type === 'select') {
      const options = f.optionsFrom ? f.optionsFrom(editing.data) : f.options ?? [];
      return (
        <Field key={f.key} label={f.label + optLabel}>
          <select value={String(v ?? '')} onChange={(e) => setField(f, e.target.value)} className={inputCls}>
            {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </Field>
      );
    }
    if (f.type === 'buttons') {
      return (
        <Field key={f.key} label={f.label + optLabel}>
          <div className="flex flex-wrap gap-2">
            {f.options.map((o) => {
              const active = String(v ?? '') === o.v;
              return (
                <button key={o.v} type="button" onClick={() => setField(f, o.v)} aria-pressed={active}
                  className={`px-3.5 py-2 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${
                    active ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
                           : 'bg-white dark:bg-[#0F1219] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#3A4155]'}`}>
                  {o.l}
                </button>
              );
            })}
          </div>
        </Field>
      );
    }
    if (f.type === 'pdf') {
      return (
        <Field key={f.key} label={f.label + optLabel}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <input type="file" accept="application/pdf" className="text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPdfFiles((p) => {
                    const next = { ...p };
                    if (file) next[f.key] = file; else delete next[f.key];
                    return next;
                  });
                }} />
              {!pdfFiles[f.key] && typeof v === 'string' && v && (
                <a href={v} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-primary dark:text-primary-300">
                  <FileText size={13} /> Τρέχον PDF
                </a>
              )}
            </div>
            <input type="url" value={typeof v === 'string' ? v : ''} placeholder="…ή επικολλήστε URL"
              onChange={(e) => setField(f, e.target.value)} className={inputCls} />
          </div>
        </Field>
      );
    }
    return (
      <Field key={f.key} label={f.label + optLabel}>
        <input type={f.type} value={String(v ?? '')} onChange={(e) => setField(f, e.target.value)} className={inputCls} />
      </Field>
    );
  };

  /** Consecutive `half` fields share a two-column row. */
  const renderFields = (fields: FieldSpec[]) => {
    const out: React.ReactNode[] = [];
    let i = 0;
    while (i < fields.length) {
      if (fields[i].half) {
        const group: FieldSpec[] = [];
        while (i < fields.length && fields[i].half && group.length < 2) group.push(fields[i++]);
        out.push(
          <div key={`row-${group[0].key}`} className="grid grid-cols-2 gap-3 items-end">
            {group.map(renderField)}
          </div>,
        );
      } else {
        out.push(renderField(fields[i++]));
      }
    }
    return out;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      {kinds.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {kinds.map((k) => (
            <button key={k.kind} onClick={() => setKind(k.kind)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                kind === k.kind ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]'}`}>
              {k.label}
            </button>
          ))}
        </div>
      )}

      {editing ? (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[15px]">{editing.id ? 'Επεξεργασία' : 'Νέα εγγραφή'} — {spec.label}</h3>
            <GhostBtn onClick={() => setEditing(null)}><X size={16} /></GhostBtn>
          </div>

          {spec.fields === 'json' ? (
            <Field label="JSON δεδομένα">
              <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={12}
                className={`${inputCls} font-mono text-[12px]`} spellCheck={false} />
            </Field>
          ) : (
            renderFields(spec.fields)
          )}

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={editing.published}
              onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
            Δημοσιευμένο (ορατό στην εφαρμογή)
          </label>

          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => setEditing(null)}>Ακύρωση</GhostBtn>
            <PrimaryBtn onClick={save} disabled={busy}>{busy ? 'Αποθήκευση…' : 'Αποθήκευση'}</PrimaryBtn>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-400">{intro ?? `${rows.length} εγγραφές — προστίθενται στα ενσωματωμένα δεδομένα της εφαρμογής`}</p>
            <PrimaryBtn onClick={startNew}><Plus size={13} className="inline mr-1" />Νέα εγγραφή</PrimaryBtn>
          </div>
          {rows.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">Καμία εγγραφή σε αυτή την κατηγορία.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <Card key={r.id} className="p-3.5 flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13.5px] truncate">{rowTitle(r)}</p>
                    <p className="text-[11px] text-gray-400">{new Date(r.created_at).toLocaleDateString('el-GR')}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                    r.published ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-gray-100 dark:bg-[#252A3A] text-gray-400'}`}>
                    {r.published ? 'Δημοσιευμένο' : 'Πρόχειρο'}
                  </span>
                  <GhostBtn onClick={() => togglePublish(r)} title={r.published ? 'Απόσυρση' : 'Δημοσίευση'}>
                    {r.published ? <EyeOff size={14} /> : <Eye size={14} />}
                  </GhostBtn>
                  <GhostBtn onClick={() => startEdit(r)} title="Επεξεργασία"><Pencil size={14} /></GhostBtn>
                  <GhostBtn danger onClick={() => remove(r)} title="Διαγραφή"><Trash2 size={14} /></GhostBtn>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
