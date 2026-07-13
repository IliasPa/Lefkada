"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  ExternalLink,
  Anchor,
  X,
  Gavel,
  CalendarDays,
  UserRound,
  Users,
  Landmark,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  municipalUnits,
  twinCities,
  accessRoutes,
  communityPages,
  municipalityOverview,
  type AccessMode,
  type Community,
  type TwinCity,
  type PageContent,
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
    month: "long",
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
      <div className="subtab-bar px-4 pt-4 pb-2 max-w-3xl mx-auto w-full flex-shrink-0">
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

function PageBody({ page, lang }: { page: PageContent; lang: Lang }) {
  return (
    <>
      {page.image && (
        <img
          src={page.image}
          alt=""
          loading="lazy"
          className="w-full h-44 object-cover rounded-xl mb-3 bg-gray-100 dark:bg-[#10141F]"
        />
      )}
      <div className="space-y-2.5">
        {page.paragraphs.map((p, i) => (
          <p key={i} className="text-[13.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
            {p[lang]}
          </p>
        ))}
      </div>
    </>
  );
}

function VillagesView({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  const [open, setOpen] = useState<string | null>("lefkada");
  const [community, setCommunity] = useState<Community | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  return (
    <div className="space-y-2.5">
      {/* Municipality of Lefkada — overview */}
      <button
        onClick={() => setShowOverview(true)}
        className="w-full text-left rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3 p-3.5">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0D5EAF18", color: "#0D5EAF" }}>
            <Landmark size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-[14px] text-gray-900 dark:text-white">{t("about_municipality")}</span>
            <span className="block text-[11px] text-gray-500 dark:text-gray-400">{t("about_municipality_sub")}</span>
          </span>
          <ChevronDown size={17} className="text-gray-400 dark:text-gray-500 flex-shrink-0 -rotate-90" />
        </div>
      </button>

      {showOverview && (
        <Sheet onClose={() => setShowOverview(false)}>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0D5EAF18", color: "#0D5EAF" }}>
              <Landmark size={17} />
            </span>
            <h3 className="font-bold text-[16px] text-gray-900 dark:text-white leading-snug">{t("about_municipality")}</h3>
          </div>
          <PageBody page={municipalityOverview} lang={lang} />
        </Sheet>
      )}

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
                {u.communities.map((com) => (
                  <button
                    key={com.name.en}
                    onClick={() => setCommunity(com)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#252A3A] text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
                  >
                    {com.name[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {community && (
        <Sheet onClose={() => setCommunity(null)}>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#16A34A18", color: "#16A34A" }}>
              <MapPin size={17} />
            </span>
            <h3 className="font-bold text-[16px] text-gray-900 dark:text-white leading-snug">
              {community.name[lang]}
            </h3>
          </div>
          {communityPages[community.name.en] ? (
            <PageBody page={communityPages[community.name.en]} lang={lang} />
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {community.description[lang]}
            </p>
          )}
        </Sheet>
      )}
    </div>
  );
}

function TwinningView({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  const [twin, setTwin] = useState<TwinCity | null>(null);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {twinCities.map((c) => (
        <button
          key={c.id}
          onClick={() => setTwin(c)}
          className="text-left rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm p-3.5 active:scale-[0.98] transition-transform"
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
            <ChevronDown size={15} className="text-gray-300 dark:text-gray-600 -rotate-90" />
          </div>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
            {c.reason[lang]}
          </p>
        </button>
      ))}

      {twin && (
        <Sheet onClose={() => setTwin(null)}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl leading-none">{twin.flag}</span>
            <div className="min-w-0">
              <h3 className="font-bold text-[17px] text-gray-900 dark:text-white leading-snug">
                {twin.city[lang]}
              </h3>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">{twin.country[lang]}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            {twin.reason[lang]}
          </p>
          <dl className="space-y-2">
            <DetailRow icon={<CalendarDays size={14} />} label={t("twin_date")} value={fmtDate(twin.twinningDate, lang)} />
            <DetailRow icon={<Gavel size={14} />} label={t("twin_decision")} value={twin.decision} />
            <DetailRow icon={<UserRound size={14} />} label={t("twin_mayor")} value={twin.mayor[lang]} />
          </dl>
        </Sheet>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5 border-t border-gray-100 dark:border-[#1E2D4E]">
      <span className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</dt>
        <dd className="text-[13.5px] font-semibold text-gray-800 dark:text-gray-200">{value}</dd>
      </div>
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
          {r.url && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold px-2.5 py-1 rounded-lg text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-95"
            >
              <ExternalLink size={12} />
              {r.urlLabel ? r.urlLabel[lang] : t("map_more")}
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const { t, a11y } = useApp();
  // Render at <body> level, outside the `.a11y-large main { zoom }` context — a
  // fixed sheet inside a zoomed ancestor gets mis-sized and its top (the close
  // button) is clipped off-screen. The 1.15 scale is re-applied to the content
  // only, so Large-text users still get enlarged text within a viewport-sized sheet.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#141929] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 z-10 flex items-center justify-end px-3 py-2 bg-white/90 dark:bg-[#141929]/90 backdrop-blur">
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-6" style={a11y.largeText ? { zoom: 1.15 } : undefined}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
