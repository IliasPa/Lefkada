'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapPin, Building2, Clock, Send, CheckCircle2, FileText, Settings, X, Paperclip } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { jobsData, type EmploymentType, type JobPosting } from '@/data/jobs';
import { KEYS, storageGet } from '@/lib/storage';
import { backendConfigured } from '@/lib/supabase';
import { fetchLiveJobs, mergeById, submitApplication, useLive } from '@/lib/backend';

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
  const [applyJob, setApplyJob] = useState<JobPosting | null>(null);

  const types: FilterType[] = ['all', 'Full-time', 'Part-time', 'Seasonal', 'Contract'];

  // Postings created in /admin come first, then the bundled ones.
  const liveJobs = useLive(fetchLiveJobs);
  const allJobs = useMemo(() => mergeById(liveJobs, jobsData), [liveJobs]);

  const filtered = useMemo(
    () => filter === 'all' ? allJobs : allJobs.filter((j) => j.employmentType === filter),
    [filter, allJobs]
  );

  const handleApply = (job: JobPosting) => {
    if (backendConfigured) {
      // Real application: name/email/CV submitted to the municipality.
      setApplyJob(job);
      return;
    }
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

      {/* Real application form (backend configured) */}
      {applyJob && (
        <ApplyFormModal job={applyJob} t={t} lang={lang} onClose={() => setApplyJob(null)} />
      )}
    </>
  );
}

/** Real job application: name, email and CV file are submitted to the
 *  municipality (Supabase); the mayor reviews them in /admin ▸ Υποψήφιοι. */
function ApplyFormModal({ job, t, lang, onClose }: {
  job: JobPosting;
  t: (k: string) => string;
  lang: 'el' | 'en';
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cv, setCv] = useState<File | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  // Prefill from the locally-stored profile (Settings ▸ Profile) every time
  // the form opens, without overwriting anything already typed.
  useEffect(() => {
    const p = storageGet<{ fullName?: string; email?: string }>(KEYS.profile, {});
    if (p.fullName) setName((v) => v || p.fullName!);
    if (p.email) setEmail((v) => v || p.email!);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    const res = await submitApplication({
      jobId: job.id,
      jobTitle: job.title.el || job.title.en,
      name: name.trim(),
      email: email.trim(),
      cvFile: cv,
    });
    setState(res.ok ? 'done' : 'error');
  };

  const inputCls =
    'w-full px-3.5 py-3 rounded-xl text-[14px] bg-gray-50 dark:bg-[#252A3A] border border-gray-200 dark:border-[#3A4155] ' +
    'text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary ' +
    'focus:ring-1 focus:ring-primary/20 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-[#141929] rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="bg-primary px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-black text-[17px] text-white leading-snug">{t('jobs_apply')}</h3>
              <p className="text-blue-100 text-[13px] mt-1">{job.title[lang]}</p>
            </div>
            <button onClick={onClose} aria-label={t('close')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/80 hover:bg-white/10 active:scale-90 flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        {state === 'done' ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
            <p className="font-bold text-[15px] text-gray-900 dark:text-white">{t('apply_notif_title')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {cv ? t('apply_notif_cv_yes') : ''}
            </p>
            <button onClick={onClose}
              className="mt-4 px-6 py-3 rounded-xl bg-primary text-white font-bold text-[13px] active:scale-95 transition-transform">
              {t('apply_notif_ok')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5 space-y-3">
            <input required value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t('apply_form_name')} autoComplete="name" className={inputCls} />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={t('apply_form_email')} autoComplete="email" className={inputCls} />
            <label className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-dashed border-gray-300 dark:border-[#3A4155] cursor-pointer text-[13px] text-gray-500 dark:text-gray-400">
              <Paperclip size={15} className="flex-shrink-0 text-primary dark:text-primary-300" />
              <span className="truncate">{cv ? cv.name : t('apply_form_cv')}</span>
              <input type="file" accept=".pdf,.doc,.docx,application/pdf" className="hidden"
                onChange={(e) => setCv(e.target.files?.[0] ?? null)} />
            </label>
            {state === 'error' && (
              <p className="text-[12px] font-semibold text-red-500">{t('apply_form_error')}</p>
            )}
            <button type="submit" disabled={state === 'sending'}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold text-[14px] shadow-md shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-60">
              <Send size={15} />
              {state === 'sending' ? t('apply_form_sending') : t('apply_form_submit')}
            </button>
          </form>
        )}
      </div>
    </div>
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
