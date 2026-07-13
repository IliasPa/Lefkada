'use client';

/**
 * Candidates per job posting: name, email, CV download (signed URL from the
 * private bucket), status, and the same folder/drag system as the inbox.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, ChevronDown, Download, Folder, Search, Trash2, Users } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { Card, GhostBtn, inputCls } from './AdminShell';
import { FolderBar, useFolders, fmtDate, type FolderRow } from './InboxView';

interface ApplicationRow {
  id: string;
  created_at: string;
  job_id: string;
  job_title: string;
  name: string;
  email: string;
  cv_path: string;
  folder_id: string | null;
  tags: string[];
  status: 'new' | 'shortlist' | 'rejected';
}

const STATUS_META: Record<ApplicationRow['status'], { label: string; color: string }> = {
  new: { label: 'Νέα', color: '#0D5EAF' },
  shortlist: { label: 'Shortlist', color: '#16A34A' },
  rejected: { label: 'Απορρίφθηκε', color: '#DC2626' },
};

export default function CandidatesView() {
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('all');
  const [status, setStatus] = useState<'all' | ApplicationRow['status']>('all');
  const [openJobs, setOpenJobs] = useState<Record<string, boolean>>({});
  const { folders, create, remove } = useFolders('applications');

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('applications').select('*').order('created_at', { ascending: false });
    setApps((data as ApplicationRow[]) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const patch = async (id: string, fields: Partial<ApplicationRow>) => {
    setApps((as) => as.map((a) => (a.id === id ? { ...a, ...fields } : a)));
    await getSupabase()?.from('applications').update(fields).eq('id', id);
  };

  const removeApp = async (a: ApplicationRow) => {
    if (!confirm(`Διαγραφή αίτησης του/της ${a.name};`)) return;
    setApps((as) => as.filter((x) => x.id !== a.id));
    const sb = getSupabase();
    if (a.cv_path) await sb?.storage.from('cvs').remove([a.cv_path]);
    await sb?.from('applications').delete().eq('id', a.id);
  };

  const downloadCv = async (a: ApplicationRow) => {
    const sb = getSupabase();
    if (!sb || !a.cv_path) return;
    const { data, error } = await sb.storage.from('cvs').createSignedUrl(a.cv_path, 3600);
    if (error || !data?.signedUrl) { alert('Δεν ήταν δυνατή η λήψη του βιογραφικού.'); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length, none: 0 };
    for (const a of apps) {
      const k = a.folder_id ?? 'none';
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [apps]);

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return apps.filter((a) => {
      if (activeFolder === 'none' && a.folder_id) return false;
      if (activeFolder !== 'all' && activeFolder !== 'none' && a.folder_id !== activeFolder) return false;
      if (status !== 'all' && a.status !== status) return false;
      if (words.length) {
        const hay = `${a.name} ${a.email} ${a.job_title}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [apps, query, activeFolder, status]);

  const byJob = useMemo(() => {
    const groups = new Map<string, ApplicationRow[]>();
    for (const a of filtered) {
      const k = a.job_title;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(a);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center gap-2">
        <Users size={18} className="text-primary dark:text-primary-300" />
        <h2 className="font-black text-lg">Υποψήφιοι ανά θέση εργασίας</h2>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} type="search"
          placeholder="Αναζήτηση υποψηφίου, email ή θέσης…" className={`${inputCls} pl-10`} />
      </div>

      <FolderBar
        folders={folders} active={activeFolder} counts={counts}
        onSelect={setActiveFolder} onCreate={create} onDelete={remove}
        onDropMessage={(id, folderId) => patch(id, { folder_id: folderId })}
        allLabel="Όλοι" unfiledLabel="Χωρίς φάκελο"
      />

      <div className="flex gap-2">
        {(['all', 'new', 'shortlist', 'rejected'] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              status === s ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]'}`}>
            {s === 'all' ? 'Όλες' : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10 text-sm">Φόρτωση…</p>
      ) : byJob.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">Δεν υπάρχουν αιτήσεις εδώ.</p>
      ) : (
        <div className="space-y-3">
          {byJob.map(([job, list]) => {
            const open = openJobs[job] ?? true;
            return (
              <Card key={job} className="overflow-hidden">
                <button onClick={() => setOpenJobs((o) => ({ ...o, [job]: !open }))}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3.5 text-left">
                  <span className="flex items-center gap-2 min-w-0">
                    <Briefcase size={15} className="text-primary dark:text-primary-300 flex-shrink-0" />
                    <span className="font-bold text-[14px] truncate">{job}</span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-300">
                      {list.length}
                    </span>
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="border-t border-gray-100 dark:border-[#1E2D4E] divide-y divide-gray-50 dark:divide-[#1E2D4E]">
                    {list.map((a) => (
                      <CandidateRow key={a.id} a={a} folders={folders}
                        onPatch={(f) => patch(a.id, f)} onDelete={() => removeApp(a)} onCv={() => downloadCv(a)} />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CandidateRow({ a, folders, onPatch, onDelete, onCv }: {
  a: ApplicationRow;
  folders: FolderRow[];
  onPatch: (fields: Partial<ApplicationRow>) => void;
  onDelete: () => void;
  onCv: () => void;
}) {
  const folder = folders.find((f) => f.id === a.folder_id);
  const sm = STATUS_META[a.status];
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move'; }}
      className="px-4 py-3 flex items-center gap-3 flex-wrap"
    >
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[13.5px] truncate">{a.name}</p>
        <p className="text-[12px] text-gray-400 truncate">
          <a href={`mailto:${a.email}`} className="text-primary dark:text-primary-300 hover:underline">{a.email}</a>
          {' · '}{fmtDate(a.created_at)}
          {folder && (
            <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full align-middle"
              style={{ backgroundColor: folder.color + '1c', color: folder.color }}>
              <Folder size={9} /> {folder.name}
            </span>
          )}
        </p>
      </div>
      <select value={a.status} onChange={(e) => onPatch({ status: e.target.value as ApplicationRow['status'] })}
        aria-label="Κατάσταση"
        className="px-2 py-1.5 rounded-lg text-[11px] font-bold border bg-white dark:bg-[#0F1219] border-gray-200 dark:border-[#3A4155]"
        style={{ color: sm.color }}>
        {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <select value={a.folder_id ?? ''} onChange={(e) => onPatch({ folder_id: e.target.value || null })}
        aria-label="Φάκελος"
        className="px-2 py-1.5 rounded-lg text-[11px] font-semibold border bg-white dark:bg-[#0F1219] border-gray-200 dark:border-[#3A4155] text-gray-500 dark:text-gray-400 max-w-[110px]">
        <option value="">Φάκελος…</option>
        {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      {a.cv_path ? (
        <button onClick={onCv}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary-50 dark:bg-primary-900/30 text-primary dark:text-primary-300 active:scale-95">
          <Download size={12} /> CV
        </button>
      ) : (
        <span className="text-[11px] text-gray-300 dark:text-gray-600 font-semibold">χωρίς CV</span>
      )}
      <GhostBtn danger onClick={onDelete} title="Διαγραφή"><Trash2 size={13} /></GhostBtn>
    </div>
  );
}
