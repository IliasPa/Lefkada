"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Library as LibraryIcon,
  GraduationCap,
  ExternalLink,
  FileText,
  User,
  Navigation,
  MapPin,
  Trophy,
  CalendarDays,
  Dices,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import AnimatedSegmented from "@/components/AnimatedSegmented";
import GameTab from "@/components/tabs/GameTab";
import { ebooksData } from "@/data/ebooks";
import { placesData } from "@/data/places";
import { lessonsData, LESSON_CATEGORIES, roboticsCompetitions, type LessonCategory } from "@/data/education";

type Lang = "el" | "en";
type Mode = "lessons" | "ebooks" | "libraries" | "game";

const EBOOKS_URL = "https://lefkada.gov.gr/books/ebooks/";
const PAGE = 8;

export default function EducationTab() {
  const { t, lang } = useApp();
  const [mode, setMode] = useState<Mode>("lessons");

  const subtabs = [
    { key: "lessons", label: t("edu_lessons"), icon: <GraduationCap size={13} /> },
    { key: "ebooks", label: t("edu_ebooks"), icon: <BookOpen size={13} /> },
    { key: "libraries", label: t("edu_libraries"), icon: <LibraryIcon size={13} /> },
    { key: "game", label: t("edu_game"), icon: <Dices size={13} /> },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 max-w-3xl mx-auto w-full flex-shrink-0">
        <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1 mb-2">
          {t("tab_education")}
        </h1>
        <AnimatedSegmented options={subtabs} value={mode} onChange={(k) => setMode(k as Mode)} size="sm" fullWidth />
      </div>

      {mode === "game" ? (
        <div className="flex-1 min-h-0">
          <GameTab />
        </div>
      ) : (
        <div className="flex-1 min-h-0 scroll-area">
          <div className="px-4 pt-2 pb-6 max-w-3xl mx-auto">
            {mode === "ebooks" && <EbooksView lang={lang} t={t} />}
            {mode === "libraries" && <LibrariesView lang={lang} t={t} />}
            {mode === "lessons" && <LessonsView lang={lang} t={t} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ebooks ───────────────────────────────────────────────────────────────────
function EbooksView({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  const [limit, setLimit] = useState(PAGE);
  const books = ebooksData;
  return (
    <>
      <a
        href={EBOOKS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-primary text-white shadow-sm shadow-primary/30 active:scale-[0.99] transition-transform mb-3"
      >
        <BookOpen size={18} className="flex-shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-bold">{t("edu_ebooks_portal")}</span>
          <span className="block text-[11px] opacity-90">{t("edu_ebooks_portal_sub")}</span>
        </span>
        <ExternalLink size={15} className="flex-shrink-0 opacity-90" />
      </a>

      <div className="space-y-3">
        {books.slice(0, limit).map((b, i) => (
          <article key={i} className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
            <div className="flex gap-3 p-3">
              {b.cover && (
                <img
                  src={b.cover}
                  alt=""
                  loading="lazy"
                  className="w-20 h-28 object-cover rounded-lg flex-shrink-0 bg-gray-100 dark:bg-[#10141F]"
                />
              )}
              <div className="min-w-0 flex-1 flex flex-col">
                <h2 className="font-bold text-[14px] text-gray-900 dark:text-white leading-snug">{b.title[lang]}</h2>
                {b.author && (
                  <p className="flex items-center gap-1 text-[11.5px] font-semibold text-primary dark:text-primary-300 mt-0.5">
                    <User size={11} className="flex-shrink-0" />
                    {b.author}
                  </p>
                )}
                <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1 line-clamp-3">{b.desc[lang]}</p>
                {b.pdf && (
                  <a
                    href={b.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#252A3A] hover:bg-gray-200 dark:hover:bg-[#2E3548] transition-colors active:scale-95 mt-2"
                  >
                    <FileText size={12} />
                    {t("edu_read_pdf")}
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {books.length > limit && (
        <button
          onClick={() => setLimit((n) => n + PAGE)}
          className="w-full mt-4 py-2.5 rounded-xl text-[13px] font-bold text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-[0.98]"
        >
          {t("gov_load_more")} ({books.length - limit})
        </button>
      )}
    </>
  );
}

// ── Libraries (shared with Culture ▸ Cultural spaces) ─────────────────────────
function LibrariesView({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  const { setActiveTab, setCultureIntent } = useApp();
  const libraries = useMemo(() => placesData.filter((p) => p.category === "Library"), []);
  return (
    <>
      <button
        onClick={() => { setCultureIntent("Library"); setActiveTab("culture"); }}
        className="w-full flex items-center gap-2.5 p-3.5 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary/20 active:scale-[0.99] transition-transform mb-3"
      >
        <MapPin size={17} className="text-primary dark:text-primary-300 flex-shrink-0" />
        <span className="flex-1 text-left text-[12.5px] font-bold text-primary dark:text-primary-300">{t("edu_libraries_map")}</span>
        <ExternalLink size={14} className="text-primary dark:text-primary-300 flex-shrink-0 opacity-80" />
      </button>

      <div className="space-y-3">
        {libraries.map((p) => {
          const directions = `https://www.google.com/maps/dir/?api=1&destination=${p.coords[0]},${p.coords[1]}`;
          return (
            <article key={p.id} className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#2563EB18", color: "#2563EB" }}>
                    <LibraryIcon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-[14.5px] text-gray-900 dark:text-white leading-snug">{p.name[lang]}</h2>
                    <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1">{p.description[lang]}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#252A3A] hover:bg-gray-200 dark:hover:bg-[#2E3548] transition-colors active:scale-95">
                    <Navigation size={12} />
                    {t("edu_directions")}
                  </a>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-95">
                      <ExternalLink size={12} />
                      {t("edu_more")}
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

// ── Lessons (sports / hobbies / school help / robotics) ───────────────────────
function LessonsView({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  const [cat, setCat] = useState<LessonCategory | "all">("all");
  const [showOld, setShowOld] = useState(false);
  const shown = cat === "all" ? lessonsData : lessonsData.filter((l) => l.category === cat);
  const catAccent = (c: LessonCategory) => LESSON_CATEGORIES.find((x) => x.key === c)!.accent;
  const comps = roboticsCompetitions.filter((c) => showOld || !c.past);

  return (
    <>
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
        {[{ key: "all" as const, label: { el: "Όλα", en: "All" }, accent: "#6B7280" }, ...LESSON_CATEGORIES].map((o) => {
          const active = cat === o.key;
          return (
            <button
              key={o.key}
              onClick={() => setCat(o.key as LessonCategory | "all")}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95"
              style={active ? { backgroundColor: o.accent, color: "#fff", borderColor: o.accent } : { borderColor: o.accent + "55", color: o.accent }}
            >
              {(o.label as { el: string; en: string })[lang]}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {shown.map((l) => {
          const accent = catAccent(l.category);
          return (
            <article key={l.id} className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
              <div className="h-1 w-full" style={{ backgroundColor: accent }} />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: accent + "18", color: accent }}>
                    {LESSON_CATEGORIES.find((x) => x.key === l.category)!.label[lang]}
                  </span>
                  {l.ages && <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{l.ages}</span>}
                </div>
                <h2 className="font-bold text-[14.5px] text-gray-900 dark:text-white leading-snug">{l.title[lang]}</h2>
                <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1">{l.desc[lang]}</p>
                {l.when && <p className="text-[11.5px] font-semibold text-primary dark:text-primary-300 mt-2">{l.when[lang]}</p>}

                {/* Robotics: competitions the programme targets */}
                {l.category === "robotics" && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#1E2D4E]">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                      <Trophy size={12} /> {t("edu_competitions")}
                    </p>
                    <div className="space-y-2">
                      {comps.map((c) => (
                        <div key={c.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.past ? "bg-gray-50 dark:bg-[#10141F] opacity-70" : "bg-purple-50 dark:bg-purple-900/20"}`}>
                          <CalendarDays size={13} className="flex-shrink-0 text-purple-500" />
                          <span className="flex-1 min-w-0 text-[12px] font-semibold text-gray-700 dark:text-gray-300">{c.title[lang]}</span>
                          <span className="text-[10.5px] font-bold text-gray-400 dark:text-gray-500 flex-shrink-0">{c.date}</span>
                          {c.url && (
                            <a href={c.url} target="_blank" rel="noopener noreferrer" aria-label={c.title[lang]} className="flex-shrink-0 text-purple-500 active:scale-90">
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                    {roboticsCompetitions.some((c) => c.past) && (
                      <button
                        onClick={() => setShowOld((v) => !v)}
                        className="mt-2 text-[11px] font-bold text-primary dark:text-primary-300 active:scale-95"
                      >
                        {showOld ? t("edu_hide_old") : t("edu_show_old")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
