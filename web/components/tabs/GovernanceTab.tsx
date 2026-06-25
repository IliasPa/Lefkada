"use client";

import { useMemo, useState } from "react";
import {
  Search,
  X,
  Gavel,
  FileSignature,
  Megaphone,
  Video,
  Clock,
  Briefcase,
  CalendarDays,
  FileText,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  governanceData,
  GOV_ACCENT,
  GOV_TYPES,
  type GovItem,
  type GovType,
} from "@/data/governance";
import AnimatedSegmented from "@/components/AnimatedSegmented";

type Lang = "el" | "en";

const TYPE_ICON: Record<GovType, React.ReactNode> = {
  Decision: <Gavel size={13} />,
  Tender: <FileSignature size={13} />,
  Announcement: <Megaphone size={13} />,
  Meeting: <Video size={13} />,
};

function daysLeft(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}
function fmtDate(s: string, lang: Lang) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(
    lang === "el" ? "el-GR" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

export default function GovernanceTab() {
  const { t, lang } = useApp();
  const [type, setType] = useState<GovType | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return governanceData
      .filter((g) => type === "all" || g.type === type)
      .filter((g) => {
        if (!q) return true;
        return [g.title.el, g.title.en, g.summary.el, g.summary.en]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [type, query]);

  return (
    <div className="h-full scroll-area">
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
        <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1 mb-3">
          {t("gov_title")}
        </h1>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder={t("gov_search")}
            aria-label={t("gov_search")}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[14px] bg-white dark:bg-[#141929] border border-gray-200 dark:border-[#252A3A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label={t("close")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A] active:scale-90"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Type filter (animated segmented, full-width so the indicator isn't clipped) */}
        <div className="mb-4">
          <AnimatedSegmented
            options={[
              { key: "all", label: t("gov_f_all") },
              ...GOV_TYPES.map((ty) => ({ key: ty, label: t("gov_f_" + ty), icon: TYPE_ICON[ty] })),
            ]}
            value={type}
            onChange={(k) => setType(k as GovType | "all")}
            size="sm"
            fullWidth
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">
            {t("gov_no_results")}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((g) => (
              <GovCard key={g.id} g={g} lang={lang} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GovCard({
  g,
  lang,
  t,
}: {
  g: GovItem;
  lang: Lang;
  t: (k: string) => string;
}) {
  const { setActiveTab } = useApp();
  const accent = GOV_ACCENT[g.type];
  const [watch, setWatch] = useState(false);

  return (
    <article className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: accent + "18", color: accent }}
          >
            {TYPE_ICON[g.type]}
            {t("gov_b_" + g.type)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <CalendarDays size={11} />
            {fmtDate(g.date, lang)}
          </span>
        </div>

        <h2 className="font-bold text-[15px] text-gray-900 dark:text-white leading-snug">
          {g.title[lang]}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">
          {g.summary[lang]}
        </p>

        {/* Tender: deadline + status + optional job link */}
        {g.type === "Tender" && g.deadline && (
          <div className="flex items-center flex-wrap gap-2 mt-3">
            {(() => {
              const d = daysLeft(g.deadline!);
              const open = d >= 0;
              return (
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${open ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-[#252A3A] text-gray-500 dark:text-gray-400"}`}
                >
                  {open
                    ? `${t("gov_closes_in")} ${d} ${t("gov_days")}`
                    : t("gov_closed")}
                </span>
              );
            })()}
            {g.jobId && (
              <button
                onClick={() => setActiveTab("jobs")}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-95"
              >
                <Briefcase size={12} />
                {t("gov_view_job")}
              </button>
            )}
          </div>
        )}

        {/* Meeting: time + watch + agenda/minutes */}
        {g.type === "Meeting" && (
          <>
            {watch && g.youtubeId && (
              <div
                className="relative w-full overflow-hidden rounded-xl bg-black mt-3"
                style={{ aspectRatio: "16 / 9" }}
              >
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${g.youtubeId}?modestbranding=1&rel=0`}
                  title={g.title[lang]}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}
            <div className="flex items-center flex-wrap gap-2 mt-3">
              {g.time && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  <Clock size={12} />
                  {g.time}
                </span>
              )}
              {g.youtubeId && (
                <button
                  onClick={() => setWatch((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-white"
                  style={{ backgroundColor: accent }}
                >
                  <Video size={12} />
                  {t("gov_watch")}
                </button>
              )}
              {g.agendaPdf && (
                <GovPdf url={g.agendaPdf} label={t("gov_agenda")} />
              )}
              {g.minutesPdf && (
                <GovPdf url={g.minutesPdf} label={t("gov_minutes")} />
              )}
            </div>
          </>
        )}

        {/* Generic PDF for decisions/announcements/tenders */}
        {g.pdfUrl && (
          <div className="mt-3">
            <GovPdf url={g.pdfUrl} label={t("gov_pdf")} />
          </div>
        )}
      </div>
    </article>
  );
}

function GovPdf({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#252A3A] hover:bg-gray-200 dark:hover:bg-[#2E3548] transition-colors active:scale-95"
    >
      <FileText size={12} />
      {label}
    </a>
  );
}
