"use client";

import { useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  financialsData,
  incomeData,
  FINANCIAL_CATEGORIES,
  INCOME_CATEGORIES,
  FINANCIAL_YEARS,
  CATEGORY_COLORS,
  INCOME_COLORS,
  type FinancialItem,
} from "@/data/financials";

const CAT_TKEY: Record<string, string> = {
  Infrastructure: "fin_cat_Infrastructure",
  Education: "fin_cat_Education",
  Healthcare: "fin_cat_Healthcare",
  Environment: "fin_cat_Environment",
  Administration: "fin_cat_Administration",
};

const INC_TKEY: Record<string, string> = {
  Taxes: "fin_inc_Taxes",
  Grants: "fin_inc_Grants",
  Tourism: "fin_inc_Tourism",
  Services: "fin_inc_Services",
  Property: "fin_inc_Property",
};

// Each financial aspect (expenses, income, …) is described by this config so the
// same view renders any of them.
interface Aspect {
  items: FinancialItem[];
  categories: readonly string[];
  colors: Record<string, string>;
  catTKey: Record<string, string>;
  totalLabelKey: string;
  pieTitleKey: string;
  lineTitleKey: string;
}

function fmt(n: number) {
  return "€" + n.toLocaleString("el-GR");
}
function fmtK(n: number) {
  return n >= 1000 ? `€${Math.round(n / 1000)}k` : `€${n}`;
}

// ── SVG Donut Chart with % labels ───────────────────────────────────────────────
function DonutChart({
  data,
  year,
  isDark,
}: {
  data: Array<{ cat: string; total: number; color: string }>;
  year: number;
  isDark: boolean;
}) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const cx = 120,
    cy = 120,
    R = 108,
    innerR = 58;
  const holeColor = isDark ? "#141929" : "#F2F5F9";
  const centerTextColor = isDark ? "#f1f5f9" : "#1a1a2e";
  const subColor = isDark ? "#64748b" : "#94a3b8";

  let angle = -Math.PI / 2;
  const slices = data
    .filter((d) => d.total > 0)
    .map((d) => {
      const pct = total > 0 ? d.total / total : 0;
      const sweep = pct * 2 * Math.PI;
      const start = angle;
      angle += sweep;
      const end = angle;

      const x1 = cx + R * Math.cos(start),
        y1 = cy + R * Math.sin(start);
      const x2 = cx + R * Math.cos(end),
        y2 = cy + R * Math.sin(end);
      const ix1 = cx + innerR * Math.cos(start),
        iy1 = cy + innerR * Math.sin(start);
      const ix2 = cx + innerR * Math.cos(end),
        iy2 = cy + innerR * Math.sin(end);
      const large = sweep > Math.PI ? 1 : 0;
      const path = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;

      const midAngle = start + sweep / 2;
      const labelR = (R + innerR) / 2 + 4;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      const labelPct = Math.round(pct * 100);

      return { ...d, path, pct: labelPct, lx, ly, sweep };
    });

  return (
    <svg viewBox="0 0 240 240" className="w-full drop-shadow-sm">
      {/* Gap between slices via stroke trick */}
      {slices.map((s) => (
        <path
          key={s.cat}
          d={s.path}
          fill={s.color}
          stroke={holeColor}
          strokeWidth="2"
        />
      ))}
      {/* Donut hole */}
      <circle cx={cx} cy={cy} r={innerR} fill={holeColor} />

      {/* Center text */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill={centerTextColor}
      >
        {year}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="12" fill={subColor}>
        {fmtK(total)}
      </text>

      {/* % labels on slices — only for slices >= 7% */}
      {slices
        .filter((s) => s.pct >= 7)
        .map((s) => (
          <text
            key={`lbl-${s.cat}`}
            x={s.lx}
            y={s.ly + 4.5}
            textAnchor="middle"
            fontSize="13"
            fontWeight="800"
            fill="white"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
          >
            {s.pct}%
          </text>
        ))}
    </svg>
  );
}

