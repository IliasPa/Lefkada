"use client";

import { useState } from "react";
import { Droplets, FlaskConical, ChevronDown, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { waterAnalyses, type WaterAnalysisType } from "@/data/water";

type Lang = "el" | "en";

function typeLabel(t: (k: string) => string, type: WaterAnalysisType) {
  return type === "micro" ? t("water_micro") : t("water_physico");
}

export default function WaterAnalysesCard() {
  const { t, lang } = useApp();
  const [year, setYear] = useState<number | null>(null);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0EA5E918", color: "#0EA5E9" }}>
          <Droplets size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[13.5px] text-gray-900 dark:text-white leading-snug">
            {t("water_title")}
          </h3>
          <p className="text-[11.5px] text-gray-500 dark:text-gray-400">{t("water_sub")}</p>
        </div>
      </div>

      {/* Year buttons */}
      <div className="flex flex-wrap gap-2 px-4 pb-3">
        {waterAnalyses.map((y) => {
          const active = year === y.year;
          return (
            <button
              key={y.year}
              onClick={() => setYear(active ? null : y.year)}
              aria-expanded={active}
              className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold border transition-all active:scale-95 inline-flex items-center gap-1.5 ${active ? "bg-primary text-white border-primary" : "bg-gray-50 dark:bg-[#10141F] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#252A3A]"}`}
            >
              {y.year}
              <ChevronDown size={14} className={`transition-transform ${active ? "rotate-180" : ""}`} />
            </button>
          );
        })}
      </div>

      {/* Expanded tree */}
      {year !== null && (
        <div className="px-3 pb-4 border-t border-gray-100 dark:border-[#1E2D4E] pt-2">
          {waterAnalyses
            .filter((y) => y.year === year)
            .map((y) => (
              <div key={y.year} className="space-y-3">
                {y.units.map((u, ui) => (
                  <div key={ui}>
                    {/* Municipal unit — visually distinct header */}
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-[12px] font-extrabold uppercase tracking-wide text-primary dark:text-primary-300">
                        {u.name[lang as Lang]}
                      </span>
                    </div>
                    {/* Communities — indented */}
                    <div className="pl-3 ml-1 border-l-2 border-gray-100 dark:border-[#1E2D4E] space-y-2">
                      {u.communities.map((c, ci) => (
                        <Community key={ci} name={c.name[lang as Lang]} pdfs={c.pdfs} t={t} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          <button
            onClick={() => setYear(null)}
            className="mt-3 w-full text-center text-[12px] font-bold text-gray-500 dark:text-gray-400 py-1.5 rounded-lg bg-gray-50 dark:bg-[#10141F] active:scale-[0.99]"
          >
            {t("water_collapse")}
          </button>
        </div>
      )}
    </div>
  );
}

function Community({
  name,
  pdfs,
  t,
}: {
  name: string;
  pdfs: { type: WaterAnalysisType; url: string }[];
  t: (k: string) => string;
}) {
  // Number repeated tests of the same type (e.g. two physico-chemical samples).
  const counts: Record<string, number> = {};
  const total: Record<string, number> = {};
  pdfs.forEach((p) => (total[p.type] = (total[p.type] ?? 0) + 1));
  return (
    <div className="py-0.5">
      <p className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-200 mb-1">{name}</p>
      <div className="flex flex-wrap gap-1.5">
        {pdfs.map((p, i) => {
          counts[p.type] = (counts[p.type] ?? 0) + 1;
          const idx = total[p.type] > 1 ? ` ${counts[p.type]}` : "";
          const color = p.type === "micro" ? "#9333EA" : "#0EA5E9";
          return (
            <a
              key={i}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold active:scale-95 transition-transform"
              style={{ backgroundColor: color + "18", color }}
            >
              {p.type === "micro" ? <FlaskConical size={11} /> : <FileText size={11} />}
              {typeLabel(t, p.type)}{idx}
            </a>
          );
        })}
      </div>
    </div>
  );
}
