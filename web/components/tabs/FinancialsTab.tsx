"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ExternalLink, X, FileText, GitCompareArrows, Wallet, PiggyBank,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import AnimatedSegmented from "@/components/AnimatedSegmented";
import {
  loadBudgetReports, reportLabel, kaeLabel,
  fmtEur, fmtEurShort, execPct, yearPeriods, monthName, monthShort,
  KAE_COLOR, annualBudgetDocs,
  type BudgetReport, type BudgetSide, type BudgetLine,
} from "@/data/budget";
import type { Lang } from "@/lib/i18n";

const DIAVGEIA_URL = "https://et.diavgeia.gov.gr/f/dimos_lefkadas";

type Mode = "budget" | "compare" | "reports";
type Side = "revenue" | "expenses";

const lineActual = (l: BudgetLine): number => (l.collected ?? l.paid ?? 0);

// ── Donut ────────────────────────────────────────────────────────────────────
function Donut({
  data, centerTop, centerSub, isDark,
}: {
  data: { key: string; value: number; color: string }[];
  centerTop: string; centerSub: string; isDark: boolean;
}) {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0);
  const cx = 120, cy = 120, R = 108, innerR = 62;
  const hole = isDark ? "#141929" : "#ffffff";
  let angle = -Math.PI / 2;
  const slices = data.filter((d) => d.value > 0).map((d) => {
    const pct = total > 0 ? d.value / total : 0;
    const sweep = pct * 2 * Math.PI;
    const s = angle; angle += sweep; const e = angle;
    const x1 = cx + R * Math.cos(s), y1 = cy + R * Math.sin(s);
    const x2 = cx + R * Math.cos(e), y2 = cy + R * Math.sin(e);
    const ix1 = cx + innerR * Math.cos(s), iy1 = cy + innerR * Math.sin(s);
    const ix2 = cx + innerR * Math.cos(e), iy2 = cy + innerR * Math.sin(e);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;
    const mid = s + sweep / 2, lr = (R + innerR) / 2 + 2;
    return { ...d, path, pct: Math.round(pct * 100), lx: cx + lr * Math.cos(mid), ly: cy + lr * Math.sin(mid) };
  });
  return (
    <svg viewBox="0 0 240 240" className="w-full">
      {slices.map((s) => <path key={s.key} d={s.path} fill={s.color} stroke={hole} strokeWidth="2" />)}
      <circle cx={cx} cy={cy} r={innerR} fill={hole} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="800" fill={isDark ? "#f1f5f9" : "#1a1a2e"}>{centerTop}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill={isDark ? "#64748b" : "#94a3b8"}>{centerSub}</text>
      {slices.filter((s) => s.pct >= 8).map((s) => (
        <text key={`l-${s.key}`} x={s.lx} y={s.ly + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" style={{ textShadow: "0 1px 2px rgba(0,0,0,.45)" }}>{s.pct}%</text>
      ))}
    </svg>
  );
}

