'use client';

import { BadgeCheck, BarChart3 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { fetchPublishedResults, useLive } from '@/lib/backend';

/** Official voting-result snapshots the mayor published from /admin (counts
 *  only — the vote rows themselves never leave the mayor-only table). Shown
 *  on the front page under the live alerts; renders nothing while no results
 *  are published or the backend is off. */
export default function PublishedResults() {
  const { t, lang } = useApp();
  const results = useLive(fetchPublishedResults);
  if (!results || results.length === 0) return null;

  return (
    <section aria-label={t('home_results_title')}>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <BarChart3 size={14} className="text-primary dark:text-primary-300" />
        <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-600 dark:text-gray-300">
          {t('home_results_title')}
        </h2>
      </div>
      <div className="space-y-3">
        {results.map((r) => {
          const d = r.data;
          const title = lang === 'el' ? d.title_el : d.title_en || d.title_el;
          // MAIN statistic = municipal-roll Δημότες; while none has voted yet
          // the bars fall back to all votes (older snapshots lack the field).
          const resTotal = d.resident_total ?? 0;
          const mainIsResidents = resTotal > 0;
          const mainTotal = mainIsResidents ? resTotal : d.total;
          return (
            <div key={r.poll_id}
              className="bg-white/90 dark:bg-[#141929]/90 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-[#1E2D4E] shadow-sm p-4">
              <p className="font-bold text-[14.5px] leading-snug text-gray-900 dark:text-white">{title}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 mb-3">
                {t('home_results_official')} · {t('home_results_updated')}{' '}
                {new Date(r.updated_at).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB')}
              </p>
              <div className="space-y-2.5">
                {d.options.map((o) => {
                  const nMain = mainIsResidents ? (o.resident ?? 0) : o.all;
                  const pct = mainTotal ? Math.round((nMain / mainTotal) * 100) : 0;
                  const label = lang === 'el' ? o.label_el : o.label_en || o.label_el;
                  return (
                    <div key={o.id}>
                      <div className="flex justify-between text-[12px] mb-1 gap-2">
                        <span className="font-medium text-gray-600 dark:text-gray-300 min-w-0 leading-snug">{label}</span>
                        <span className="font-bold text-gray-700 dark:text-gray-200 flex-shrink-0">{nMain} · {pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-[#252A3A] overflow-hidden">
                        <div className="h-full rounded-full bg-primary bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 mt-3 flex-wrap">
                {mainIsResidents && (
                  <span className="font-bold text-primary dark:text-primary-300">🏛 {resTotal} {t('home_results_residents')}</span>
                )}
                <span className="font-semibold">{mainIsResidents ? '· ' : ''}{d.total} {t('home_results_total')}</span>
                {(d.verified_total ?? 0) > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    · <BadgeCheck size={12} /> {d.verified_total} {t('home_results_verified')}
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
