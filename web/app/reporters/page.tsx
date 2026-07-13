'use client';

/**
 * /reporters — private page where accredited reporters submit news items
 * (title, topic, short subtitle, social links). Requires the 'reporter' role.
 * Items appear immediately in the app's News feed; the mayor can unpublish
 * or delete them from /admin ▸ Ειδήσεις.
 */

import { useCallback, useEffect, useState } from 'react';
import { Newspaper, Plus, Trash2, X, Instagram, Facebook, Twitter } from 'lucide-react';
import AdminShell, { Card, Field, GhostBtn, PrimaryBtn, inputCls } from '@/components/admin/AdminShell';
import { getSupabase } from '@/lib/supabase';
import { storageGet, storageSet } from '@/lib/storage';

/** The app's Pegasus rendered as a single-colour mark (same as the Home feed's
 *  reporter-website button). */
function PegasusMark({ className }: { className?: string }) {
  const mask = "url('/pegasus-mark.png') center / contain no-repeat";
  return (
    <span aria-hidden className={`inline-block flex-shrink-0 ${className ?? ''}`}
      style={{ WebkitMask: mask, mask }} />
  );
}

const TOPICS = [
  { v: 'Infrastructure', l: 'Υποδομές' },
  { v: 'Tourism', l: 'Τουρισμός' },
  { v: 'Events', l: 'Εκδηλώσεις' },
  { v: 'Council', l: 'Δημοτικό Συμβούλιο' },
  { v: 'Environment', l: 'Περιβάλλον' },
  { v: 'Culture', l: 'Πολιτισμός' },
];

interface MyNewsRow {
  id: string;
  created_at: string;
  title_el: string; title_en: string;
  subtitle_el: string; subtitle_en: string;
  topic: string;
  reporter_url: string;
  links: { instagram?: string; facebook?: string; twitter?: string };
  published: boolean;
}

const EMPTY = {
  title_el: '', title_en: '',
  subtitle_el: '', subtitle_en: '',
  topic: 'Council',
  website: '',
  instagram: '', facebook: '', twitter: '',
};

export default function ReportersPage() {
  return (
    <AdminShell title="Καταχώρηση Ειδήσεων" accent="#6D44C8" allowedRoles={['reporter', 'mayor']}>
      {(session, role) => <ReporterApp displayName={role.display_name ?? session.user.email ?? ''} />}
    </AdminShell>
  );
}

