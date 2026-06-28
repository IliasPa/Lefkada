"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  CalendarDays,
  List,
  MapPin,
  Map as MapIcon,
  Building2,
  ScrollText,
  ExternalLink,
  Navigation,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  eventsData,
  EVENT_IMAGES,
  EVENT_ACCENT,
  type CultureEvent,
} from "@/data/events";
import {
  placesData,
  CULTURAL_PLACE_CATEGORIES,
  PLACE_IMAGES,
  PLACE_ACCENT,
  type Place,
} from "@/data/places";
import { historyData, HISTORY_ACCENT, historicalReferences, type HistoryEntry } from "@/data/history";
import AnimatedSegmented from "@/components/AnimatedSegmented";

const LazyMap = dynamic(() => import("@/components/LefkadaMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-4 border-primary-300 border-t-primary animate-spin" />
    </div>
  ),
});

type Mode = "events" | "calendar" | "history" | "spaces" | "map";
type Lang = "el" | "en";

// ── date helpers (local, ISO yyyy-mm-dd) ─────────────────────────────────────
function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function eachDay(start: string, end: string) {
  const out: string[] = [];
  let d = parseISO(start);
  const e = parseISO(end);
  while (d <= e) {
    out.push(toKey(d));
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  }
  return out;
}
function fmtDate(s: string, lang: Lang, withYear = true) {
  return parseISO(s).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
}
function fmtRange(ev: CultureEvent, lang: Lang) {
  if (!ev.endDate) return fmtDate(ev.date, lang);
  return `${fmtDate(ev.date, lang, false)} – ${fmtDate(ev.endDate, lang)}`;
}