// ── SVG Line Chart ──────────────────────────────────────────────────────────────
function LineChart({
  catYearTotals,
  categories,
  colors,
  isDark,
}: {
  catYearTotals: Record<string, Record<number, number>>;
  categories: readonly string[];
  colors: Record<string, string>;
  isDark: boolean;
}) {
  const years = FINANCIAL_YEARS as readonly number[];
  const W = 320,
    H = 170;
  const PAD = { t: 12, r: 16, b: 28, l: 46 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const allVals = categories.flatMap((cat) =>
    years.map((y) => catYearTotals[cat]?.[y] ?? 0),
  );
  const maxVal = Math.max(...allVals, 1);
  const xPos = (i: number) => PAD.l + (i / (years.length - 1)) * plotW;
  const yPos = (v: number) => PAD.t + plotH - (v / maxVal) * plotH;

  const axisColor = isDark ? "#1e2d4e" : "#e5e7eb";
  const labelColor = isDark ? "#4b5563" : "#9ca3af";
  const gridColor = isDark ? "#1a2235" : "#f3f4f6";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <line
          key={p}
          x1={PAD.l}
          y1={PAD.t + plotH * (1 - p)}
          x2={W - PAD.r}
          y2={PAD.t + plotH * (1 - p)}
          stroke={gridColor}
          strokeWidth="1"
        />
      ))}
      {[0, 0.5, 1].map((p) => (
        <text
          key={p}
          x={PAD.l - 4}
          y={PAD.t + plotH * (1 - p) + 3.5}
          textAnchor="end"
          fontSize="7.5"
          fill={labelColor}
        >
          {fmtK(maxVal * p)}
        </text>
      ))}
      {years.map((y, i) => (
        <text
          key={y}
          x={xPos(i)}
          y={H - 6}
          textAnchor="middle"
          fontSize="8.5"
          fill={labelColor}
        >
          {y}
        </text>
      ))}
      {categories.map((cat) => {
        const pts = years.map((y, i) => ({
          x: xPos(i),
          y: yPos(catYearTotals[cat]?.[y] ?? 0),
        }));
        const d = pts
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ");
        return (
          <g key={cat}>
            <path
              d={d}
              fill="none"
              stroke={colors[cat]}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill={colors[cat]} />
            ))}
          </g>
        );
      })}
      <line
        x1={PAD.l}
        y1={PAD.t}
        x2={PAD.l}
        y2={PAD.t + plotH}
        stroke={axisColor}
        strokeWidth="1"
      />
      <line
        x1={PAD.l}
        y1={PAD.t + plotH}
        x2={W - PAD.r}
        y2={PAD.t + plotH}
        stroke={axisColor}
        strokeWidth="1"
      />
    </svg>
  );
}

