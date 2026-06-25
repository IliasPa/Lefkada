"use client";

import { useState } from "react";
import {
  MapPin,
  Building,
  Handshake,
  Route,
  ChevronDown,
  Bus,
  Ship,
  Plane,
  Car,
  CalendarClock,
  ExternalLink,
  Anchor,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  municipalUnits,
  twinCities,
  accessRoutes,
  type AccessMode,
} from "@/data/about";
import AnimatedSegmented from "@/components/AnimatedSegmented";

type Mode = "villages" | "twinning" | "access";
type Lang = "el" | "en";

const MODE_ICON: Record<AccessMode, React.ReactNode> = {
  road: <Car size={18} />,
  bus: <Bus size={18} />,
  ferry: <Ship size={18} />,
  air: <Plane size={18} />,
};

function fmtDate(s: string, lang: Lang) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AboutTab() {
  const { t, lang } = useApp();
  const [mode, setMode] = useState<Mode>("villages");

  const subtabs = [
    { key: "villages", label: t("about_villages"), icon: <Building size={13} /> },
    { key: "twinning", label: t("about_twinning"), icon: <Handshake size={13} /> },
    { key: "access", label: t("about_access"), icon: <Route size={13} /> },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 max-w-3xl mx-auto w-full flex-shrink-0">
        <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1 mb-2">
          {t("about_title")}
        </h1>
        <AnimatedSegmented
          options={subtabs}
          value={mode}
          onChange={(k) => setMode(k as Mode)}
          size="sm"
          fullWidth
        />
      </div>

      <div className="flex-1 min-h-0 scroll-area">
        <div className="px-4 pt-3 pb-6 max-w-3xl mx-auto">
          {mode === "villages" && <VillagesView lang={lang} t={t} />}
          {mode === "twinning" && <TwinningView lang={lang} t={t} />}
          {mode === "access" && <AccessView lang={lang} t={t} />}
        </div>
      </div>
    </div>
  );
}

function VillagesView({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  const [open, setOpen] = useState<string | null>("lefkada");
  return (
    <div className="space-y-2.5">
      {municipalUnits.map((u) => {
        const isOpen = open === u.id;
        return (
          <div
            key={u.id}
            className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setOpen(isOpen ? null : u.id)}
              className="w-full flex items-center gap-3 p-3.5 text-left active:scale-[0.99] transition-transform"
              aria-expanded={isOpen}
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#16A34A18", color: "#16A34A" }}
              >
                {u.island ? <Anchor size={17} /> : <MapPin size={17} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-[14px] text-gray-900 dark:text-white">
                  {u.name[lang]}
                  {u.island && (
                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full align-middle" style={{ backgroundColor: "#0EA5E918", color: "#0EA5E9" }}>
                      {t("about_island")}
                    </span>
                  )}
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                  {t("about_seat")}: {u.seat[lang]} · {u.communities.length} {t("about_communities")}
                </span>
              </span>
              <ChevronDown
                size={17}
                className={`text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="px-3.5 pb-3.5 -mt-1 flex flex-wrap gap-1.5">
                {u.communities.map((c) => (
                  <span
                    key={c.en}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#252A3A] text-gray-600 dark:text-gray-300"
                  >
                    {c[lang]}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TwinningView({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {twinCities.map((c) => (
        <article
          key={c.id}
          className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm p-3.5"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{c.flag}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[14px] text-gray-900 dark:text-white leading-snug">
                {c.city[lang]}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {c.country[lang]} · {c.year}
              </p>
            </div>
          </div>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
            {c.reason[lang]}
          </p>
        </article>
      ))}
    </div>
  );
}

function AccessView({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  return (
    <div className="space-y-3">
      {accessRoutes.map((r) => (
        <article
          key={r.id}
          className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm p-4"
        >
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#0D5EAF18", color: "#0D5EAF" }}
            >
              {MODE_ICON[r.mode]}
            </span>
            <h3 className="font-bold text-[15px] text-gray-900 dark:text-white leading-snug">
              {r.title[lang]}
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-2.5">
            {r.body[lang]}
          </p>
          <div className="flex items-center flex-wrap gap-2 mt-3">
            {r.updated && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#252A3A] px-2 py-1 rounded-lg">
                <CalendarClock size={12} />
                {t("about_updated")}: {fmtDate(r.updated, lang)}
              </span>
            )}
            {r.validUntil && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                <CalendarClock size={12} />
                {t("about_valid_until")}: {fmtDate(r.validUntil, lang)}
              </span>
            )}
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-95"
              >
                <ExternalLink size={12} />
                {r.urlLabel ? r.urlLabel[lang] : t("map_more")}
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
