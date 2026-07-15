'use client';

/**
 * Shared shell for the private areas (/admin, /reporters, /pharmacies):
 * Supabase email+password login, role check against app_roles, header with
 * sign-out, and a scrollable content area (the root layout locks body scroll).
 */

import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut, Lock, ShieldAlert } from 'lucide-react';
import { getSupabase, backendConfigured } from '@/lib/supabase';

export interface RoleInfo {
  role: 'mayor' | 'reporter' | 'pharmacy';
  pharmacy_id: string | null;
  display_name: string | null;
}

export default function AdminShell({
  title,
  accent = '#0D5EAF',
  allowedRoles,
  nav,
  children,
}: {
  title: string;
  accent?: string;
  allowedRoles: RoleInfo['role'][];
  /** Optional navigation rendered centered in the header (like the public app). */
  nav?: React.ReactNode;
  children: (session: Session, role: RoleInfo) => React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<RoleInfo | null | 'loading'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !session) { setRole('loading'); return; }
    sb.from('app_roles')
      .select('role, pharmacy_id, display_name')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setRole((data as RoleInfo) ?? null));
  }, [session]);

  const signIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true); setError('');
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    if (err) {
      // Surface Supabase's real reason — "Invalid login credentials",
      // "Email not confirmed", "Email logins are disabled", "Invalid API key"…
      // each points to a different setup fix (see SETUP_BACKEND.md).
      setError(err.message || 'Λάθος στοιχεία σύνδεσης / Wrong credentials');
    }
    setBusy(false);
  }, [email, password]);

  const signOut = () => getSupabase()?.auth.signOut();

  if (!backendConfigured) {
    return (
      <Center>
        <ShieldAlert size={40} className="text-amber-500 mx-auto mb-3" />
        <h1 className="font-bold text-lg mb-2">Το backend δεν έχει ρυθμιστεί</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ορίστε τα NEXT_PUBLIC_SUPABASE_URL και NEXT_PUBLIC_SUPABASE_ANON_KEY
          (δείτε το SETUP_BACKEND.md) και κάντε νέο deploy.
        </p>
      </Center>
    );
  }

  if (!session) {
    return (
      <Center>
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: accent + '22' }}>
          <Lock size={26} style={{ color: accent }} />
        </div>
        <h1 className="font-black text-xl mb-1">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Σύνδεση με λογαριασμό εξουσιοδοτημένου χρήστη</p>
        <form onSubmit={signIn} className="space-y-3 text-left">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" autoComplete="username" className={inputCls} />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Κωδικός" autoComplete="current-password" className={inputCls} />
          {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full py-3 rounded-xl font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ backgroundColor: accent }}>
            {busy ? 'Σύνδεση…' : 'Σύνδεση'}
          </button>
        </form>
      </Center>
    );
  }

  if (role === 'loading') {
    return (
      <Center>
        <div className="w-8 h-8 rounded-full border-4 border-primary-300 border-t-primary animate-spin mx-auto" />
      </Center>
    );
  }

  if (!role || !allowedRoles.includes(role.role)) {
    return (
      <Center>
        <ShieldAlert size={40} className="text-red-500 mx-auto mb-3" />
        <h1 className="font-bold text-lg mb-2">Δεν έχετε πρόσβαση</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Ο λογαριασμός {session.user.email} δεν έχει τον απαιτούμενο ρόλο για τη σελίδα αυτή.
        </p>
        <button onClick={signOut} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#252A3A] font-semibold text-sm">
          Αποσύνδεση
        </button>
      </Center>
    );
  }

  return (
    <div className="app-shell flex flex-col bg-[#F2F5F9] dark:bg-[#0B0F18] text-gray-900 dark:text-gray-100">
      {/* Same liquid-glass bar as the public app's header (translucent + blur),
          so the private areas read as the same product. */}
      <header className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 bg-white/[0.84] dark:bg-[#0B0F18]/[0.88] backdrop-blur-[20px] backdrop-saturate-[2] border-b border-black/[0.07] dark:border-white/[0.05] shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.35)]"
        style={{ paddingTop: 'calc(0.625rem + var(--sat, 0px))' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/PegasusFlag.png" alt="" title={title} className="w-8 h-8 rounded-lg flex-shrink-0" />
        {nav ? (
          /* Tabs live in the header, centered — like the public app. */
          <div className="flex-1 min-w-0 overflow-x-auto px-1" style={{ scrollbarWidth: 'none' }}>
            <div className="w-max mx-auto">{nav}</div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-[15px] leading-tight truncate">{title}</h1>
            <p className="text-[11px] text-gray-400 truncate">{role.display_name || session.user.email}</p>
          </div>
        )}
        <button onClick={signOut} title={`Αποσύνδεση (${role.display_name || session.user.email})`} aria-label="Αποσύνδεση"
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[12px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A] active:scale-95 flex-shrink-0">
          <LogOut size={14} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {children(session, role)}
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#F2F5F9] dark:bg-[#0B0F18] text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#141929] rounded-3xl border border-gray-100 dark:border-[#1E2D4E] shadow-xl p-6 text-center">
        {children}
      </div>
    </div>
  );
}

// ── Shared admin UI primitives ───────────────────────────────────────────────

export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl text-[14px] bg-gray-50 dark:bg-[#0F1219] border border-gray-200 dark:border-[#3A4155] ' +
  'text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary ' +
  'focus:ring-1 focus:ring-primary/20 transition-colors';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-[#141929] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PrimaryBtn({ children, onClick, disabled, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit';
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className="px-4 py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/30 hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, danger, title }: {
  children: React.ReactNode; onClick?: () => void; danger?: boolean; title?: string;
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`px-3 py-2 rounded-xl text-[12px] font-bold active:scale-95 transition-all ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A]'
      }`}>
      {children}
    </button>
  );
}
