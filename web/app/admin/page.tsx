'use client';

/**
 * /admin — the mayor's private dashboard.
 * Access: Supabase login + 'mayor' role in app_roles (see SETUP_BACKEND.md).
 * The top navigation mirrors the public app (same icons, same liquid-glass
 * spring indicator), one domain per tab.
 */

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Amphora, BarChart3, Bell, Briefcase, Droplets, Eye, EyeOff,
  GraduationCap, Inbox, Landmark, Newspaper, Phone, Trash2, Users, Vote,
} from 'lucide-react';
import AdminShell, { Card, GhostBtn } from '@/components/admin/AdminShell';
import AnimatedSegmented from '@/components/AnimatedSegmented';
import KindManager, {
  BUDGET_KIND, COMPETITION_KIND, CONTACT_KIND, EBOOK_KIND, EVENT_KIND, GOVERNANCE_KINDS, JOB_KIND, LESSON_KIND, WATER_KIND,
} from '@/components/admin/ContentView';
import { getSupabase } from '@/lib/supabase';

const InboxView = dynamic(() => import('@/components/admin/InboxView'), { ssr: false });
const CandidatesView = dynamic(() => import('@/components/admin/CandidatesView'), { ssr: false });
const ReferendumsView = dynamic(() => import('@/components/admin/ReferendumsView'), { ssr: false });
const AlertsView = dynamic(() => import('@/components/admin/AlertsView'), { ssr: false });

type View =
  | 'inbox' | 'jobs' | 'referendums' | 'alerts' | 'culture'
  | 'budget' | 'governance' | 'water' | 'education' | 'news' | 'contacts';

/** Icons match the public app's tabs (Briefcase=Θέσεις, Amphora=Πολιτισμός,
 *  BarChart3=Δαπάνες, Landmark=Διακυβέρνηση, GraduationCap=Παιδεία…), at the
 *  same size — the nav renders them with the title underneath, like the app. */
const VIEWS: { key: View; label: string; icon: React.ReactNode }[] = [
  { key: 'inbox', label: 'Μηνύματα', icon: <Inbox size={18} /> },
  { key: 'jobs', label: 'Θέσεις', icon: <Briefcase size={18} /> },
  { key: 'referendums', label: 'Δημοψηφίσματα', icon: <Vote size={18} /> },
  { key: 'alerts', label: 'Ειδοποιήσεις', icon: <Bell size={18} /> },
  { key: 'culture', label: 'Πολιτισμός', icon: <Amphora size={18} /> },
  { key: 'budget', label: 'Δαπάνες', icon: <BarChart3 size={18} /> },
  { key: 'governance', label: 'Διακυβέρνηση', icon: <Landmark size={18} /> },
  { key: 'water', label: 'Νερό', icon: <Droplets size={18} /> },
  { key: 'education', label: 'Παιδεία', icon: <GraduationCap size={18} /> },
  { key: 'news', label: 'Ειδήσεις', icon: <Newspaper size={18} /> },
  { key: 'contacts', label: 'Επικοινωνία', icon: <Phone size={18} /> },
];

export default function AdminPage() {
  const [view, setView] = useState<View>('inbox');

  return (
    <AdminShell
      title="Διαχείριση — Δήμος Λευκάδος"
      allowedRoles={['mayor']}
      nav={
        /* Tabs in the header next to the logo — icon with the title underneath,
           no background, same liquid-glass indicator: the public app's tab bar. */
        <AnimatedSegmented
          variant="nav"
          options={VIEWS.map((v) => ({ key: v.key, label: v.label, icon: v.icon }))}
          value={view}
          onChange={(k) => setView(k as View)}
        />
      }
    >
      {() => (
        <div>
          {view === 'inbox' && <InboxView />}
          {view === 'jobs' && <JobsAdminView />}
          {view === 'referendums' && <ReferendumsView />}
          {view === 'alerts' && <AlertsView />}
          {view === 'culture' && (
            <KindManager kinds={[EVENT_KIND]} intro="Εκδηλώσεις — εμφανίζονται στη λίστα και στο ημερολόγιο του Πολιτισμού." />
          )}
          {view === 'budget' && (
            <KindManager kinds={[BUDGET_KIND]} intro="Δελτία εκτέλεσης προϋπολογισμού — εμφανίζονται στα Δαπάνες ▸ Δελτία ως σύνδεσμοι." />
          )}
          {view === 'governance' && <KindManager kinds={GOVERNANCE_KINDS} />}
          {view === 'water' && (
            <KindManager kinds={[WATER_KIND]} intro="Αναλύσεις πόσιμου νερού ανά κοινότητα — εμφανίζονται στις Υπηρεσίες ▸ Αναλύσεις νερού." />
          )}
          {view === 'education' && (
            <KindManager kinds={[LESSON_KIND, COMPETITION_KIND, EBOOK_KIND]}
              intro="Μαθήματα & διαγωνισμοί ανά κατηγορία και e-Βιβλία — εμφανίζονται στην Παιδεία." />
          )}
          {view === 'contacts' && (
            <KindManager kinds={[CONTACT_KIND]}
              intro="Τηλέφωνα & επαφές υπηρεσιών — εμφανίζονται στην καρτέλα Επικοινωνία της εφαρμογής." />
          )}
          {view === 'news' && <NewsModerationView />}
        </div>
      )}
    </AdminShell>
  );
}

// ── Θέσεις: job postings + candidates in one tab ─────────────────────────────

function JobsAdminView() {
  const [sub, setSub] = useState<'candidates' | 'listings'>('candidates');
  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <AnimatedSegmented
          options={[
            { key: 'candidates', label: 'Υποψήφιοι', icon: <Users size={13} /> },
            { key: 'listings', label: 'Αγγελίες', icon: <Briefcase size={13} /> },
          ]}
          value={sub}
          onChange={(k) => setSub(k as 'candidates' | 'listings')}
        />
      </div>
      {sub === 'candidates' ? (
        <CandidatesView />
      ) : (
        <KindManager kinds={[JOB_KIND]} intro="Αγγελίες θέσεων — εμφανίζονται στην καρτέλα Θέσεις της εφαρμογής." />
      )}
    </div>
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