const WEEKDAYS: Record<Lang, string[]> = {
  el: ["Δε", "Τρ", "Τε", "Πε", "Πα", "Σα", "Κυ"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

export default function CultureTab() {
  const { t, lang, cultureIntent, setCultureIntent } = useApp();
  const [mode, setMode] = useState<Mode>("events");
  const [spacesCat, setSpacesCat] = useState<string>("all");

  // Deep-link from Education ▸ Libraries: open Cultural spaces filtered to a category.
  useEffect(() => {
    if (!cultureIntent) return;
    setMode("spaces");
    setSpacesCat(cultureIntent);
    setCultureIntent(null);
  }, [cultureIntent, setCultureIntent]);

  const todayKey = toKey(new Date());

  const culturalSpaces = useMemo(
    () => placesData.filter((p) => CULTURAL_PLACE_CATEGORIES.includes(p.category)),
    [],
  );

  // Map every calendar day -> events occurring that day (covers multi-day spans).
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CultureEvent[]>();
    for (const ev of eventsData) {
      for (const day of eachDay(ev.date, ev.endDate ?? ev.date)) {
        (map.get(day) ?? map.set(day, []).get(day)!).push(ev);
      }
    }
    return map;
  }, []);

  const upcoming = useMemo(
    () =>
      eventsData
        .filter((ev) => (ev.endDate ?? ev.date) >= todayKey)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [todayKey],
  );

  const subtabs = [
    { key: "events", label: t("culture_view_list"), icon: <List size={13} /> },
    { key: "calendar", label: t("culture_view_calendar"), icon: <CalendarDays size={13} /> },
    { key: "history", label: t("culture_view_history"), icon: <ScrollText size={13} /> },
    { key: "spaces", label: t("culture_view_spaces"), icon: <Building2 size={13} /> },
    { key: "map", label: t("culture_view_map"), icon: <MapIcon size={13} /> },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header + subtabs */}
      <div className="px-4 pt-4 pb-2 max-w-3xl mx-auto w-full flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1">
            {t("culture_title")}
          </h1>
          <a
            href="https://lefkasculturalcenter.gr/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-primary hover:bg-primary-600 active:scale-95 transition-all shadow-sm shadow-primary/30"
          >
            <Building2 size={13} className="flex-shrink-0" />
            {t("culture_center_btn")}
            <ExternalLink size={11} className="flex-shrink-0 opacity-80" />
          </a>
        </div>
        <AnimatedSegmented
          options={subtabs}
          value={mode}
          onChange={(k) => setMode(k as Mode)}
          size="sm"
          fullWidth
        />
      </div>

      {/* Content */}
      {mode === "map" ? (
        <div className="flex-1 min-h-0">
          <LazyMap initialKind="all" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 scroll-area">
          <div className="px-4 pt-2 pb-6 max-w-3xl mx-auto">
            {mode === "events" && <ListView events={upcoming} lang={lang} t={t} />}
            {mode === "calendar" && (
              <CalendarView
                eventsByDay={eventsByDay}
                todayKey={todayKey}
                lang={lang}
                t={t}
              />
            )}
            {mode === "history" && <HistoryView lang={lang} t={t} />}
            {mode === "spaces" && (
              <SpacesView places={culturalSpaces} lang={lang} t={t} initialCat={spacesCat} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cultural spaces (cultural centre venues, museums, churches) ──────────────
function SpacesView({
  places,
  lang,
  t,
  initialCat = "all",
}: {
  places: Place[];
  lang: Lang;
  t: (k: string) => string;
  initialCat?: string;
}) {
  const [cat, setCat] = useState<string>(initialCat);
  // Categories actually present, kept in a stable display order.
  const cats = CULTURAL_PLACE_CATEGORIES.filter((c) =>
    places.some((p) => p.category === c),
  );
  const shown = cat === "all" ? places : places.filter((p) => p.category === cat);

  return (
    <>
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-2 ml-1">
        {t("culture_view_spaces")}
      </p>

      {/* Category (tag) filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-1" style={{ scrollbarWidth: "none" }}>
        {[{ key: "all", label: t("map_all") }, ...cats.map((c) => ({ key: c, label: t("place_pl_" + c) }))].map((o) => {
          const active = cat === o.key;
          return (
            <button
              key={o.key}
              onClick={() => setCat(o.key)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all active:scale-95 ${active ? "bg-primary text-white border-primary" : "bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {shown.map((p) => {
          const accent = PLACE_ACCENT[p.category];
          const directions = `https://www.google.com/maps/dir/?api=1&destination=${p.coords[0]},${p.coords[1]}`;
          return (
            <article
              key={p.id}
              className="rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm"
            >
              <div className="flex">
                <div
                  className="w-24 flex-shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${PLACE_IMAGES[p.category]}')` }}
                />
                <div className="p-3.5 min-w-0 flex-1">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: accent + "18", color: accent }}
                  >
                    {t("place_" + p.category)}
                  </span>
                  <h3 className="font-bold text-[14px] text-gray-900 dark:text-white leading-snug mt-1.5">
                    {p.name[lang]}
                  </h3>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                    {p.description[lang]}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-95"
                      >
                        <ExternalLink size={12} />
                        {t("map_more")}
                      </a>
                    )}
                    <a
                      href={directions}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#252A3A] hover:bg-gray-200 dark:hover:bg-[#2E3548] transition-colors active:scale-95"
                    >
                      <Navigation size={12} />
                      {t("map_directions")}
                    </a>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

// ── History & religious references ───────────────────────────────────────────
function HistoryView({
  lang,
  t,
}: {
  lang: Lang;
  t: (k: string) => string;
}) {
  const groups: { kind: HistoryEntry["kind"]; label: string }[] = [
    { kind: "History", label: t("culture_hist_history") },
    { kind: "Religion", label: t("culture_hist_religion") },
  ];
  return (
    <div className="space-y-5">
      {/* Full official reference text (Municipality of Lefkada) */}
      <article className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
        <img
          src={historicalReferences.image}
          alt=""
          loading="lazy"
          className="w-full h-44 object-cover bg-gray-100 dark:bg-[#10141F]"
        />
        <div className="p-4">
          <h3 className="font-bold text-[16px] text-gray-900 dark:text-white leading-snug">
            {historicalReferences.title[lang]}
          </h3>
          <div className="space-y-2.5 mt-2">
            {historicalReferences.paragraphs.map((p, i) => (
              <p key={i} className="text-[13.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {p[lang]}
              </p>
            ))}
          </div>
        </div>
      </article>

      {groups.map((g) => {
        const items = historyData.filter((h) => h.kind === g.kind);
        const accent = HISTORY_ACCENT[g.kind];
        return (
          <div key={g.kind}>
            <p
              className="text-[11px] font-bold tracking-[0.12em] uppercase mb-2 ml-1"
              style={{ color: accent }}
            >
              {g.label}
            </p>
            <div className="space-y-3">
              {items.map((h) => (
                <article
                  key={h.id}
                  className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden"
                >
                  <div className="h-1 w-full" style={{ backgroundColor: accent }} />
                  <div className="p-4">
                    <h3 className="font-bold text-[15px] text-gray-900 dark:text-white leading-snug">
                      {h.title[lang]}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5 whitespace-pre-line">
                      {h.body[lang]}
                    </p>
                    {h.url && (
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-[11px] font-bold text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-95"
                      >
                        <ExternalLink size={12} />
                        {t("map_more")}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── LIST (upcoming only) ─────────────────────────────────────────────────────
function ListView({
  events,
  lang,
  t,
}: {
  events: CultureEvent[];
  lang: Lang;
  t: (k: string) => string;
}) {
  if (events.length === 0) {
    return (
      <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">
        {t("culture_no_upcoming")}
      </p>
    );
  }
  return (
    <>
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-3 ml-1">
        {t("culture_upcoming")}
      </p>
      <div className="space-y-4">
        {events.map((ev) => (
          <EventCard key={ev.id} ev={ev} lang={lang} t={t} />
        ))}
      </div>
    </>
  );
}

function EventCard({
  ev,
  lang,
  t,
}: {
  ev: CultureEvent;
  lang: Lang;
  t: (k: string) => string;
}) {
  const accent = EVENT_ACCENT[ev.category];
  return (
    <article className="rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm">
      {/* Relevant photo as the card header background */}
      <div
        className="relative h-32 bg-cover bg-center"
        style={{ backgroundImage: `url('${EVENT_IMAGES[ev.category]}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        <span
          className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: accent }}
        >
          {t("cat_" + ev.category)}
        </span>
        <h3 className="absolute bottom-2.5 left-3 right-3 text-white font-bold text-[16px] leading-snug drop-shadow">
          {ev.title[lang]}
        </h3>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 flex-wrap text-[12px] text-gray-500 dark:text-gray-400 mb-2">
          <span className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
            <CalendarDays size={13} style={{ color: accent }} />
            {fmtRange(ev, lang)}
            {ev.time && (
              <>
                <Clock size={12} className="ml-1" />
                {ev.time}
              </>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={13} />
            {ev.location[lang]}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {ev.description[lang]}
        </p>
        {ev.pdfUrl && (
          <a
            href={ev.pdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-[12px] font-bold text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-95"
          >
            <Download size={14} />
            {t("culture_programme")}
          </a>
        )}
      </div>
    </article>
  );
}

// ── CALENDAR (all events, incl. past) ────────────────────────────────────────
function CalendarView({
  eventsByDay,
  todayKey,
  lang,
  t,
}: {
  eventsByDay: Map<string, CultureEvent[]>;
  todayKey: string;
  lang: Lang;
  t: (k: string) => string;
}) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const first = new Date(view.y, view.m, 1);
  const startW = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startW).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = first.toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", {
    month: "long",
    year: "numeric",
  });

  const shift = (delta: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const selectedEvents = selected ? (eventsByDay.get(selected) ?? []) : [];

  return (
    <div className="lg:flex lg:gap-4 lg:items-start">
      {/* Calendar grid */}
      <div className="lg:flex-1 bg-white dark:bg-[#141929] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => shift(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A] active:scale-90 transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">
            {monthLabel}
          </span>
          <button
            onClick={() => shift(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A] active:scale-90 transition-all"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS[lang].map((w) => (
            <div
              key={w}
              className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 py-1"
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const key = `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = eventsByDay.get(key) ?? [];
            const has = dayEvents.length > 0;
            const isToday = key === todayKey;
            const isSel = key === selected;
            return (
              <button
                key={i}
                disabled={!has}
                onClick={() => setSelected(key)}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-[13px] transition-all
                  ${isSel ? "bg-primary text-white font-bold" : has ? "bg-primary-50 dark:bg-primary-900/20 text-gray-800 dark:text-gray-200 font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/30 active:scale-95" : "text-gray-400 dark:text-gray-600"}
                  ${isToday && !isSel ? "ring-1 ring-primary/60" : ""}`}
              >
                {day}
                {has && (
                  <span
                    className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isSel
                        ? "#ffffff"
                        : EVENT_ACCENT[dayEvents[0].category],
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel — big screens */}
      <div className="hidden lg:block lg:w-72 lg:flex-shrink-0">
        <DayDetails
          dateKey={selected}
          events={selectedEvents}
          lang={lang}
          t={t}
        />
      </div>

      {/* Detail popup — small screens */}
      {selected && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#141929] rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-[#141929]/90 backdrop-blur border-b border-gray-100 dark:border-[#1E2D4E]">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {selected && fmtDate(selected, lang)}
              </span>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <DayDetails
                dateKey={selected}
                events={selectedEvents}
                lang={lang}
                t={t}
                bare
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DayDetails({
  dateKey,
  events,
  lang,
  t,
  bare = false,
}: {
  dateKey: string | null;
  events: CultureEvent[];
  lang: Lang;
  t: (k: string) => string;
  bare?: boolean;
}) {
  const wrap = bare
    ? ""
    : "bg-white dark:bg-[#141929] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] p-4 shadow-sm sticky top-2";

  if (!dateKey) {
    return (
      <div className={wrap}>
        <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
          {t("culture_select_day")}
        </p>
      </div>
    );
  }

  return (
    <div className={wrap}>
      {!bare && (
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 capitalize">
          {fmtDate(dateKey, lang)}
        </p>
      )}
      {events.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t("culture_no_events_day")}
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const accent = EVENT_ACCENT[ev.category];
            return (
              <div
                key={ev.id}
                className="rounded-xl border border-gray-100 dark:border-[#1E2D4E] overflow-hidden"
              >
                <div
                  className="h-16 bg-cover bg-center relative"
                  style={{ backgroundImage: `url('${EVENT_IMAGES[ev.category]}')` }}
                >
                  <div className="absolute inset-0 bg-black/30" />
                  <span
                    className="absolute top-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {t("cat_" + ev.category)}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 leading-snug">
                    {ev.title[lang]}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    <MapPin size={11} />
                    {ev.location[lang]}
                    {ev.time && (
                      <>
                        <Clock size={11} className="ml-1" />
                        {ev.time}
                      </>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">
                    {ev.description[lang]}
                  </p>
                  {ev.pdfUrl && (
                    <a
                      href={ev.pdfUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-[11px] font-bold text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-95"
                    >
                      <Download size={12} />
                      {t("culture_programme")}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
