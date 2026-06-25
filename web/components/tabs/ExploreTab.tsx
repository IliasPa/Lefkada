"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Map as MapIcon, List, ExternalLink, Navigation } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  placesData,
  PLACE_IMAGES,
  PLACE_ACCENT,
  type Place,
  type PlaceCategory,
} from "@/data/places";
import AnimatedSegmented from "@/components/AnimatedSegmented";

const LazyMap = dynamic(() => import("@/components/LefkadaMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-4 border-primary-300 border-t-primary animate-spin" />
    </div>
  ),
});

const PLACE_CATS: PlaceCategory[] = [
  "Beach", "Village", "Trail", "Museum", "CulturalSpace", "Church", "Castle", "Landmark",
];

type Mode = "map" | "list";

export default function ExploreTab() {
  const { t, lang } = useApp();
  const [mode, setMode] = useState<Mode>("map");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(
    () => (cat === "all" ? placesData : placesData.filter((p) => p.category === cat)),
    [cat],
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 max-w-3xl mx-auto w-full flex-shrink-0">
        <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1 mb-2">
          {t("explore_title")}
        </h1>
        <AnimatedSegmented
          options={[
            { key: "map", label: t("culture_view_map"), icon: <MapIcon size={13} /> },
            { key: "list", label: t("culture_view_list"), icon: <List size={13} /> },
          ]}
          value={mode}
          onChange={(k) => setMode(k as Mode)}
          size="sm"
        />
      </div>

      {mode === "map" ? (
        <div className="flex-1 min-h-0">
          <LazyMap initialKind="places" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 scroll-area">
          <div className="px-4 pt-2 pb-6 max-w-3xl mx-auto">
            {/* category filter */}
            <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
              <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
                {t("map_all")}
              </FilterChip>
              {PLACE_CATS.map((c) => (
                <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>
                  {t("place_" + c)}
                </FilterChip>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.map((p) => (
                <PlaceCard key={p.id} p={p} lang={lang} t={t} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${active ? "bg-primary text-white border-primary" : "bg-white dark:bg-[#141929] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#252A3A]"}`}
    >
      {children}
    </button>
  );
}

function PlaceCard({
  p,
  lang,
  t,
}: {
  p: Place;
  lang: "el" | "en";
  t: (k: string) => string;
}) {
  const accent = PLACE_ACCENT[p.category];
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${p.coords[0]},${p.coords[1]}`;
  return (
    <article className="rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm">
      <div
        className="relative h-28 bg-cover bg-center"
        style={{ backgroundImage: `url('${PLACE_IMAGES[p.category]}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        <span
          className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: accent }}
        >
          {t("place_" + p.category)}
        </span>
        <h3 className="absolute bottom-2.5 left-3 right-3 text-white font-bold text-[15px] leading-snug drop-shadow">
          {p.name[lang]}
        </h3>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {p.description[lang]}
        </p>
        <div className="flex items-center gap-2 mt-3">
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-95"
            >
              <ExternalLink size={13} />
              {t("map_more")}
            </a>
          )}
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#252A3A] hover:bg-gray-200 dark:hover:bg-[#2E3548] transition-colors active:scale-95"
          >
            <Navigation size={13} />
            {t("map_directions")}
          </a>
        </div>
      </div>
    </article>
  );
}