function ReporterApp({ displayName }: { displayName: string }) {
  const [rows, setRows] = useState<MyNewsRow[]>([]);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return;
    const { data } = await sb
      .from('news')
      .select('id, created_at, title_el, title_en, subtitle_el, subtitle_en, topic, reporter_url, links, published')
      .eq('created_by', u.user.id)
      .order('created_at', { ascending: false });
    setRows((data as MyNewsRow[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const sb = getSupabase();
    if (!sb || !form) return;
    if (!form.title_el.trim()) { alert('Συμπληρώστε τον τίτλο.'); return; }
    setBusy(true);
    const links: Record<string, string> = {};
    if (form.instagram.trim()) links.instagram = form.instagram.trim();
    if (form.facebook.trim()) links.facebook = form.facebook.trim();
    if (form.twitter.trim()) links.twitter = form.twitter.trim();
    const { error } = await sb.from('news').insert({
      reporter_name: displayName,
      reporter_url: form.website.trim(),
      title_el: form.title_el, title_en: form.title_en || form.title_el,
      subtitle_el: form.subtitle_el, subtitle_en: form.subtitle_en || form.subtitle_el,
      topic: form.topic,
      links,
    });
    setBusy(false);
    if (error) { alert('Σφάλμα: ' + error.message); return; }
    storageSet('reporter_site', form.website.trim()); // remember for next time
    setForm(null);
    load();
  };

  const remove = async (r: MyNewsRow) => {
    if (!confirm(`Διαγραφή είδησης «${r.title_el}»;`)) return;
    await getSupabase()?.from('news').delete().eq('id', r.id);
    load();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-lg flex items-center gap-2">
          <Newspaper size={18} style={{ color: '#6D44C8' }} /> Οι ειδήσεις μου
        </h2>
        {!form && (
          <PrimaryBtn onClick={() => setForm({ ...EMPTY, website: storageGet('reporter_site', '') })}>
            <Plus size={13} className="inline mr-1" /> Νέα είδηση
          </PrimaryBtn>
        )}
      </div>

      {form && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[15px]">Νέα είδηση</h3>
            <GhostBtn onClick={() => setForm(null)}><X size={16} /></GhostBtn>
          </div>
          <Field label="Τίτλος">
            <div className="grid sm:grid-cols-2 gap-2">
              <input value={form.title_el} onChange={(e) => setForm({ ...form, title_el: e.target.value })}
                placeholder="Ελληνικά" className={inputCls} />
              <input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                placeholder="English (προαιρετικό)" className={inputCls} />
            </div>
          </Field>
          <Field label="Σύντομος υπότιτλος">
            <div className="grid sm:grid-cols-2 gap-2">
              <textarea value={form.subtitle_el} onChange={(e) => setForm({ ...form, subtitle_el: e.target.value })}
                placeholder="Ελληνικά" rows={3} className={inputCls} />
              <textarea value={form.subtitle_en} onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })}
                placeholder="English (προαιρετικό)" rows={3} className={inputCls} />
            </div>
          </Field>
          <Field label="Θέμα">
            <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={inputCls}>
              {TOPICS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </Field>
          <Field label="Προσωπική ιστοσελίδα — εμφανίζεται με το σήμα του Πηγάσου στην είδηση">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center bg-[#E3F0FB] dark:bg-[#16314F] flex-shrink-0">
                <PegasusMark className="w-4 h-4 bg-[#1B5E9B] dark:bg-blue-300" />
              </span>
              <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://www.example.gr" className={inputCls} />
            </div>
          </Field>
          <Field label="Σύνδεσμοι κοινωνικών δικτύων (προαιρετικά)">
            <div className="space-y-2">
              {([['instagram', <Instagram key="i" size={14} />], ['facebook', <Facebook key="f" size={14} />], ['twitter', <Twitter key="t" size={14} />]] as const).map(([k, icon]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-gray-400 w-5">{icon}</span>
                  <input type="url" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    placeholder={`https://${k === 'twitter' ? 'x' : k}.com/…`} className={inputCls} />
                </div>
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => setForm(null)}>Ακύρωση</GhostBtn>
            <PrimaryBtn onClick={save} disabled={busy}>{busy ? 'Δημοσίευση…' : 'Δημοσίευση'}</PrimaryBtn>
          </div>
        </Card>
      )}

      {rows.length === 0 && !form ? (
        <p className="text-center text-gray-400 py-10 text-sm">Δεν έχετε καταχωρήσει ειδήσεις ακόμη.</p>
      ) : (
        rows.map((r) => (
          <Card key={r.id} className="p-3.5 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[13.5px] leading-snug">{r.title_el}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {TOPICS.find((t) => t.v === r.topic)?.l ?? r.topic} · {new Date(r.created_at).toLocaleDateString('el-GR')}
              </p>
            </div>
            {r.reporter_url && (
              <a href={r.reporter_url} target="_blank" rel="noopener noreferrer" title={r.reporter_url}
                aria-label="Ιστοσελίδα ανταποκριτή"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#E3F0FB] dark:bg-[#16314F] active:scale-90 transition-transform flex-shrink-0">
                <PegasusMark className="w-4 h-4 bg-[#1B5E9B] dark:bg-blue-300" />
              </a>
            )}
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
              r.published ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-gray-100 dark:bg-[#252A3A] text-gray-400'}`}>
              {r.published ? 'Δημοσιευμένη' : 'Αποσυρμένη από τον Δήμο'}
            </span>
            <GhostBtn danger onClick={() => remove(r)} title="Διαγραφή"><Trash2 size={14} /></GhostBtn>
          </Card>
        ))
      )}
    </div>
  );
}
