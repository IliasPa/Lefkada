'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, ShieldAlert, ShieldOff, Settings, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { KEYS, storageGet, storageSet } from '@/lib/storage';
import VetoOverlay from '@/components/VetoOverlay';

interface ProfileSnap { fullName: string; email: string; }

export default function AccountTab() {
  const { t, lang, setActiveTab } = useApp();
  const [snap, setSnap] = useState<ProfileSnap>({ fullName: '', email: '' });
  const [vetoActive, setVetoActive] = useState(false);
  const [vetoOverlay, setVetoOverlay] = useState(false);

  // Refresh on every mount so edits in Settings are reflected
  useEffect(() => {
    const p = storageGet<Partial<ProfileSnap>>(KEYS.profile, {});
    setSnap({ fullName: p.fullName ?? '', email: p.email ?? '' });
    setVetoActive(storageGet<boolean>(KEYS.veto, false));
  }, []);

  const handleVetoPress = () => {
    if (vetoActive) { setVetoActive(false); storageSet(KEYS.veto, false); }
    else setVetoOverlay(true);
  };
  const handleVetoDismiss = useCallback(() => {
    setVetoOverlay(false);
    setVetoActive(true);
    storageSet(KEYS.veto, true);
  }, []);

  return (
    <>
      <div className="h-full scroll-area">
        <div className="px-4 pt-4 pb-10 max-w-2xl mx-auto space-y-4">
          <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1">
            {t('acc_title')}
          </h1>

          {/* Profile summary card */}
          <div className="bg-white dark:bg-[#141929] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <User size={22} className="text-primary dark:text-primary-300" />
              </div>
              <div className="min-w-0 flex-1">
                {snap.fullName ? (
                  <p className="font-bold text-[15px] text-gray-900 dark:text-white truncate">{snap.fullName}</p>
                ) : (
                  <p className="text-[14px] text-gray-400 dark:text-gray-500 italic">{t('acc_no_name')}</p>
                )}
                {snap.email && (
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{snap.email}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('account')}
              className="w-full flex items-center justify-between px-4 py-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary dark:text-primary-300 font-semibold text-[14px] active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-2">
                <Settings size={16} />
                {t('acc_edit_profile')}
              </div>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Official Actions */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-2 ml-1">
              {t('acc_official')}
            </p>
            <div className="bg-white dark:bg-[#141929] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] overflow-hidden shadow-sm">
              <div className="p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{t('acc_veto_desc')}</p>
                {vetoActive ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl veto-pulse">
                      <ShieldAlert size={20} className="text-red-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-red-600 dark:text-red-400">{t('acc_veto_active_label')}</p>
                        <p className="text-xs text-red-400 mt-0.5">
                          {lang === 'el' ? 'Η διαμαρτυρία σας είναι ενεργή' : 'Your protest is active'}
                        </p>
                      </div>
                    </div>
                    <button onClick={handleVetoPress}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 dark:border-red-800/40 text-red-500 dark:text-red-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-[0.98]">
                      <ShieldOff size={16} />{t('acc_veto_revoke')}
                    </button>
                  </div>
                ) : (
                  <button onClick={handleVetoPress}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-lg tracking-wider shadow-lg shadow-red-600/30 transition-all active:scale-[0.97]">
                    <ShieldAlert size={22} />{t('acc_veto_exercise')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <VetoOverlay visible={vetoOverlay} onDismiss={handleVetoDismiss} />
    </>
  );
}