// ── Execution progress bar ───────────────────────────────────────────────────
function ExecBar({ actual, budgeted, color }: { actual: number; budgeted: number; color: string }) {
  const pct = Math.min(100, Math.max(0, budgeted ? (actual / budgeted) * 100 : 0));
  return (
    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-[#252A3A] overflow-hidden">
      <div className="h-full rounded-full bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ── KPI card (revenue or expenses) ───────────────────────────────────────────
// On the whole-year view it shows actual-vs-annual-budget execution; for a single
// month/quarter the annual budget isn't a meaningful denominator, so it shows the
// period amount only.
function KpiCard({ titleKey, actual, budgeted, color, isYear, t, lang }: {
  titleKey: string; actual: number; budgeted: number; color: string; isYear: boolean; t: (k: string) => string; lang: Lang;
}) {
  return (
    <div className="flex-1 bg-white dark:bg-[#141929] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] p-3.5">
      <p className="text-[10px] font-bold tracking-wide uppercase text-gray-400 dark:text-gray-500">{t(titleKey)}</p>
      <p className="text-[19px] font-black mt-0.5" style={{ color }}>{fmtEurShort(actual, lang)}</p>
      {isYear ? (
        <>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">/ {fmtEurShort(budgeted, lang)} · {execPct(actual, budgeted)}%</p>
          <ExecBar actual={actual} budgeted={budgeted} color={color} />
        </>
      ) : (
        <p className="text-[11px] text-gray-400 dark:text-gray-500">{t("bud_in_period")}</p>
      )}
    </div>
  );
}

// ── Period maths ─────────────────────────────────────────────────────────────
// Reports are cumulative year-to-date. A single month/quarter is the difference
// from the previous boundary; the whole year is the cumulative total itself.
interface ViewLine { code: string; name: string; budgeted: number; actual: number }
interface ViewSide { actual: number; budgeted: number; lines: ViewLine[] }
function periodSide(cur: BudgetSide, prev: BudgetSide | null, key: "collected" | "paid"): ViewSide {
  const pm = new Map((prev?.lines ?? []).map((l) => [l.code, (l[key] ?? 0)]));
  const lines = cur.lines.map((l) => ({
    code: l.code, name: l.name, budgeted: l.budgeted,
    actual: (l[key] ?? 0) - (prev ? (pm.get(l.code) ?? 0) : 0),
  }));
  return { actual: (cur[key] ?? 0) - (prev ? (prev[key] ?? 0) : 0), budgeted: cur.budgeted, lines };
}

// ── BUDGET VIEW ──────────────────────────────────────────────────────────────
function BudgetView({ reports, isDark, t, lang }: { reports: BudgetReport[]; isDark: boolean; t: (k: string) => string; lang: Lang }) {
  const withFigures = useMemo(() => reports.filter((r) => r.revenue && r.expenses), [reports]);
  const years = useMemo(() => Array.from(new Set(withFigures.map((r) => r.year))).sort((a, b) => b - a), [withFigures]);
  const [year, setYear] = useState(years[0]);
  // null = whole year (deselected). Otherwise "m<month>" or "q<quarter>".
  const [sel, setSel] = useState<string | null>(null);
  const [side, setSide] = useState<Side>("revenue");
  const [drill, setDrill] = useState<ViewLine | null>(null);

  const yearMonthly = useMemo(
    () => withFigures.filter((r) => r.kind === "monthly" && r.year === year).sort((a, b) => (a.month ?? 0) - (b.month ?? 0)),
    [withFigures, year],
  );
  const yearQuarterly = useMemo(() => withFigures.filter((r) => r.kind === "quarterly" && r.year === year), [withFigures, year]);

  // Whole-year report per year (latest cumulative month) — drives the cross-year trend.
  const yearWholeReports = useMemo(() => {
    return years.slice().sort((a, b) => a - b).map((y) => {
      const ms = withFigures.filter((r) => r.kind === "monthly" && r.year === y).sort((a, b) => (a.month ?? 0) - (b.month ?? 0));
      const rep = ms[ms.length - 1];
      return rep ? { year: y, report: rep } : null;
    }).filter((x): x is { year: number; report: BudgetReport } => x !== null);
  }, [withFigures, years]);

  // Whole-year = latest cumulative report of the year (Dec if present, else latest month).
  const wholeYear = yearMonthly[yearMonthly.length - 1] ?? yearQuarterly[yearQuarterly.length - 1] ?? null;
  // A quarter exists if its official quarterly report or its quarter-end month exists.
  const quarterReport = (q: number) => yearQuarterly.find((r) => r.quarter === q) ?? yearMonthly.find((r) => r.month === q * 3);
  const quarters = [1, 2, 3, 4].filter((q) => quarterReport(q));

  const report =
    sel === null ? wholeYear
      : sel[0] === "q" ? (quarterReport(Number(sel.slice(1))) ?? wholeYear)
        : (yearMonthly.find((r) => r.month === Number(sel.slice(1))) ?? wholeYear);
  if (!report) return <Empty t={t} />;

  const isYear = sel === null;
  // Reports are cumulative YTD; subtract the previous boundary to isolate a single
  // month/quarter. The whole year keeps the cumulative total.
  let prev: BudgetReport | null = null;
  if (sel && sel[0] === "m") {
    const m = Number(sel.slice(1));
    const priors = yearMonthly.filter((r) => (r.month ?? 0) < m);
    prev = priors.length ? priors[priors.length - 1] : null;
  } else if (sel && sel[0] === "q") {
    const q = Number(sel.slice(1));
    prev = q > 1 ? (quarterReport(q - 1) ?? null) : null;
  }
  const view = {
    revenue: periodSide(report.revenue!, prev?.revenue ?? null, "collected"),
    expenses: periodSide(report.expenses!, prev?.expenses ?? null, "paid"),
  };
  const sideData = side === "revenue" ? view.revenue : view.expenses;
  const cats = sideData.lines.filter((l) => l.code.length === 1 && (l.budgeted > 0 || l.actual !== 0));
  const periodLabel = isYear ? `${t("bud_whole_year")} ${year}`
    : sel![0] === "q" ? `${lang === "el" ? "Τρίμηνο " : "Q"}${sel!.slice(1)} ${year}`
      : `${monthName(report.month ?? 0, lang)} ${year}`;
  const chipCls = (on: boolean) =>
    `px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95 ${on ? "bg-primary text-white shadow-sm" : "bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#252A3A]"}`;
  // Tapping the active chip again clears it → back to whole year.
  const toggle = (k: string) => setSel((p) => (p === k ? null : k));

  return (
    <>
      {/* Period selector — Year segmented + wrapping Whole-year / Quarter / Month chips */}
      <div className="px-4 mb-2.5">
        <AnimatedSegmented
          options={years.map((y) => ({ key: String(y), label: String(y) }))}
          value={String(year)}
          onChange={(k) => { setYear(Number(k)); setSel(null); }}
        />
      </div>
      <div className="px-4 mb-3 flex flex-wrap gap-1.5">
        <button onClick={() => setSel(null)} className={chipCls(sel === null)}>{t("bud_whole_year")}</button>
        {quarters.map((q) => (
          <button key={`q${q}`} onClick={() => toggle(`q${q}`)} className={chipCls(sel === `q${q}`)}>
            {lang === "el" ? "Τ" : "Q"}{q}
          </button>
        ))}
        {yearMonthly.map((r) => (
          <button key={r.id} onClick={() => toggle(`m${r.month}`)} className={chipCls(sel === `m${r.month}`)}>
            {monthShort(r.month!, lang)}
          </button>
        ))}
      </div>

      {/* Period note — single month/quarter figures, or the year total */}
      <p className="px-4 text-[11px] text-gray-400 dark:text-gray-500 mb-3 ml-1">
        <span className="font-semibold text-gray-500 dark:text-gray-400">{periodLabel}</span>
        {" · "}
        {isYear ? t("bud_year_total") : sel![0] === "q" ? t("bud_quarter_only") : t("bud_month_only")}
      </p>

      {/* KPI cards */}
      <div className="px-4 mb-4 flex gap-2.5">
        <KpiCard titleKey="bud_revenue" actual={view.revenue.actual} budgeted={view.revenue.budgeted} isYear={isYear} color="#10B981" t={t} lang={lang} />
        <KpiCard titleKey="bud_expenses" actual={view.expenses.actual} budgeted={view.expenses.budgeted} isYear={isYear} color="#3B82F6" t={t} lang={lang} />
      </div>

      {/* Revenue/Expense toggle — Revenue first */}
      <div className="px-4 mb-3">
        <AnimatedSegmented
          options={[{ key: "revenue", label: t("bud_revenue") }, { key: "expenses", label: t("bud_expenses") }]}
          value={side} onChange={(k) => setSide(k as Side)}
        />
      </div>

      {/* Donut + legend */}
      <div className="px-4 mb-4">
        <div className="bg-white dark:bg-[#141929] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-[150px]">
              <Donut isDark={isDark}
                centerTop={fmtEurShort(sideData.actual, lang)}
                centerSub={t(side === "revenue" ? "bud_collected" : "bud_paid")}
                data={cats.map((c) => ({ key: c.code, value: Math.max(0, c.actual), color: KAE_COLOR[c.code] ?? "#888" }))} />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              {cats.slice().sort((a, b) => b.actual - a.actual).map((c) => (
                <div key={c.code} className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: KAE_COLOR[c.code] ?? "#888" }} />
                  <span className="text-[11px] font-medium leading-tight text-gray-600 dark:text-gray-300 truncate">{kaeLabel(c.code, c.name, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category table */}
      <div className="px-4">
        <div className="bg-white dark:bg-[#141929] rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1E2D4E]">
          {cats.slice().sort((a, b) => b.actual - a.actual).map((c, i) => {
            const col = KAE_COLOR[c.code] ?? "#888";
            return (
              <button key={c.code} onClick={() => setDrill(c)}
                className={`w-full text-left px-4 py-3 active:scale-[0.99] transition hover:bg-gray-50 dark:hover:bg-[#0F1219] ${i < cats.length - 1 ? "border-b border-gray-50 dark:border-[#1A2235]" : ""}`}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-200 truncate">{kaeLabel(c.code, c.name, lang)}</span>
                  <span className="text-[12px] font-bold flex-shrink-0" style={{ color: col }}>{fmtEurShort(c.actual, lang)}</span>
                </div>
                {isYear && (
                  <>
                    <ExecBar actual={c.actual} budgeted={c.budgeted} color={col} />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{t("bud_of_budget")} {fmtEurShort(c.budgeted, lang)}</span>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{execPct(c.actual, c.budgeted)}%</span>
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
        {/* Source link */}
        <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer"
          className="mt-3 mb-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary dark:text-primary-300">
          <FileText size={13} /> {t("bud_source_pdf")} <ExternalLink size={11} />
        </a>
      </div>

      {/* Cross-year trend of each category (the pie slices) */}
      <CategoryTrend yearReports={yearWholeReports} side={side} isDark={isDark} t={t} lang={lang} />

      {drill && <CategoryModal lines={sideData.lines} parent={drill} periodLabel={periodLabel} isYear={isYear} t={t} lang={lang} onClose={() => setDrill(null)} />}
    </>
  );
}

// Drill-down: a top-level category's subcodes for the selected period.
function CategoryModal({ lines, parent, periodLabel, isYear, t, lang, onClose }: {
  lines: ViewLine[]; parent: ViewLine; periodLabel: string; isYear: boolean; t: (k: string) => string; lang: Lang; onClose: () => void;
}) {
  const subs = lines.filter((l) => l.code.length === 2 && l.code[0] === parent.code);
  const c = KAE_COLOR[parent.code] ?? "#888";
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm max-h-[80vh] overflow-y-auto bg-white dark:bg-[#141929] rounded-3xl shadow-2xl animate-slide-up">
        <div className="sticky top-0 bg-white dark:bg-[#141929] p-5 border-b border-gray-100 dark:border-[#1E2D4E]">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-[16px] text-gray-900 dark:text-white leading-snug">{kaeLabel(parent.code, parent.name, lang)}</h3>
            <button onClick={onClose} aria-label={t("close")} className="w-7 h-7 -mr-1 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A] active:scale-90"><X size={16} /></button>
          </div>
          <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">{periodLabel} · {fmtEur(parent.actual, lang)}{isYear ? ` / ${fmtEur(parent.budgeted, lang)}` : ""}</p>
        </div>
        <div className="p-4 space-y-2">
          {subs.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{t("bud_no_subcats")}</p>}
          {subs.map((s) => (
            <div key={s.code} className="bg-gray-50 dark:bg-[#0F1219] rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-200">{kaeLabel(s.code, s.name, lang)}</span>
                <span className="text-[12px] font-bold flex-shrink-0" style={{ color: c }}>{fmtEur(s.actual, lang)}</span>
              </div>
              {isYear && (
                <>
                  <ExecBar actual={s.actual} budgeted={s.budgeted} color={c} />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{t("bud_of_budget")} {fmtEur(s.budgeted, lang)} · {execPct(s.actual, s.budgeted)}%</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Category trend: each pie slice (top-level category) over the years ─────────
function CategoryTrend({ yearReports, side, isDark, t, lang }: {
  yearReports: { year: number; report: BudgetReport }[]; side: Side; isDark: boolean; t: (k: string) => string; lang: Lang;
}) {
  const codes = side === "revenue" ? ["0", "1", "2", "3", "4", "5"] : ["6", "7", "8"];
  const key: "collected" | "paid" = side === "revenue" ? "collected" : "paid";
  const years = yearReports.map((y) => y.year);
  if (years.length < 2) return null;

  const valAt = (report: BudgetReport, code: string) =>
    report[side]!.lines.find((l) => l.code === code)?.[key] ?? 0;
  const series = codes.map((code) => ({
    code,
    name: kaeLabel(code, code, lang),
    color: KAE_COLOR[code] ?? "#888",
    pts: yearReports.map((y) => valAt(y.report, code)),
  })).filter((s) => s.pts.some((v) => v > 0));

  const W = 320, H = 168, PAD = { t: 10, r: 12, b: 22, l: 44 };
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...series.flatMap((s) => s.pts), 1);
  const xPos = (i: number) => PAD.l + (years.length === 1 ? plotW / 2 : (i / (years.length - 1)) * plotW);
  const yPos = (v: number) => PAD.t + plotH - (v / maxVal) * plotH;
  const grid = isDark ? "#1a2235" : "#f3f4f6";
  const axis = isDark ? "#1e2d4e" : "#e5e7eb";
  const lbl = isDark ? "#64748b" : "#9ca3af";

  return (
    <div className="px-4 mb-4">
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-2 ml-1">
        {t(side === "revenue" ? "bud_trend_rev" : "bud_trend_exp")}
      </p>
      <div className="bg-white dark:bg-[#141929] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {[0, 0.5, 1].map((p) => (
            <g key={p}>
              <line x1={PAD.l} y1={PAD.t + plotH * (1 - p)} x2={W - PAD.r} y2={PAD.t + plotH * (1 - p)} stroke={grid} strokeWidth="1" />
              <text x={PAD.l - 4} y={PAD.t + plotH * (1 - p) + 3} textAnchor="end" fontSize="7.5" fill={lbl}>{fmtEurShort(maxVal * p, lang)}</text>
            </g>
          ))}
          {years.map((y, i) => (
            <text key={y} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize="9" fill={lbl}>{y}</text>
          ))}
          {series.map((s) => {
            const d = s.pts.map((v, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(v)}`).join(" ");
            return (
              <g key={s.code}>
                <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {s.pts.map((v, i) => <circle key={i} cx={xPos(i)} cy={yPos(v)} r="2.5" fill={s.color} />)}
              </g>
            );
          })}
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + plotH} stroke={axis} strokeWidth="1" />
          <line x1={PAD.l} y1={PAD.t + plotH} x2={W - PAD.r} y2={PAD.t + plotH} stroke={axis} strokeWidth="1" />
        </svg>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 px-1">
          {series.map((s) => (
            <div key={s.code} className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── COMPARE VIEW ─────────────────────────────────────────────────────────────
interface PeriodOpt { key: string; label: string; sub?: string; report: BudgetReport; }

function CompareView({ reports, t, lang }: { reports: BudgetReport[]; t: (k: string) => string; lang: Lang }) {
  const withFigures = useMemo(() => reports.filter((r) => r.revenue && r.expenses), [reports]);
  const years = useMemo(() => yearPeriods(withFigures), [withFigures]);
  const months = useMemo(() => withFigures.filter((r) => r.kind === "monthly").sort((a, b) => (b.year - a.year) || ((b.month ?? 0) - (a.month ?? 0))), [withFigures]);
  const quarters = useMemo(() => withFigures.filter((r) => r.kind === "quarterly").sort((a, b) => (b.year - a.year) || ((b.quarter ?? 0) - (a.quarter ?? 0))), [withFigures]);

  const yearOpts: PeriodOpt[] = years.map((r) => ({ key: `y-${r.year}`, label: `${r.year}`, sub: r.month && r.month < 12 ? `${t("bud_asof")} ${monthName(r.month, lang)}` : t("bud_fullyear"), report: r }));
  const monthOpts: PeriodOpt[] = months.map((r) => ({ key: `mo-${r.id}`, label: reportLabel(r, lang), report: r }));
  const quarterOpts: PeriodOpt[] = quarters.map((r) => ({ key: `qu-${r.id}`, label: reportLabel(r, lang), report: r }));
  const optMap = useMemo(() => {
    const m: Record<string, PeriodOpt> = {};
    [...yearOpts, ...monthOpts, ...quarterOpts].forEach((o) => { m[o.key] = o; });
    return m;
  }, [reports, lang]);

  // Default: latest two years (or latest two months if no multi-year).
  const [picked, setPicked] = useState<string[]>(() => {
    if (yearOpts.length >= 2) return [yearOpts[yearOpts.length - 1].key, yearOpts[yearOpts.length - 2].key];
    return monthOpts.slice(0, 2).map((o) => o.key);
  });
  const toggle = (k: string) => setPicked((p) => p.includes(k) ? p.filter((x) => x !== k) : p.length >= 3 ? p : [...p, k]);

  const cols = picked.map((k) => optMap[k]).filter(Boolean);

  // Metric rows
  const rev = (r: BudgetReport) => r.revenue!; const exp = (r: BudgetReport) => r.expenses!;
  type Row = { label: string; vals: number[]; pct?: boolean; head?: boolean };
  const rows: Row[] = [];
  rows.push({ label: t("bud_revenue_collected"), vals: cols.map((c) => rev(c.report).collected ?? 0) });
  rows.push({ label: t("bud_revenue_budgeted"), vals: cols.map((c) => rev(c.report).budgeted) });
  rows.push({ label: t("bud_exec"), vals: cols.map((c) => execPct(rev(c.report).collected ?? 0, rev(c.report).budgeted)), pct: true });
  rows.push({ label: t("bud_expenses_paid"), vals: cols.map((c) => exp(c.report).paid ?? 0) });
  rows.push({ label: t("bud_expenses_budgeted"), vals: cols.map((c) => exp(c.report).budgeted) });
  rows.push({ label: t("bud_exec"), vals: cols.map((c) => execPct(exp(c.report).paid ?? 0, exp(c.report).budgeted)), pct: true });
  rows.push({ label: t("bud_balance"), vals: cols.map((c) => (rev(c.report).collected ?? 0) - (exp(c.report).paid ?? 0)) });

  // Top expense categories (6,7,8) collected actuals
  const expCats = ["6", "7", "8"];
  const revCats = ["0", "1", "2"];

  const catRow = (code: string, side: Side): Row => ({
    label: kaeLabel(code, code, lang),
    vals: cols.map((c) => {
      const line = c.report[side]!.lines.find((l) => l.code === code);
      return line ? lineActual(line) : 0;
    }),
  });

  return (
    <div className="px-4">
      {/* Picker */}
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-2 ml-1">
        {t("bud_pick_periods")} <span className="text-gray-300 dark:text-gray-600">· {picked.length}/3</span>
      </p>
      <PickerGroup title={t("bud_years")} opts={yearOpts} picked={picked} toggle={toggle} />
      <PickerGroup title={t("bud_quarters")} opts={quarterOpts} picked={picked} toggle={toggle} />
      <MonthPicker title={t("bud_months")} opts={monthOpts} picked={picked} toggle={toggle} lang={lang} />

      {cols.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-10">{t("bud_pick_hint")}</p>
      ) : (
        <div className="mt-4 bg-white dark:bg-[#141929] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] overflow-hidden">
          {/* Column headers */}
          <div className="grid border-b border-gray-100 dark:border-[#252A3A]" style={{ gridTemplateColumns: `1.3fr ${cols.map(() => "1fr").join(" ")}` }}>
            <div className="px-3 py-2.5" />
            {cols.map((c) => (
              <div key={c.key} className="px-2 py-2.5 text-center border-l border-gray-50 dark:border-[#1A2235]">
                <p className="text-[12px] font-black text-gray-800 dark:text-gray-100 leading-tight">{c.label}</p>
                {c.sub && <p className="text-[9px] text-gray-400">{c.sub}</p>}
              </div>
            ))}
          </div>
          {rows.map((r, i) => (
            <CompareRow key={`r${i}`} label={r.label} vals={r.vals} pct={r.pct} cols={cols.length} lang={lang} />
          ))}
          {/* Section: revenue by category */}
          <SectionLabel text={t("bud_revenue_by_cat")} />
          {revCats.map((code) => { const r = catRow(code, "revenue"); return <CompareRow key={`rc${code}`} label={r.label} vals={r.vals} cols={cols.length} lang={lang} small />; })}
          <SectionLabel text={t("bud_expenses_by_cat")} />
          {expCats.map((code) => { const r = catRow(code, "expenses"); return <CompareRow key={`ec${code}`} label={r.label} vals={r.vals} cols={cols.length} lang={lang} small />; })}
        </div>
      )}
    </div>
  );
}

function PickerGroup({ title, opts, picked, toggle, scroll }: { title: string; opts: PeriodOpt[]; picked: string[]; toggle: (k: string) => void; scroll?: boolean }) {
  if (opts.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-300 dark:text-gray-600 mb-1.5 ml-1">{title}</p>
      <div className={`flex gap-1.5 ${scroll ? "overflow-x-auto pb-1" : "flex-wrap"}`} style={scroll ? { scrollbarWidth: "none" } : undefined}>
        {opts.map((o) => {
          const on = picked.includes(o.key);
          return (
            <button key={o.key} onClick={() => toggle(o.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold border transition active:scale-95 ${on ? "bg-primary text-white border-primary" : "bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]"}`}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Months can span years, so a year sub-selector reveals that year's months as
// wrapping chips — recognisable and never overflowing. Picks are global (max 3).
function MonthPicker({ title, opts, picked, toggle, lang }: { title: string; opts: PeriodOpt[]; picked: string[]; toggle: (k: string) => void; lang: Lang }) {
  const years = useMemo(() => Array.from(new Set(opts.map((o) => o.report.year))).sort((a, b) => b - a), [opts]);
  const [year, setYear] = useState(years[0]);
  if (opts.length === 0) return null;
  const forYear = opts.filter((o) => o.report.year === year);
  return (
    <div className="mb-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-300 dark:text-gray-600 mb-1.5 ml-1">{title}</p>
      <AnimatedSegmented size="sm" options={years.map((y) => ({ key: String(y), label: String(y) }))} value={String(year)} onChange={(k) => setYear(Number(k))} />
      <div className="flex flex-wrap gap-1.5 mt-2">
        {forYear.map((o) => {
          const on = picked.includes(o.key);
          return (
            <button key={o.key} onClick={() => toggle(o.key)}
              className={`px-2.5 py-1.5 rounded-full text-[12px] font-bold border transition active:scale-95 ${on ? "bg-primary text-white border-primary" : "bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]"}`}>
              {o.report.month ? monthShort(o.report.month, lang) : o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CompareRow({ label, vals, pct, cols, lang, small }: { label: string; vals: number[]; pct?: boolean; cols: number; lang: Lang; small?: boolean }) {
  const max = Math.max(...vals.map((v) => Math.abs(v)), 0);
  return (
    <div className="grid items-center border-b border-gray-50 dark:border-[#1A2235] last:border-0" style={{ gridTemplateColumns: `1.3fr ${Array(cols).fill("1fr").join(" ")}` }}>
      <div className={`px-3 py-2.5 ${small ? "text-[11px] text-gray-500 dark:text-gray-400" : "text-[12px] font-semibold text-gray-700 dark:text-gray-200"}`}>{label}</div>
      {vals.map((v, i) => {
        const best = !pct && max > 0 && Math.abs(v) === max && vals.length > 1;
        return (
          <div key={i} className="px-2 py-2.5 text-center border-l border-gray-50 dark:border-[#1A2235]">
            <span className={`text-[12px] ${pct ? "font-bold" : best ? "font-black text-primary dark:text-primary-300" : "font-semibold text-gray-700 dark:text-gray-200"}`}
              style={pct ? { color: v >= 80 ? "#16A34A" : v >= 50 ? "#F59E0B" : "#EF4444" } : undefined}>
              {pct ? `${v}%` : fmtEurShort(v, lang)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="px-3 py-1.5 bg-gray-50 dark:bg-[#0F1219] border-b border-gray-100 dark:border-[#252A3A]">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">{text}</p>
    </div>
  );
}

// ── REPORTS LIBRARY ──────────────────────────────────────────────────────────
function ReportsView({ reports, t, lang }: { reports: BudgetReport[]; t: (k: string) => string; lang: Lang }) {
  const monthly = reports.filter((r) => r.kind === "monthly").sort((a, b) => (b.year - a.year) || ((b.month ?? 0) - (a.month ?? 0)));
  const quarterly = reports.filter((r) => r.kind === "quarterly").sort((a, b) => (b.year - a.year) || ((b.quarter ?? 0) - (a.quarter ?? 0)));

  const Item = ({ r }: { r: BudgetReport }) => (
    <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 active:scale-[0.99] transition hover:bg-gray-50 dark:hover:bg-[#0F1219] border-b border-gray-50 dark:border-[#1A2235] last:border-0">
      <FileText size={16} className="flex-shrink-0 text-primary dark:text-primary-300" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{reportLabel(r, lang)}</p>
        {r.scanned && <p className="text-[10px] text-amber-500">{t("bud_scanned")}</p>}
      </div>
      {!r.scanned && r.revenue && <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 flex-shrink-0">{fmtEurShort(r.revenue.collected ?? 0, lang)}</span>}
      <ExternalLink size={13} className="flex-shrink-0 text-gray-300 dark:text-gray-600" />
    </a>
  );

  return (
    <div className="px-4 space-y-4">
      <Section title={t("bud_monthly_reports")}>
        {monthly.map((r) => <Item key={r.id} r={r} />)}
      </Section>
      <Section title={t("bud_quarterly_reports")}>
        {quarterly.map((r) => <Item key={r.id} r={r} />)}
      </Section>
      <Section title={t("bud_annual_budget")}>
        {annualBudgetDocs.map((d) => (
          <a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 active:scale-[0.99] transition hover:bg-gray-50 dark:hover:bg-[#0F1219] border-b border-gray-50 dark:border-[#1A2235] last:border-0">
            <FileText size={16} className="flex-shrink-0 text-primary dark:text-primary-300" />
            <p className="flex-1 text-[13px] font-semibold text-gray-800 dark:text-gray-200">
              {d.year} · {t(d.side === "revenue" ? "bud_revenue" : "bud_expenses")}
            </p>
            <ExternalLink size={13} className="flex-shrink-0 text-gray-300 dark:text-gray-600" />
          </a>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-2 ml-1">{title}</p>
      <div className="bg-white dark:bg-[#141929] rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1E2D4E]">{children}</div>
    </div>
  );
}

function Empty({ t }: { t: (k: string) => string }) {
  return <p className="text-center text-sm text-gray-400 py-12">{t("bud_empty")}</p>;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const MODES: { key: Mode; tKey: string; Icon: typeof Wallet }[] = [
  { key: "budget", tKey: "bud_mode_budget", Icon: PiggyBank },
  { key: "compare", tKey: "bud_mode_compare", Icon: GitCompareArrows },
  { key: "reports", tKey: "bud_mode_reports", Icon: FileText },
];

export default function FinancialsTab() {
  const { t, theme, lang } = useApp();
  const isDark = theme === "dark";
  const [mode, setMode] = useState<Mode>("budget");
  const [reports, setReports] = useState<BudgetReport[] | null>(null);

  useEffect(() => { loadBudgetReports().then(setReports); }, []);

  return (
    <div className="h-full scroll-area">
      <div className="pb-6 max-w-2xl mx-auto">
        <div className="px-4 pt-4 mb-3 flex items-center justify-between gap-2">
          <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1">{t("fin_title")}</h1>
          <a href={DIAVGEIA_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/40 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition active:scale-95">
            {t("fin_transparency")}<ExternalLink size={12} />
          </a>
        </div>

        {/* Mode tabs — liquid-glass animated segmented, like the other tabs */}
        <div className="px-4 mb-4">
          <AnimatedSegmented fullWidth
            options={MODES.map(({ key, tKey, Icon }) => ({ key, label: t(tKey), icon: <Icon size={14} /> }))}
            value={mode}
            onChange={(k) => setMode(k as Mode)}
          />
        </div>

        {!reports ? (
          <div className="h-40 flex items-center justify-center"><div className="w-7 h-7 rounded-full border-4 border-primary-300 border-t-primary animate-spin" /></div>
        ) : mode === "budget" ? (
          <BudgetView reports={reports} isDark={isDark} t={t} lang={lang} />
        ) : mode === "compare" ? (
          <CompareView reports={reports} t={t} lang={lang} />
        ) : (
          <ReportsView reports={reports} t={t} lang={lang} />
        )}
      </div>
    </div>
  );
}
