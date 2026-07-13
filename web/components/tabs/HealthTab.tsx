'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, Pencil, Check, X, ChevronDown, Phone, MapPin, Navigation, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { healthCategories, type ResultStatus, type YearlyResult } from '@/data/healthTests';
import { pharmaciesData, pharmacyDirectionsUrl } from '@/data/pharmacies';
import { storageGet, storageSet } from '@/lib/storage';
import { backendConfigured } from '@/lib/supabase';
import { fetchPharmacyDuty, useLive } from '@/lib/backend';

const EXAMS_KEY = 'health_exams';
type ExamsStore = Record<string, YearlyResult[]>;

const STATUS_STYLES: Record<ResultStatus, { bg: string; text: string; darkBg: string; darkText: string }> = {
  normal: { bg: '#E8F5E9', text: '#388E3C', darkBg: '#1B3325', darkText: '#69C77A' },
  high:   { bg: '#FFF3E0', text: '#E65100', darkBg: '#3A1E0A', darkText: '#FFB347' },
  low:    { bg: '#EDE7F6', text: '#6A1B9A', darkBg: '#241535', darkText: '#CE93D8' },
};
const STATUS_LABELS: Record<ResultStatus, string> = { normal: 'OK', high: '↑', low: '↓' };

// ── Auto-status from reference range ──────────────────────────────────────────
function autoStatus(value: string, refRange: string): ResultStatus | null {
  const cleanVal = value.replace(/[^0-9.,+-]/g, '').replace(/,/g, '');
  const num = parseFloat(cleanVal);
  if (isNaN(num)) return null;

  // "X–Y" range (handles commas in numbers)
  const rangeM = refRange.match(/([0-9,]+(?:\.[0-9]+)?)\s*[–\-]\s*([0-9,]+(?:\.[0-9]+)?)/);
  if (rangeM) {
    const lo = parseFloat(rangeM[1].replace(/,/g, ''));
    const hi = parseFloat(rangeM[2].replace(/,/g, ''));
    if (num < lo) return 'low';
    if (num > hi) return 'high';
    return 'normal';
  }
  // "<X" format
  const ltM = refRange.match(/^<\s*([0-9,.]+)/);
  if (ltM) {
    return num > parseFloat(ltM[1].replace(/,/g, '')) ? 'high' : 'normal';
  }
  // ">=X" format (handles negative)
  const geM = refRange.match(/^>=\s*([+-]?[0-9,.]+)/);
  if (geM) {
    return num < parseFloat(geM[1].replace(/,/g, '')) ? 'low' : 'normal';
  }
  return null;
}

// For select-type tests: first option = normal, rest = high
function selectStatus(value: string, options: string[]): ResultStatus {
  return value === options[0] ? 'normal' : 'high';
}

function loadExams(): ExamsStore { return storageGet<ExamsStore>(EXAMS_KEY, {}); }

