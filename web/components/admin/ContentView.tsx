'use client';

/**
 * Generic managed-content editor. Every kind is stored in the `content` table
 * as { kind, data } where `data` is exactly the JSON shape the public app
 * consumes. Simple kinds get real forms; council/budget get a JSON editor.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Eye, EyeOff, Pencil, Plus, Send, Trash2, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { Card, Field, GhostBtn, PrimaryBtn, inputCls } from './AdminShell';

type Kind = 'alert' | 'job' | 'event' | 'decision' | 'tender' | 'bylaw' | 'consultation' | 'council' | 'budget';

interface ContentRow {
  id: string;
  created_at: string;
  kind: Kind;
  data: Record<string, unknown>;
  published: boolean;
}

type FieldSpec =
  | { key: string; label: string; type: 'text' | 'date' | 'url'; optional?: boolean }
  | { key: string; label: string; type: 'select'; options: { v: string; l: string }[] }
  | { key: string; label: string; type: 'bi' | 'bi-ta'; optional?: boolean };

const KINDS: { kind: Kind; label: string; fields: FieldSpec[] | 'json'; jsonTemplate?: string }[] = [
  {
    kind: 'alert', label: 'Ειδοποιήσεις κινδύνου ⚠️',
    fields: [
      { key: 'type', label: 'Τύπος', type: 'select', options: [
        { v: 'water', l: '💧 Νερό' }, { v: 'electricity', l: '⚡ Ρεύμα' }, { v: 'fire', l: '🔥 Φωτιά' },
        { v: 'weather', l: '🌧️ Καιρός' }, { v: 'road', l: '🚧 Δρόμοι' }] },
      { key: 'area', label: 'Περιοχή', type: 'bi' },
      { key: 'time', label: 'Πότε ισχύει', type: 'bi' },
      { key: 'message', label: 'Μήνυμα', type: 'bi-ta' },
    ],
  },
  {
    kind: 'job', label: 'Θέσεις εργασίας',
    fields: [
      { key: 'title', label: 'Τίτλος θέσης', type: 'bi' },
      { key: 'company', label: 'Φορέας / εταιρεία', type: 'bi' },
      { key: 'description', label: 'Περιγραφή', type: 'bi-ta' },
      { key: 'location', label: 'Τοποθεσία', type: 'text' },
      { key: 'employmentType', label: 'Απασχόληση', type: 'select', options: [
        { v: 'Full-time', l: 'Πλήρης' }, { v: 'Part-time', l: 'Μερική' }, { v: 'Seasonal', l: 'Εποχική' }, { v: 'Contract', l: 'Σύμβαση' }] },
      { key: 'workMode', label: 'Τρόπος εργασίας', type: 'select', options: [
        { v: 'On-site', l: 'Με φυσική παρουσία' }, { v: 'Remote', l: 'Εξ αποστάσεως' }, { v: 'Hybrid', l: 'Υβριδικά' }] },
      { key: 'detailsPdf', label: 'PDF προκήρυξης (URL)', type: 'url', optional: true },
    ],
  },
  {
    kind: 'event', label: 'Εκδηλώσεις',
    fields: [
      { key: 'title', label: 'Τίτλος', type: 'bi' },
      { key: 'category', label: 'Κατηγορία', type: 'select', options: [
        { v: 'Festival', l: 'Φεστιβάλ' }, { v: 'Music', l: 'Μουσική' }, { v: 'Theatre', l: 'Θέατρο' },
        { v: 'Sports', l: 'Αθλητισμός' }, { v: 'Religious', l: 'Θρησκευτικά' }, { v: 'Food', l: 'Γεύση' }, { v: 'Art', l: 'Τέχνη' }] },
      { key: 'date', label: 'Ημερομηνία', type: 'date' },
      { key: 'endDate', label: 'Έως (πολυήμερο)', type: 'date', optional: true },
      { key: 'time', label: 'Ώρα (π.χ. 21:00)', type: 'text', optional: true },
      { key: 'location', label: 'Τοποθεσία', type: 'bi' },
      { key: 'description', label: 'Περιγραφή', type: 'bi-ta' },
      { key: 'pdfUrl', label: 'PDF προγράμματος (URL)', type: 'url', optional: true },
    ],
  },
  {
    kind: 'decision', label: 'Αποφάσεις',
    fields: [
      { key: 't', label: 'Τίτλος απόφασης', type: 'text' },
      { key: 'n', label: 'Αριθμός (π.χ. 261/2026)', type: 'text' },
      { key: 'd', label: 'Ημερομηνία', type: 'date' },
      { key: 'b', label: 'Όργανο', type: 'select', options: [
        { v: 'council', l: 'Δημοτικό Συμβούλιο' }, { v: 'municipal', l: 'Δημοτική Επιτροπή' },
        { v: 'executive', l: 'Εκτελεστική Επιτροπή' }, { v: 'finance', l: 'Οικονομική Επιτροπή' },
        { v: 'qol', l: 'Επιτροπή Ποιότητας Ζωής' }, { v: 'consultation', l: 'Επιτροπή Διαβούλευσης' },
        { v: 'tourism', l: 'Επιτροπή Τουρισμού' }] },
      { key: 'f', label: 'Αρχείο απόφασης (URL)', type: 'url', optional: true },
    ],
  },
  ...(['tender', 'bylaw', 'consultation'] as const).map((k) => ({
    kind: k as Kind,
    label: k === 'tender' ? 'Διαγωνισμοί' : k === 'bylaw' ? 'Κανονισμοί' : 'Διαβουλεύσεις',
    fields: [
      { key: 'title', label: 'Τίτλος', type: 'bi' },
      { key: 'summary', label: 'Περίληψη', type: 'bi-ta' },
      { key: 'date', label: 'Ημερομηνία', type: 'date' },
      { key: 'deadline', label: 'Προθεσμία', type: 'date', optional: true },
      { key: 'pdfUrl', label: 'PDF (URL)', type: 'url', optional: true },
    ] as FieldSpec[],
  })),
  {
    kind: 'council', label: 'Συμβούλιο (JSON)', fields: 'json',
    jsonTemplate: '{\n  "note": "Δομή ελεύθερη — προσωρινή αποθήκευση στοιχείων συμβουλίου"\n}',
  },
  {
    kind: 'budget', label: 'Προϋπολογισμός (JSON)', fields: 'json',
    jsonTemplate: '{\n  "year": 2026,\n  "note": "Δομή ελεύθερη — προσωρινή αποθήκευση οικονομικών στοιχείων"\n}',
  },
];

function rowTitle(r: ContentRow): string {
  const d = r.data as Record<string, { el?: string } | string | undefined>;
  const bi = (v?: { el?: string } | string) => (typeof v === 'object' ? v?.el : v);
  return (
    bi(d.title as { el?: string }) || (d.t as string) || bi(d.message as { el?: string }) ||
    bi(d.area as { el?: string }) || JSON.stringify(r.data).slice(0, 80)
  );
}

export default function ContentView({ onSendPush }: { onSendPush: (title: string, body: string) => Promise<string> }) {
  const [kind, setKind] = useState<Kind>('alert');
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [editing, setEditing] = useState<{ id?: string; data: Record<string, unknown>; published: boolean } | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [busy, setBusy] = useState(false);

  const spec = useMemo(() => KINDS.find((k) => k.kind === kind)!, [kind]);

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('content').select('*').eq('kind', kind).order('created_at', { ascending: false });
    setRows((data as ContentRow[]) ?? []);
  }, [kind]);
  useEffect(() => { setEditing(null); load(); }, [load]);

  const startNew = () => {
    if (spec.fields === 'json') { setJsonText(spec.jsonTemplate ?? '{}'); setEditing({ data: {}, published: true }); return; }
    const data: Record<string, unknown> = {};
    for (const f of spec.fields) {
      if (f.type === 'bi' || f.type === 'bi-ta') data[f.key] = { el: '', en: '' };
      else if (f.type === 'select') data[f.key] = f.options[0].v;
      else data[f.key] = '';
    }
    setEditing({ data, published: true });
  };

  const startEdit = (r: ContentRow) => {
    if (spec.fields === 'json') setJsonText(JSON.stringify(r.data, null, 2));
    setEditing({ id: r.id, data: structuredClone(r.data), published: r.published });
  };

  const save = async () => {
    const sb = getSupabase();
    if (!sb || !editing) return;
    let data = editing.data;
    if (spec.fields === 'json') {
      try { data = JSON.parse(jsonText); } catch { alert('Μη έγκυρο JSON.'); return; }
    } else {
      // en falls back to el so the app never shows empty English text
      for (const f of spec.fields) {
        const v = data[f.key] as { el?: string; en?: string } | string | undefined;
        if ((f.type === 'bi' || f.type === 'bi-ta') && typeof v === 'object' && v) {
          if (!v.el?.trim() && !('optional' in f && f.optional)) { alert(`Συμπληρώστε: ${f.label}`); return; }
          if (!v.en?.trim()) v.en = v.el;
        }
      }
      // drop empty optional keys so the stored shape matches the static data
      for (const f of spec.fields) {
        if ('optional' in f && f.optional && !String(data[f.key] ?? '').trim()) delete data[f.key];
      }
    }
    setBusy(true);
    const { error } = editing.id
      ? await sb.from('content').update({ data, published: editing.published, updated_at: new Date().toISOString() }).eq('id', editing.id)
      : await sb.from('content').insert({ kind, data, published: editing.published });
    setBusy(false);
    if (error) { alert('Σφάλμα: ' + error.message); return; }

    // Offer a push notification when a new risk alert goes live
    if (!editing.id && kind === 'alert' && editing.published) {
      const d = data as { area?: { el?: string }; message?: { el?: string } };
      if (confirm('Αποστολή push ειδοποίησης στους συνδρομητές;')) {
        const res = await onSendPush('⚠️ Ειδοποίηση — Δήμος Λευκάδος', `${d.area?.el ?? ''}: ${d.message?.el ?? ''}`);
        alert(res);
      }
    }
    setEditing(null);
    load();
  };

  const remove = async (r: ContentRow) => {
    if (!confirm(`Διαγραφή «${rowTitle(r)}»;`)) return;
    await getSupabase()?.from('content').delete().eq('id', r.id);
    load();
  };

  const togglePublish = async (r: ContentRow) => {
    await getSupabase()?.from('content').update({ published: !r.published }).eq('id', r.id);
    load();
  };

  const setField = (key: string, v: unknown) => setEditing((e) => (e ? { ...e, data: { ...e.data, [key]: v } } : e));

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {KINDS.map((k) => (
          <button key={k.kind} onClick={() => setKind(k.kind)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              kind === k.kind ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]'}`}>
            {k.label}
          </button>
        ))}
      </div>

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
            spec.fields.map((f) => {
              const v = editing.data[f.key];
              if (f.type === 'bi' || f.type === 'bi-ta') {
                const b = (v ?? { el: '', en: '' }) as { el: string; en: string };
                const Tag = f.type === 'bi' ? 'input' : 'textarea';
                return (
                  <Field key={f.key} label={f.label}>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Tag value={b.el} placeholder="Ελληνικά" className={inputCls} rows={3}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(f.key, { ...b, el: e.target.value })} />
                      <Tag value={b.en} placeholder="English (προαιρετικό)" className={inputCls} rows={3}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(f.key, { ...b, en: e.target.value })} />
                    </div>
                  </Field>
                );
              }
              if (f.type === 'select') {
                return (
                  <Field key={f.key} label={f.label}>
                    <select value={String(v ?? '')} onChange={(e) => setField(f.key, e.target.value)} className={inputCls}>
                      {f.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                );
              }
              return (
                <Field key={f.key} label={f.label + ('optional' in f && f.optional ? ' (προαιρετικό)' : '')}>
                  <input type={f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'}
                    value={String(v ?? '')} onChange={(e) => setField(f.key, e.target.value)} className={inputCls} />
                </Field>
              );
            })
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{rows.length} εγγραφές — προστίθενται στα ενσωματωμένα δεδομένα της εφαρμογής</p>
            <PrimaryBtn onClick={startNew}><Plus size={13} className="inline mr-1" />Νέα εγγραφή</PrimaryBtn>
          </div>
          {kind === 'alert' && rows.some((r) => r.published) && (
            <Card className="p-3 flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
              <Bell size={14} className="text-amber-500 flex-shrink-0" />
              Οι ενεργές ειδοποιήσεις εμφανίζονται αμέσως στην αρχική σελίδα της εφαρμογής.
              <button
                onClick={async () => {
                  const first = rows.find((r) => r.published)?.data as { area?: { el?: string }; message?: { el?: string } } | undefined;
                  if (!first || !confirm('Αποστολή push για τις ενεργές ειδοποιήσεις;')) return;
                  alert(await onSendPush('⚠️ Ειδοποίηση — Δήμος Λευκάδος', `${first.area?.el ?? ''}: ${first.message?.el ?? ''}`));
                }}
                className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-bold flex-shrink-0">
                <Send size={11} /> Push
              </button>
            </Card>
          )}
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