// ── A full financial aspect (expenses or income) ─────────────────────────────────
function FinancialView({
  aspect,
  isDark,
  t,
}: {
  aspect: Aspect;
  isDark: boolean;
  t: (k: string) => string;
}) {
  const { items, categories, colors, catTKey } = aspect;
  const [year, setYear] = useState<number>(2025);
  const [category, setCategory] = useState<string>("all");

  const yearItems = useMemo(
    () => items.filter((i) => i.year === year),
    [items, year],
  );

  const catTotals = useMemo(
    () =>
      categories.map((cat) => ({
        cat,
        total: yearItems
          .filter((i) => i.category === cat)
          .reduce((s, i) => s + i.totalPrice, 0),
        color: colors[cat],
      })),
    [yearItems, categories, colors],
  );

  const grandTotal = catTotals.reduce((s, c) => s + c.total, 0);

  const catYearTotals = useMemo(() => {
    const r: Record<string, Record<number, number>> = {};
    categories.forEach((cat) => {
      r[cat] = {};
      FINANCIAL_YEARS.forEach((y) => {
        r[cat][y] = items
          .filter((i) => i.year === y && i.category === cat)
          .reduce((s, i) => s + i.totalPrice, 0);
      });
    });
    return r;
  }, [items, categories]);

  const filtered = useMemo(
    () =>
      category === "all"
        ? yearItems
        : yearItems.filter((i) => i.category === category),
    [yearItems, category],
  );

  const labelColor = isDark ? "#e2e8f0" : "#374151";

  return (
    <>
      {/* Year selector */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 px-4 mb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {FINANCIAL_YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${year === y ? "bg-primary text-white shadow-sm" : "bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#252A3A]"}`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Total card */}
      <div className="px-4 mb-4">
        <div className="bg-primary rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-blue-200" />
            <span className="text-[11px] font-bold tracking-widest text-blue-200 uppercase">
              {t(aspect.totalLabelKey)} {year}
            </span>
          </div>
          <p className="text-3xl font-black">{fmt(grandTotal)}</p>
        </div>
      </div>

      {/* ── Charts section ── */}
      <div className="px-4 mb-4">
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-3 ml-1">
          {t("fin_chart_section")}
        </p>

        <div className="bg-white dark:bg-[#141929] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] overflow-hidden">
          {/* Donut + legend side-by-side */}
          <div className="p-4 border-b border-gray-50 dark:border-[#1E2D4E]">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3">
              {t(aspect.pieTitleKey)} {year}
            </p>
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1" />
              <div className="flex-shrink-0 w-[180px]">
                <DonutChart data={catTotals} year={year} isDark={isDark} />
              </div>
              <div className="flex-1 space-y-2.5 min-w-0 flex flex-col">
                {catTotals.map(({ cat, color }) => (
                  <div key={cat} className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className="text-[11px] font-medium leading-tight"
                      style={{ color: labelColor }}
                    >
                      {t(catTKey[cat])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Line chart */}
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3">
              {t(aspect.lineTitleKey)} (2022–2025)
            </p>
            <LineChart
              catYearTotals={catYearTotals}
              categories={categories}
              colors={colors}
              isDark={isDark}
            />
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 px-4 mb-3"
        style={{ scrollbarWidth: "none" }}
      >
        <button
          onClick={() => setCategory("all")}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${category === "all" ? "bg-primary text-white border-primary" : "bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]"}`}
        >
          {t("fin_all_cats")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${category === cat ? "text-white border-transparent" : "bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]"}`}
            style={
              category === cat
                ? { backgroundColor: colors[cat], borderColor: colors[cat] }
                : undefined
            }
          >
            {t(catTKey[cat])}
          </button>
        ))}
      </div>

      {/* Detail table */}
      <div className="px-4">
        <div className="bg-white dark:bg-[#141929] rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1E2D4E]">
          <div className="grid grid-cols-[1fr_60px_60px_70px] gap-1 px-4 py-2.5 bg-gray-50 dark:bg-[#0F1219] border-b border-gray-100 dark:border-[#252A3A]">
            {[
              t("fin_item"),
              t("fin_unit"),
              t("fin_qty"),
              t("fin_total_col"),
            ].map((h, i) => (
              <span
                key={i}
                className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i > 0 ? "text-right" : ""}`}
              >
                {h}
              </span>
            ))}
          </div>
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className={`grid grid-cols-[1fr_60px_60px_70px] gap-1 px-4 py-3 ${idx < filtered.length - 1 ? "border-b border-gray-50 dark:border-[#1A2235]" : ""}`}
            >
              <div>
                <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                  {item.name}
                </p>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block"
                  style={{
                    backgroundColor: (colors[item.category] ?? "#888") + "18",
                    color: colors[item.category] ?? "#888",
                  }}
                >
                  {t(catTKey[item.category])}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 text-right self-center">
                €{item.itemPrice.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 text-right self-center">
                ×{item.quantity}
              </p>
              <p className="text-[12px] font-bold text-gray-800 dark:text-gray-200 text-right self-center">
                €{item.totalPrice.toLocaleString()}
              </p>
            </div>
          ))}
          {filtered.length > 0 && (
            <div className="grid grid-cols-[1fr_60px_60px_70px] gap-1 px-4 py-3 bg-gray-50 dark:bg-[#0F1219] border-t-2 border-gray-200 dark:border-[#252A3A]">
              <p className="text-[12px] font-black text-gray-700 dark:text-gray-300 col-span-3">
                {t("fin_total_col")}
              </p>
              <p className="text-[12px] font-black text-primary dark:text-primary-300 text-right">
                €
                {filtered
                  .reduce((s, i) => s + i.totalPrice, 0)
                  .toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────────
type SubTab = "expenses" | "income";

const ASPECTS: Record<SubTab, Aspect> = {
  expenses: {
    items: financialsData,
    categories: FINANCIAL_CATEGORIES,
    colors: CATEGORY_COLORS,
    catTKey: CAT_TKEY,
    totalLabelKey: "fin_total_spending",
    pieTitleKey: "fin_pie_title",
    lineTitleKey: "fin_line_title",
  },
  income: {
    items: incomeData,
    categories: INCOME_CATEGORIES,
    colors: INCOME_COLORS,
    catTKey: INC_TKEY,
    totalLabelKey: "fin_total_income",
    pieTitleKey: "fin_income_dist",
    lineTitleKey: "fin_income_trends",
  },
};

const SUBTABS: Array<{ key: SubTab; tKey: string }> = [
  { key: "expenses", tKey: "fin_sub_expenses" },
  { key: "income", tKey: "fin_sub_income" },
];

export default function FinancialsTab() {
  const { t, theme } = useApp();
  const isDark = theme === "dark";
  // Expenses shown by default.
  const [sub, setSub] = useState<SubTab>("expenses");

  return (
    <div className="h-full scroll-area">
      <div className="pb-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="px-4 pt-4 mb-3">
          <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1">
            {t("fin_title")}
          </h1>
        </div>

        {/* Sub-tabs: financial aspects (expenses / income) */}
        <div className="px-4 mb-4">
          <div className="inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-[#0F1219] border border-gray-200 dark:border-[#252A3A]">
            {SUBTABS.map(({ key, tKey }) => {
              const active = sub === key;
              return (
                <button
                  key={key}
                  onClick={() => setSub(key)}
                  className={`px-5 py-1.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${active ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {t(tKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keying by sub remounts the view so its year/category state resets per aspect */}
        <FinancialView key={sub} aspect={ASPECTS[sub]} isDark={isDark} t={t} />
      </div>
    </div>
  );
}
