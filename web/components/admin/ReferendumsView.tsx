'use client';

/**
 * Referendum management: title, short/medium/large explanation texts, options,
 * end date/time, optional PDF (uploaded to the public 'docs' bucket) and
 * YouTube id. Publishing makes it appear in the app's Profile ▸ Active votings.
 * Vote collection itself stays on-device in v1.0.
 */

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, FileText, Pencil, Plus, Trash2, Vote, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
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

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('referendums').select('*').order('created_at', { ascending: false });
    setRows((data as RefRow[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vote size={18} className="text-primary dark:text-primary-300" />
          <h2 className="font-black text-lg">Δημοψηφίσματα</h2>
        </div>
        <PrimaryBtn onClick={() => setEditing({ ...EMPTY })}><Plus size={13} className="inline mr-1" />Νέο</PrimaryBtn>
      </div>

      {rows.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">Δεν υπάρχουν δημοψηφίσματα ακόμη.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const ended = new Date(r.ends_at).getTime() < Date.now();
            return (
              <Card key={r.id} className="p-4 flex items-center gap-3 flex-wrap">
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
                <GhostBtn onClick={() => togglePublish(r)} title={r.published ? 'Απόσυρση' : 'Δημοσίευση'}>
                  {r.published ? <EyeOff size={14} /> : <Eye size={14} />}
                </GhostBtn>
                <GhostBtn onClick={() => setEditing(r)} title="Επεξεργασία"><Pencil size={14} /></GhostBtn>
                <GhostBtn danger onClick={() => remove(r)} title="Διαγραφή"><Trash2 size={14} /></GhostBtn>
              </Card>
            );
          })}
        </div>
      )}
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
