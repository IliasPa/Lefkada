'use client';

/**
 * Mayor's inbox: citizen messages with folders (drag a message onto a folder,
 * or use the dropdown on touch screens), free-text tags, search and filters.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Folder, FolderPlus, Inbox, Mail, MailOpen, Search, Tag, Trash2, User, EyeOff, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { Card, GhostBtn, inputCls } from './AdminShell';

export interface FolderRow {
  id: string;
  name: string;
  color: string;
  scope: 'messages' | 'applications';
  position: number;
}

interface MessageRow {
  id: string;
  created_at: string;
  body: string;
  anonymous: boolean;
  sender_name: string | null;
  sender_email: string | null;
  folder_id: string | null;
  tags: string[];
  read: boolean;
}

const FOLDER_COLORS = ['#DC2626', '#E4802C', '#C4963C', '#16A34A', '#0D5EAF', '#6D44C8', '#BE3478', '#6B7280'];

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('el-GR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** Folder chip strip with create/delete — shared by Inbox and Candidates. */
export function FolderBar({
  folders, active, counts, onSelect, onCreate, onDelete, onDropMessage, allLabel, unfiledLabel,
}: {
  folders: FolderRow[];
  active: string; // 'all' | 'none' | folder id
  counts: Record<string, number>;
  onSelect: (id: string) => void;
  onCreate: (name: string, color: string) => void;
  onDelete: (id: string) => void;
  onDropMessage: (msgId: string, folderId: string | null) => void;
  allLabel: string;
  unfiledLabel: string;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[4]);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const chip = (id: string, label: string, chipColor?: string, count?: number, deletable?: boolean, droppable?: boolean) => {
    const isActive = active === id;
    return (
      <div
        key={id}
        onDragOver={droppable ? (e) => { e.preventDefault(); setDragOver(id); } : undefined}
        onDragLeave={droppable ? () => setDragOver((d) => (d === id ? null : d)) : undefined}
        onDrop={droppable ? (e) => {
          e.preventDefault(); setDragOver(null);
          const msgId = e.dataTransfer.getData('text/plain');
          if (msgId) onDropMessage(msgId, id === 'none' ? null : id);
        } : undefined}
        className={`group flex-shrink-0 flex items-center rounded-full border transition-all ${
          dragOver === id ? 'ring-2 ring-primary scale-105' : ''
        } ${isActive ? 'text-white border-transparent' : 'bg-white dark:bg-[#141929] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#252A3A]'}`}
        style={isActive ? { backgroundColor: chipColor ?? '#0D5EAF' } : undefined}
      >
        <button onClick={() => onSelect(id)} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs font-semibold">
          {chipColor && !isActive && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chipColor }} />}
          {label}
          {count !== undefined && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25' : 'bg-gray-100 dark:bg-[#252A3A]'}`}>{count}</span>
          )}
        </button>
        {deletable && (
          <button
            onClick={() => { if (confirm(`Διαγραφή φακέλου «${label}»; Τα μηνύματά του δεν διαγράφονται.`)) onDelete(id); }}
            aria-label={`Διαγραφή φακέλου ${label}`}
            className={`pr-2 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
            <X size={12} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-2 items-center overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {chip('all', allLabel, undefined, counts['all'])}
      {chip('none', unfiledLabel, '#9CA3AF', counts['none'], false, true)}
      {folders.map((f) => chip(f.id, f.name, f.color, counts[f.id] ?? 0, true, true))}
      {adding ? (
        <form
          className="flex items-center gap-1.5 flex-shrink-0"
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onCreate(name.trim(), color); setName(''); setAdding(false); } }}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Όνομα φακέλου"
            className="w-32 px-3 py-1.5 rounded-full text-xs bg-white dark:bg-[#141929] border border-gray-200 dark:border-[#3A4155] focus:outline-none focus:border-primary" />
          <div className="flex gap-1">
            {FOLDER_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Χρώμα ${c}`}
                className={`w-4 h-4 rounded-full ${color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <button type="submit" className="px-2.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold">ΟΚ</button>
          <button type="button" onClick={() => setAdding(false)} className="text-gray-400"><X size={14} /></button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-primary dark:text-primary-300 border border-dashed border-primary/40 hover:bg-primary-50 dark:hover:bg-primary-900/20">
          <FolderPlus size={13} /> Νέος φάκελος
        </button>
      )}
    </div>
  );
}

/** Hook shared by Inbox/Candidates for the folder CRUD. */
export function useFolders(scope: 'messages' | 'applications') {
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('folders').select('*').eq('scope', scope).order('position').order('created_at');
    setFolders((data as FolderRow[]) ?? []);
  }, [scope]);
  useEffect(() => { load(); }, [load]);

  const create = async (name: string, color: string) => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('folders').insert({ name, color, scope, position: folders.length });
    load();
  };
  const remove = async (id: string) => {
    await getSupabase()?.from('folders').delete().eq('id', id);
    load();
  };
  return { folders, create, remove };
}

export default function InboxView() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { folders, create, remove } = useFolders('messages');

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from('messages').select('*').order('created_at', { ascending: false });
    setMessages((data as MessageRow[]) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const patch = async (id: string, fields: Partial<MessageRow>) => {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...fields } : m)));
    await getSupabase()?.from('messages').update(fields).eq('id', id);
  };
  const removeMessage = async (id: string) => {
    if (!confirm('Οριστική διαγραφή μηνύματος;')) return;
    setMessages((ms) => ms.filter((m) => m.id !== id));
    await getSupabase()?.from('messages').delete().eq('id', id);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: messages.length, none: 0 };
    for (const m of messages) {
      const k = m.folder_id ?? 'none';
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [messages]);

  const allTags = useMemo(
    () => Array.from(new Set(messages.flatMap((m) => m.tags))).sort(),
    [messages],
  );

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return messages.filter((m) => {
      if (activeFolder === 'none' && m.folder_id) return false;
      if (activeFolder !== 'all' && activeFolder !== 'none' && m.folder_id !== activeFolder) return false;
      if (activeTag && !m.tags.includes(activeTag)) return false;
      if (words.length) {
        const hay = `${m.body} ${m.sender_name ?? ''} ${m.sender_email ?? ''} ${m.tags.join(' ')}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [messages, query, activeFolder, activeTag]);

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center gap-2">
        <Inbox size={18} className="text-primary dark:text-primary-300" />
        <h2 className="font-black text-lg">Μηνύματα προς τον Δήμαρχο</h2>
        {unread > 0 && <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black">{unread} νέα</span>}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} type="search"
          placeholder="Αναζήτηση σε μηνύματα, αποστολείς, ετικέτες…" className={`${inputCls} pl-10`} />
      </div>

      <FolderBar
        folders={folders} active={activeFolder} counts={counts}
        onSelect={setActiveFolder} onCreate={create} onDelete={(id) => { remove(id); load(); }}
        onDropMessage={(msgId, folderId) => patch(msgId, { folder_id: folderId })}
        allLabel="Όλα" unfiledLabel="Χωρίς φάκελο"
      />

      {allTags.length > 0 && (
        <div className="flex gap-1.5 items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <Tag size={12} className="text-gray-400 flex-shrink-0" />
          {allTags.map((tg) => (
            <button key={tg} onClick={() => setActiveTag(activeTag === tg ? null : tg)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                activeTag === tg ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]'}`}>
              #{tg}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-10 text-sm">Φόρτωση…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">Δεν υπάρχουν μηνύματα εδώ.</p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => (
            <MessageCard key={m.id} m={m} folders={folders}
              expanded={expanded === m.id}
              onToggle={() => {
                setExpanded(expanded === m.id ? null : m.id);
                if (!m.read) patch(m.id, { read: true });
              }}
              onMove={(fid) => patch(m.id, { folder_id: fid })}
              onTags={(tags) => patch(m.id, { tags })}
              onDelete={() => removeMessage(m.id)}
            />
          ))}
        </div>
      )}
      <p className="text-[11px] text-gray-400 text-center pb-4">
        Σύρετε ένα μήνυμα πάνω σε φάκελο για να το αρχειοθετήσετε — ή χρησιμοποιήστε το μενού «Φάκελος».
      </p>
    </div>
  );
}

function MessageCard({ m, folders, expanded, onToggle, onMove, onTags, onDelete }: {
  m: MessageRow;
  folders: FolderRow[];
  expanded: boolean;
  onToggle: () => void;
  onMove: (folderId: string | null) => void;
  onTags: (tags: string[]) => void;
  onDelete: () => void;
}) {
  const [tagInput, setTagInput] = useState('');
  const folder = folders.find((f) => f.id === m.folder_id);

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tg = tagInput.trim().replace(/^#/, '');
    if (tg && !m.tags.includes(tg)) onTags([...m.tags, tg]);
    setTagInput('');
  };

  return (
    <Card className={`overflow-hidden ${!m.read ? 'border-l-4 border-l-primary' : ''}`}>
      <div
        draggable
        onDragStart={(e) => { e.dataTransfer.setData('text/plain', m.id); e.dataTransfer.effectAllowed = 'move'; }}
        onClick={onToggle}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onToggle(); }}
        className="p-4 cursor-pointer select-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {m.read ? <MailOpen size={13} className="text-gray-300 dark:text-gray-600" /> : <Mail size={13} className="text-primary" />}
              {m.anonymous ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400"><EyeOff size={11} /> Ανώνυμο</span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-primary dark:text-primary-300">
                  <User size={11} /> {m.sender_name || '—'}{m.sender_email ? ` · ${m.sender_email}` : ''}
                </span>
              )}
              <span className="text-[11px] text-gray-400">{fmtDate(m.created_at)}</span>
              {folder && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: folder.color + '1c', color: folder.color }}>
                  <Folder size={10} /> {folder.name}
                </span>
              )}
              {m.tags.map((tg) => (
                <span key={tg} className="text-[10px] font-semibold text-gray-400">#{tg}</span>
              ))}
            </div>
            <p className={`text-[13.5px] leading-relaxed text-gray-700 dark:text-gray-300 ${expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
              {m.body}
            </p>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-100 dark:border-[#1E2D4E] flex items-center gap-2 flex-wrap">
          <select
            value={m.folder_id ?? ''}
            onChange={(e) => onMove(e.target.value || null)}
            aria-label="Φάκελος"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-[#0F1219] border border-gray-200 dark:border-[#3A4155]">
            <option value="">Φάκελος: κανένας</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <form onSubmit={addTag} className="flex items-center gap-1">
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="+ ετικέτα"
              className="w-24 px-2.5 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-[#0F1219] border border-gray-200 dark:border-[#3A4155] focus:outline-none focus:border-primary" />
          </form>
          {m.tags.map((tg) => (
            <button key={tg} onClick={() => onTags(m.tags.filter((x) => x !== tg))}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 dark:bg-[#252A3A] text-gray-500">
              #{tg} <X size={10} />
            </button>
          ))}
          {!m.anonymous && m.sender_email && (
            <a href={`mailto:${m.sender_email}`} className="text-xs font-bold text-primary dark:text-primary-300 px-2 py-1.5">
              Απάντηση ✉
            </a>
          )}
          <div className="ml-auto">
            <GhostBtn danger onClick={onDelete} title="Διαγραφή"><Trash2 size={14} /></GhostBtn>
          </div>
        </div>
      )}
    </Card>
  );
}
