"use client";

import { useMemo, useState } from "react";
import { Users, FolderOpen, CalendarDays, FileText, Hash } from "lucide-react";
import { useApp } from "@/context/AppContext";
import SubTabs from "@/components/SubTabs";
import { municipalUnits } from "@/data/about";
import { communityCouncillors } from "@/data/councillors";
import { communityActs } from "@/data/communities";

type Lang = "el" | "en";
type Mode = "acts" | "councillors";

const ACCENT = "#0D5EAF";

function fmtDate(s: string, lang: Lang) {
  const [y, m, d] = s.split("-").map(Number);
  if (!y) return "";
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CommunitiesView() {
  const { t, lang } = useApp();
  const [mode, setMode] = useState<Mode>("acts");
  return (
    <div>
      <SubTabs
        options={[
          { key: "acts", label: t("gov_sec_acts"), icon: <FolderOpen size={13} /> },
          { key: "councillors", label: t("about_councillors"), icon: <Users size={13} /> },
        ]}
        value={mode}
        onChange={(k) => setMode(k as Mode)}
      />

      {mode === "councillors" ? <CouncillorsView lang={lang} t={t} /> : <CommunityActsView lang={lang} t={t} />}
    </div>
  );
}

function CouncillorsView({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#16A34A18", color: "#16A34A" }}>
          <Users size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[13.5px] text-gray-900 dark:text-white leading-snug">{t("about_councillors_title")}</h3>
          <p className="text-[11.5px] text-gray-500 dark:text-gray-400">{t("about_councillors_sub")}</p>
        </div>
      </div>
      <div className="px-3 pb-4 border-t border-gray-100 dark:border-[#1E2D4E] pt-2 space-y-3">
        {municipalUnits.map((u) => {
          const comms = u.communities.filter((c) => communityCouncillors[c.name.en]?.length);
          if (!comms.length) return null;
          return (
            <div key={u.id}>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-[12px] font-extrabold uppercase tracking-wide text-primary dark:text-primary-300">{u.name[lang]}</span>
              </div>
              <div className="pl-3 ml-1 border-l-2 border-gray-100 dark:border-[#1E2D4E] space-y-2.5">
                {comms.map((c) => (
                  <div key={c.name.en} className="py-0.5">
                    <p className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-200 mb-1">{c.name[lang]}</p>
                    <div className="space-y-1 pl-3 ml-0.5 border-l border-gray-100 dark:border-[#1E2D4E]">
                      {communityCouncillors[c.name.en].map((m) => (
                        <div key={m.name} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-[#10141F]">
                          <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{m.name}</span>
                          {m.president && (
                            <span className="text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#16A34A18", color: "#16A34A" }}>
                              {t("about_president")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommunityActsView({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  const [comm, setComm] = useState<string>("all");
  const present = communityActs.filter((c) => c.items.length);
  const items = useMemo(() => {
    const list = present
      .filter((c) => comm === "all" || c.key === comm)
      .flatMap((c) => c.items.map((it) => ({ ...it, commName: c.name })));
    return list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [comm, present]);

  return (
    <div>
      {/* Community tag filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
        {[{ key: "all", name: { el: "Όλες", en: "All" } }, ...present].map((o) => {
          const active = comm === o.key;
          return (
            <button
              key={o.key}
              onClick={() => setComm(o.key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95"
              style={active ? { backgroundColor: ACCENT, color: "#fff", borderColor: ACCENT } : { borderColor: ACCENT + "44", color: ACCENT }}
            >
              {(o.name as { el: string; en: string })[lang]}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">{t("gov_no_results")}</p>
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => (
            <article key={i} className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
              <div className="h-1 w-full" style={{ backgroundColor: ACCENT }} />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ACCENT + "18", color: ACCENT }}>
                    {it.commName[lang]}
                  </span>
                  {it.date && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <CalendarDays size={11} />
                      {fmtDate(it.date, lang)}
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-[15px] text-gray-900 dark:text-white leading-snug">{it.title[lang]}</h2>
                {it.num && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 inline-flex items-center gap-1">
                    <Hash size={13} className="opacity-60" />
                    {lang === "el" ? `Αριθμός ${it.num}` : `No. ${it.num}`}
                  </p>
                )}
                {it.pdf && (
                  <div className="mt-3">
                    <a href={it.pdf} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#252A3A] hover:bg-gray-200 dark:hover:bg-[#2E3548] transition-colors active:scale-95">
                      <FileText size={12} />
                      {t("gov_pdf")}
                    </a>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
