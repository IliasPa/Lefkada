'use client';

/**
 * /admin — the mayor's private dashboard.
 * Access: Supabase login + 'mayor' role in app_roles (see SETUP_BACKEND.md).
 */

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Bell, Database, Inbox, Newspaper, Users, Vote, Eye, EyeOff, Trash2 } from 'lucide-react';
import AdminShell, { Card, GhostBtn, PrimaryBtn, inputCls, Field } from '@/components/admin/AdminShell';
import AnimatedSegmented from '@/components/AnimatedSegmented';
import { getSupabase } from '@/lib/supabase';

const InboxView = dynamic(() => import('@/components/admin/InboxView'), { ssr: false });
const CandidatesView = dynamic(() => import('@/components/admin/CandidatesView'), { ssr: false });
const ReferendumsView = dynamic(() => import('@/components/admin/ReferendumsView'), { ssr: false });
const ContentView = dynamic(() => import('@/components/admin/ContentView'), { ssr: false });

type View = 'inbox' | 'candidates' | 'referendums' | 'content' | 'news' | 'push';

const VIEWS: { key: View; label: string; icon: React.ReactNode }[] = [
  { key: 'inbox', label: 'Μηνύματα', icon: <Inbox size={14} /> },
  { key: 'candidates', label: 'Υποψήφιοι', icon: <Users size={14} /> },
  { key: 'referendums', label: 'Δημοψηφίσματα', icon: <Vote size={14} /> },
  { key: 'content', label: 'Περιεχόμενο', icon: <Database size={14} /> },
  { key: 'news', label: 'Ειδήσεις', icon: <Newspaper size={14} /> },
  { key: 'push', label: 'Ειδοποιήσεις', icon: <Bell size={14} /> },
];

async function sendPush(title: string, body: string): Promise<string> {
  const sb = getSupabase();
  if (!sb) return 'Το backend δεν είναι ρυθμισμένο.';
  const { data, error } = await sb.functions.invoke('send-push', { body: { title, body, url: '/' } });
  if (error) return 'Σφάλμα αποστολής: ' + error.message + ' (έχει γίνει deploy της συνάρτησης send-push;)';
  const d = data as { sent?: number; total?: number };
  return `Εστάλη σε ${d?.sent ?? 0} από ${d?.total ?? 0} συνδρομητές.`;
}

export default function AdminPage() {
  const [view, setView] = useState<View>('inbox');

  return (
    <AdminShell title="Διαχείριση — Δήμος Λευκάδος" allowedRoles={['mayor']}>
      {() => (
        <div>
          <nav className="sticky top-0 z-10 bg-[#F2F5F9]/90 dark:bg-[#0B0F18]/90 backdrop-blur-md border-b border-gray-200 dark:border-[#1E2D4E]">
            <div className="max-w-3xl mx-auto px-4 py-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {/* Same liquid-glass spring indicator as the public app's tabs */}
              <AnimatedSegmented
                options={VIEWS.map((v) => ({ key: v.key, label: v.label, icon: v.icon }))}
                value={view}
                onChange={(k) => setView(k as View)}
              />
            </div>
          </nav>
          {view === 'inbox' && <InboxView />}
          {view === 'candidates' && <CandidatesView />}
          {view === 'referendums' && <ReferendumsView />}
          {view === 'content' && <ContentView onSendPush={sendPush} />}
          {view === 'news' && <NewsModerationView />}
          {view === 'push' && <PushView />}
        </div>
      )}
    </AdminShell>
  );
}

// ── News moderation (reporter submissions) ───────────────────────────────────

interface NewsRow {
  id: string;
  created_at: string;
  reporter_name: string;
  title_el: string;
  subtitle_el: string;
  topic: string;
  published: boolean;
}

function NewsModerationView() {
  const [rows, setRows] = useState<NewsRow[]>([]);
  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb
      .from('news')
      .select('id, created_at, reporter_name, title_el, subtitle_el, topic, published')
      .order('created_at', { ascending: false });
    setRows((data as NewsRow[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (r: NewsRow) => {
    await getSupabase()?.from('news').update({ published: !r.published }).eq('id', r.id);
    load();
  };
  const remove = async (r: NewsRow) => {
    if (!confirm(`Διαγραφή είδησης «${r.title_el}»;`)) return;
    await getSupabase()?.from('news').delete().eq('id', r.id);
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-3">
      <h2 className="font-black text-lg flex items-center gap-2">
        <Newspaper size={18} className="text-primary dark:text-primary-300" /> Ειδήσεις ανταποκριτών
      </h2>
      <p className="text-sm text-gray-400">
        Οι ανταποκριτές καταχωρούν ειδήσεις από τη σελίδα <code className="font-mono">/reporters</code>. Από εδώ μπορείτε να τις αποσύρετε ή να τις διαγράψετε.
      </p>
      {rows.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">Δεν υπάρχουν καταχωρημένες ειδήσεις.</p>
      ) : (
        rows.map((r) => (
          <Card key={r.id} className="p-3.5 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[13.5px] leading-snug">{r.title_el}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {r.reporter_name || '—'} · {r.topic} · {new Date(r.created_at).toLocaleDateString('el-GR')}
              </p>
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
              r.published ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-gray-100 dark:bg-[#252A3A] text-gray-400'}`}>
              {r.published ? 'Δημοσιευμένη' : 'Αποσυρμένη'}
            </span>
            <GhostBtn onClick={() => toggle(r)} title={r.published ? 'Απόσυρση' : 'Δημοσίευση'}>
              {r.published ? <EyeOff size={14} /> : <Eye size={14} />}
            </GhostBtn>
            <GhostBtn danger onClick={() => remove(r)} title="Διαγραφή"><Trash2 size={14} /></GhostBtn>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Push notifications ───────────────────────────────────────────────────────

function PushView() {
  const [count, setCount] = useState<number | null>(null);
  const [title, setTitle] = useState('Δήμος Λευκάδος');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    getSupabase()
      ?.from('push_subscriptions')
      .select('id', { count: 'exact', head: true })
      .then(({ count: c }) => setCount(c ?? 0));
  }, []);

  const send = async () => {
    if (!body.trim()) return;
    setBusy(true);
    setResult(await sendPush(title.trim() || 'Δήμος Λευκάδος', body.trim()));
    setBusy(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      <h2 className="font-black text-lg flex items-center gap-2">
        <Bell size={18} className="text-primary dark:text-primary-300" /> Push ειδοποιήσεις
      </h2>
      <Card className="p-4 space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Εγγεγραμμένες συσκευές: <strong>{count ?? '…'}</strong>. Οι πολίτες εγγράφονται
          ενεργοποιώντας τις «Ειδοποιήσεις» στις ρυθμίσεις της εφαρμογής.
        </p>
        <Field label="Τίτλος">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Μήνυμα">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={inputCls}
            placeholder="π.χ. Διακοπή υδροδότησης αύριο 09:00–14:00 στο Νυδρί" />
        </Field>
        <div className="flex items-center gap-3">
          <PrimaryBtn onClick={send} disabled={busy || !body.trim()}>{busy ? 'Αποστολή…' : 'Αποστολή σε όλους'}</PrimaryBtn>
          {result && <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{result}</p>}
        </div>
      </Card>
    </div>
  );
}
