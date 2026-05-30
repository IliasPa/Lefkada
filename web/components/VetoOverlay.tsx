'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function VetoOverlay({ visible, onDismiss }: Props) {
  const { t } = useApp();
  const [phase, setPhase] = useState<'hidden' | 'entering' | 'visible' | 'exiting'>('hidden');

  useEffect(() => {
    if (visible) {
      setPhase('entering');
      const t1 = setTimeout(() => setPhase('visible'), 50);
      const t2 = setTimeout(() => setPhase('exiting'), 3200);
      const t3 = setTimeout(() => {
        setPhase('hidden');
        onDismiss();
      }, 3700);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [visible, onDismiss]);

  if (phase === 'hidden') return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        cursor-pointer select-none
        transition-opacity duration-500
        ${phase === 'exiting' ? 'opacity-0' : 'opacity-100'}
      `}
      style={{ background: 'rgba(185, 28, 28, 0.96)' }}
      onClick={() => {
        setPhase('exiting');
        setTimeout(() => { setPhase('hidden'); onDismiss(); }, 400);
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Stamp ring */}
      <div
        className={`
          relative border-[6px] border-white rounded-full
          w-52 h-52 flex items-center justify-center
          ${phase !== 'entering' ? 'animate-veto-stamp' : 'opacity-0'}
        `}
        style={{ borderStyle: 'dashed' }}
      >
        <div className="text-center">
          <p className="text-white font-black text-6xl leading-none tracking-widest drop-shadow-lg">
            {t('veto_overlay_line1')}
          </p>
          <div className="w-full h-0.5 bg-white my-2 opacity-60" />
          <p className="text-white text-[9px] font-bold tracking-[0.3em] uppercase opacity-80 px-2">
            ΔΗΜΟΣ ΛΕΥΚΑΔΟΣ
          </p>
        </div>
      </div>

      {/* Subtitle */}
      <p
        className={`
          text-white/90 text-sm font-medium mt-8 text-center px-8
          ${phase !== 'entering' ? 'animate-fade-in' : 'opacity-0'}
        `}
        style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
      >
        {t('veto_overlay_line2')}
      </p>

      {/* Dismiss hint */}
      <p
        className="absolute bottom-12 text-white/50 text-xs animate-pulse"
      >
        {t('veto_overlay_dismiss')}
      </p>
    </div>
  );
}
