'use client';

import { useState, useMemo } from 'react';
import { MapPin, Building2, Clock, Send, CheckCircle2, FileText, Settings, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { jobsData, type EmploymentType, type JobPosting } from '@/data/jobs';
import { KEYS, storageGet } from '@/lib/storage';

const TYPE_TKEY: Record<string, string> = {
  'Full-time': 'jobs_type_Fulltime',
  'Part-time': 'jobs_type_Parttime',
  Seasonal: 'jobs_type_Seasonal',
  Contract: 'jobs_type_Contract',
};

const MODE_TKEY: Record<string, string> = {
  'On-site': 'jobs_mode_Onsite',
  Remote: 'jobs_mode_Remote',
  Hybrid: 'jobs_mode_Hybrid',
};

const TYPE_COLORS: Record<string, string> = {
  'Full-time': '#22C55E',
  'Part-time': '#3B82F6',
  Seasonal: '#F59E0B',
  Contract: '#A855F7',
};
const MODE_COLORS: Record<string, string> = {
  'On-site': '#06B6D4',
  Remote: '#6366F1',
  Hybrid: '#EC4899',
};

type FilterType = EmploymentType | 'all';

/** Shared placeholder used when a posting has no specific details PDF. */
const JOB_DETAILS_PDF = '/docs/job-details.pdf';

interface ApplyNotif {
  jobTitle: string;
  hasCv: boolean;
}

export default function JobsTab() {
  const { t, lang, setActiveTab } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [notif, setNotif] = useState<ApplyNotif | null>(null);

  const types: FilterType[] = ['all', 'Full-time', 'Part-time', 'Seasonal', 'Contract'];

  const filtered = useMemo(
    () => filter === 'all' ? jobsData : jobsData.filter((j) => j.employmentType === filter),
    [filter]
  );

  const handleApply = (job: JobPosting) => {
    const cv = storageGet<string>(KEYS.cvFilename, '');
    setNotif({ jobTitle: job.title[lang], hasCv: !!cv });
  };

  return (
    <>
      <div className="h-full scroll-area">
        <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
          {/* Header */}
          <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1 mb-4">
            {t('jobs_title')}
          </h1>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 mb-4" style={{ scrollbarWidth: 'none' }}>
            {types.map((type) => {
              const active = filter === type;
              const color = type !== 'all' ? TYPE_COLORS[type] : undefined;
              const label = type === 'all' ? t('jobs_all') : t(TYPE_TKEY[type]);
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${active && !color ? 'bg-primary text-white border-primary' : active && color ? 'text-white border-transparent' : 'bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]'}`}
                  style={active && color ? { backgroundColor: color, borderColor: color } : undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 ml-1">
            {filtered.length} {lang === 'el' ? 'αγγελίες' : 'listings'}
          </p>

          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">{t('jobs_no_results')}</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((job) => (
                <article
                  key={job.id}
                  onClick={() => window.open(job.detailsPdf ?? JOB_DETAILS_PDF, '_blank', 'noopener,noreferrer')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      window.open(job.detailsPdf ?? JOB_DETAILS_PDF, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="bg-white dark:bg-[#141929] rounded-2xl p-4 border border-gray-100 dark:border-[#1E2D4E] shadow-sm cursor-pointer hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <Badge color={TYPE_COLORS[job.employmentType]}>{t(TYPE_TKEY[job.employmentType])}</Badge>
                    <Badge color={MODE_COLORS[job.workMode]}>{t(MODE_TKEY[job.workMode])}</Badge>
                  </div>
                  <h2 className="font-bold text-[15px] text-gray-900 dark:text-white leading-snug mb-1">
                    {job.title[lang]}
                  </h2>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{job.company[lang]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">{job.location}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-3">
                    {job.description[lang]}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-gray-300 dark:text-gray-600" />
                      <span className="text-[11px] text-gray-300 dark:text-gray-600">
                        {t('jobs_posted')} {job.postedAt[lang]}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApply(job); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-600 active:scale-95 transition-all shadow-sm shadow-primary/30"
                    >
                      <Send size={11} />
                      {t('jobs_apply')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apply notification modal */}
      {notif && (
        <ApplyModal
          notif={notif}
          t={t}
          lang={lang}
          onClose={() => setNotif(null)}
          onSettings={() => { setNotif(null); setActiveTab('account'); }}
        />
      )}
    </>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: color + '18', color }}>
      {children}
    </span>
  );
}

function ApplyModal({
  notif,
  t,
  lang,
  onClose,
  onSettings,
}: {
  notif: ApplyNotif;
  t: (k: string) => string;
  lang: 'el' | 'en';
  onClose: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-[#141929] rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Success header */}
        <div className="bg-primary px-6 pt-6 pb-5 text-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} className="text-white" />
          </div>
          <h3 className="font-black text-[18px] text-white">{t('apply_notif_title')}</h3>
          <p className="text-blue-100 text-[13px] mt-1">{t('apply_notif_for')} {notif.jobTitle}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {notif.hasCv ? (
            <div className="flex items-start gap-3 p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl">
              <FileText size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-400">{t('apply_notif_cv_yes')}</p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl">
              <FileText size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">{t('apply_notif_cv_no')}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {!notif.hasCv && (
              <button
                onClick={onSettings}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-primary text-primary dark:text-primary-300 font-bold text-[13px] active:scale-95 transition-transform"
              >
                <Settings size={14} />
                {t('apply_notif_settings')}
              </button>
            )}
            <button
              onClick={onClose}
              className={`flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-white font-bold text-[13px] active:scale-95 transition-transform ${notif.hasCv ? 'w-full' : 'flex-1'}`}
            >
              <X size={14} />
              {t('apply_notif_ok')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