function mergeExams(base: YearlyResult[], overrides?: YearlyResult[]): YearlyResult[] {
  if (!overrides) return base;
  return base.map((r) => overrides.find((o) => o.year === r.year) ?? r);
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HealthTab() {
  const { t, lang, theme } = useApp();
  const isDark = theme === 'dark';
  const [activeCatIdx, setActiveCatIdx] = useState(0);
  const [editingCell, setEditingCell] = useState<{ testId: string; year: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [examsStore, setExamsStore] = useState<ExamsStore>(() => loadExams());
  const [showPharmacies, setShowPharmacies] = useState(false);

  const category = healthCategories[activeCatIdx];

  const handleEditStart = useCallback((testId: string, row: YearlyResult) => {
    setEditingCell({ testId, year: row.year });
    setEditValue(row.value);
  }, []);

  const handleEditSave = useCallback(() => {
    if (!editingCell) return;
    const { testId, year } = editingCell;

    setExamsStore((prev) => {
      const test = healthCategories.flatMap((c) => c.tests).find((t) => t.id === testId);
      if (!test) return prev;

      // Calculate status automatically
      let status: ResultStatus;
      if (test.selectOptions) {
        status = selectStatus(editValue, test.selectOptions);
      } else {
        status = autoStatus(editValue, test.referenceRange) ?? 'normal';
      }

      const base = mergeExams(test.yearlyResults, prev[testId]);
      const updated = base.map((r) => r.year === year ? { ...r, value: editValue, status } : r);
      const next = { ...prev, [testId]: updated };
      storageSet(EXAMS_KEY, next);
      return next;
    });
    setEditingCell(null);
  }, [editingCell, editValue]);

  const handleEditCancel = () => setEditingCell(null);

  return (
    <>
    <div className="h-full scroll-area">
      <div className="pb-6 max-w-2xl mx-auto">
        <div className="px-4 pt-4 mb-3">
          <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1">
            {t('health_exams_section')}
          </h1>
        </div>

        {/* Emergency banner + pharmacy-on-duty button (matched height) */}
        <div className="px-4 mb-4 flex items-stretch gap-3">
          <a href="tel:166"
            className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-white" />
            </div>
            <p className="flex-1 font-bold text-red-700 dark:text-red-400 text-[14px]">
              {t('health_emergency')}
            </p>
            <span className="text-2xl font-black text-red-400 flex-shrink-0">166</span>
          </a>
          <button
            onClick={() => setShowPharmacies(true)}
            aria-label={t('health_pharmacy_aria')}
            title={t('health_pharmacy_aria')}
            className="aspect-[3/1] self-stretch flex items-center justify-center gap-2 px-2 rounded-2xl bg-white dark:bg-white border border-green-300 dark:border-green-700 active:scale-95 transition-transform"
          >
            <img src="/pharmacy-symbol.svg" alt="" className="w-7 h-7 flex-shrink-0" />
            <span className="text-[12px] font-bold text-green-800 leading-tight">
              {t('health_pharmacies')}
            </span>
          </button>
        </div>

        {/* Heads-up: the exam tracker is a preview of an upcoming feature */}
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
            <Clock size={15} className="text-amber-500 flex-shrink-0" />
            <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-300 leading-snug">
              {t('health_future_note')}
            </p>
          </div>
        </div>

        {/* Emoji subtabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto mb-3" style={{ scrollbarWidth: 'none' }}>
          {healthCategories.map((cat, idx) => {
            const active = idx === activeCatIdx;
            return (
              <button key={cat.id} onClick={() => setActiveCatIdx(idx)}
                aria-label={cat.label[lang]}
                aria-pressed={active}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 ${active ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#252A3A]'}`}>
                <span className="text-base" aria-hidden="true">{cat.emoji}</span>
                {active && <span>{cat.label[lang]}</span>}
              </button>
            );
          })}
        </div>

        {/* Test cards */}
        <div className="px-4 space-y-3">
          {category.tests.map((test) => {
            const rows = mergeExams(test.yearlyResults, examsStore[test.id]);
            return (
              <div key={test.id}
                className="bg-white dark:bg-[#141929] rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1E2D4E] shadow-sm">
                {/* Test header */}
                <div className="px-4 pt-4 pb-3">
                  <h3 className="font-bold text-[15px] text-gray-900 dark:text-white">{test.name[lang]}</h3>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {t('health_ref_range')}: <span className="font-semibold text-gray-600 dark:text-gray-300">{test.referenceRange}</span>
                    {test.unit ? ` (${test.unit})` : ''}
                  </p>
                </div>

                {/* Results table */}
                <div className="border-t border-gray-50 dark:border-[#1E2D4E]">
                  {/* Header row */}
                  <div className="grid gap-2 px-4 py-2" style={{ gridTemplateColumns: '48px 1fr 56px 32px' }}>
                    {[t('health_year'), t('health_result'), t('health_status'), ''].map((h, i) => (
                      <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</span>
                    ))}
                  </div>

                  {rows.map((row, rIdx) => {
                    const isEditing = editingCell?.testId === test.id && editingCell.year === row.year;
                    const palette = STATUS_STYLES[row.status];
                    const bg  = isDark ? palette.darkBg  : palette.bg;
                    const fg  = isDark ? palette.darkText : palette.text;

                    // Live preview of auto-status while editing
                    let previewStatus: ResultStatus = 'normal';
                    if (isEditing) {
                      if (test.selectOptions) {
                        previewStatus = selectStatus(editValue, test.selectOptions);
                      } else {
                        previewStatus = autoStatus(editValue, test.referenceRange) ?? 'normal';
                      }
                    }
                    const prevPalette = STATUS_STYLES[previewStatus];
                    const prevBg = isDark ? prevPalette.darkBg  : prevPalette.bg;
                    const prevFg = isDark ? prevPalette.darkText : prevPalette.text;

                    return (
                      <div key={row.year}
                        className={`px-4 py-2.5 ${rIdx < rows.length - 1 ? 'border-b border-gray-50 dark:border-[#1A2235]' : ''}`}>
                        {isEditing ? (
                          /* ── Edit mode ── */
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400 w-10 flex-shrink-0">{row.year}</span>

                              {test.selectOptions ? (
                                /* Dropdown for text-type tests */
                                <div className="relative flex-1">
                                  <select
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    aria-label={`${test.name[lang]} — ${row.year}`}
                                    className="w-full appearance-none pl-3 pr-8 py-2 text-[13px] rounded-lg border border-gray-200 dark:border-[#3A4155] bg-gray-50 dark:bg-[#252A3A] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                  >
                                    {test.selectOptions.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                              ) : (
                                /* Free-text input for numeric tests */
                                <input
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  aria-label={`${test.name[lang]} — ${row.year}`}
                                  className="flex-1 px-2.5 py-1.5 text-[13px] rounded-lg border border-gray-200 dark:border-[#3A4155] bg-gray-50 dark:bg-[#252A3A] text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                  placeholder={test.unit || t('health_edit_value')}
                                  inputMode="decimal"
                                />
                              )}

                              {/* Live auto-status preview */}
                              <span className="text-[11px] font-bold px-2 py-1 rounded-md flex-shrink-0"
                                style={{ backgroundColor: prevBg, color: prevFg }}>
                                {STATUS_LABELS[previewStatus]}
                              </span>
                            </div>

                            {/* Save / Cancel */}
                            <div className="flex gap-2 pl-10">
                              <button onClick={handleEditSave}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[12px] font-bold active:scale-95">
                                <Check size={13} />{t('health_edit_save')}
                              </button>
                              <button onClick={handleEditCancel}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#252A3A] text-gray-600 dark:text-gray-400 text-[12px] font-bold active:scale-95">
                                <X size={13} />{t('health_edit_cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── Display mode ── */
                          <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '48px 1fr 56px 32px' }}>
                            <span className="text-[13px] font-medium text-gray-400 dark:text-gray-500">{row.year}</span>
                            <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-200">
                              {row.value}{row.value && test.unit && !row.value.includes(test.unit) && !test.selectOptions ? ` ${test.unit}` : ''}
                            </span>
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md text-center"
                              style={{ backgroundColor: bg, color: fg }}>
                              {STATUS_LABELS[row.status]}
                            </span>
                            <button onClick={() => handleEditStart(test.id, row)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-primary dark:hover:text-primary-300 hover:bg-gray-100 dark:hover:bg-[#252A3A] transition-colors">
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {showPharmacies && (
      <PharmacyModal lang={lang} t={t} onClose={() => setShowPharmacies(false)} />
    )}
    </>
  );
}

function PharmacyModal({
  lang,
  t,
  onClose,
}: {
  lang: 'el' | 'en';
  t: (k: string) => string;
  onClose: () => void;
}) {
  // Live on-duty schedule (maintained by the pharmacies at /pharmacies).
  // When configured, today's declarations replace the bundled onDuty flags.
  const duty = useLive(fetchPharmacyDuty);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayDuty = (duty ?? []).filter((d) => d.duty_date === todayKey);

  const pharmacies = backendConfigured && duty
    ? pharmaciesData.map((ph) => {
        const row = todayDuty.find((d) => d.pharmacy_id === ph.id);
        return row
          ? { ...ph, onDuty: true, dutyHours: { el: row.hours_el, en: row.hours_en } }
          : { ...ph, onDuty: false, dutyHours: undefined };
      })
    : pharmaciesData;

  // On-duty pharmacies first.
  const list = [...pharmacies].sort(
    (a, b) => Number(!!b.onDuty) - Number(!!a.onDuty),
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#141929] rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1E2D4E]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-white flex items-center justify-center flex-shrink-0">
              <img src="/pharmacy-symbol.svg" alt="" className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-[16px] text-gray-900 dark:text-white">
              {t('health_pharmacies')}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('health_edit_cancel')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A] active:scale-90"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-2.5 overflow-y-auto">
          {list.map((ph) => (
            <div
              key={ph.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                window.open(pharmacyDirectionsUrl(ph), '_blank', 'noopener,noreferrer')
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.open(pharmacyDirectionsUrl(ph), '_blank', 'noopener,noreferrer');
                }
              }}
              className={`rounded-xl p-3.5 border cursor-pointer transition-colors active:scale-[0.99] ${ph.onDuty ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700/50 hover:border-green-500' : 'bg-gray-50 dark:bg-[#0F1219] border-gray-100 dark:border-[#1E2D4E] hover:border-primary/40'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-[14px] text-gray-900 dark:text-white">
                    {ph.name}
                  </p>
                  <p className="flex items-center gap-1 text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                    <MapPin size={11} className="flex-shrink-0" />
                    {ph.area[lang]}
                  </p>
                </div>
                {ph.onDuty && (
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-600 text-white">
                    {t('health_onduty')}
                  </span>
                )}
              </div>
              {ph.onDuty && ph.dutyHours && (
                <p className="text-[11px] font-semibold text-green-700 dark:text-green-400 mt-1.5">
                  {ph.dutyHours[lang]}
                </p>
              )}
              <div className="flex items-center justify-between mt-2.5">
                <a
                  href={`tel:${ph.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-[12px] font-bold hover:bg-primary-600 active:scale-95 transition-all"
                >
                  <Phone size={12} />
                  {ph.phone}
                </a>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-primary dark:text-primary-300">
                  <Navigation size={12} />
                  {t('health_directions')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
