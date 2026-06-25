"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { Map as LMap, Marker as LMarker } from "leaflet";
import { useApp } from "@/context/AppContext";
import { eventsData, EVENT_CATEGORIES_ORDER } from "@/data/events";
import { placesData, type PlaceCategory } from "@/data/places";
import AnimatedSegmented from "@/components/AnimatedSegmented";

type Kind = "all" | "events" | "places";

const KIND_COLOR = { event: "#E11D48", place: "#0D5EAF" } as const;

const PLACE_CATS: PlaceCategory[] = [
  "Beach", "Village", "Trail", "Museum", "CulturalSpace", "Church", "Castle", "Landmark",
];

interface Pt {
  id: string;
  kind: "event" | "place";
  category: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  body: string;
  link?: { url: string; label: string };
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function LefkadaMap({ initialKind = "all" }: { initialKind?: Kind }) {
  const { t, lang } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);
  const markersRef = useRef<LMarker[]>([]);
  const [ready, setReady] = useState(false);

  const [kind, setKind] = useState<Kind>(initialKind);
  const [cat, setCat] = useState<string>("all");

  // Build the unified point list for the active filters.
  const points = useMemo<Pt[]>(() => {
    const out: Pt[] = [];
    if (kind === "all" || kind === "events") {
      for (const e of eventsData) {
        if (!e.coords) continue;
        if (kind === "events" && cat !== "all" && e.category !== cat) continue;
        out.push({
          id: `e-${e.id}`,
          kind: "event",
          category: e.category,
          lat: e.coords[0],
          lng: e.coords[1],
          title: e.title[lang],
          subtitle: `${t("cat_" + e.category)} · ${e.location[lang]}`,
          body: e.description[lang],
          link: e.pdfUrl ? { url: e.pdfUrl, label: t("map_programme") } : undefined,
        });
      }
    }
    if (kind === "all" || kind === "places") {
      for (const p of placesData) {
        if (kind === "places" && cat !== "all" && p.category !== cat) continue;
        out.push({
          id: `p-${p.id}`,
          kind: "place",
          category: p.category,
          lat: p.coords[0],
          lng: p.coords[1],
          title: p.name[lang],
          subtitle: t("place_" + p.category),
          body: p.description[lang],
          link: p.url
            ? { url: p.url, label: t("map_more") }
            : {
                url: `https://www.google.com/maps/dir/?api=1&destination=${p.coords[0]},${p.coords[1]}`,
                label: t("map_directions"),
              },
        });
      }
    }
    return out;
  }, [kind, cat, lang, t]);

  // Init the map once (Leaflet imported lazily so it never runs on the server).
  useEffect(() => {
    let cancelled = false;
    let map: LMap | null = null;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;
      LRef.current = L;
      map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
        [38.78, 20.66],
        11,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      mapRef.current = map;
      setReady(true);
      setTimeout(() => map && map.invalidateSize(), 120);
    })();
    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
    };
  }, []);

  // (Re)draw markers when the filtered points change.
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const pt of points) {
      const color = KIND_COLOR[pt.kind];
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
        tooltipAnchor: [0, -16],
        popupAnchor: [0, -18],
      });
      const m = L.marker([pt.lat, pt.lng], { icon }).addTo(map);
      const linkHtml = pt.link
        ? `<a href="${pt.link.url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;font-weight:700;color:${color};text-decoration:none">${esc(pt.link.label)} →</a>`
        : "";
      m.bindPopup(
        `<div style="min-width:180px;max-width:230px">
           <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:${color}">${esc(pt.subtitle)}</div>
           <div style="font-weight:700;font-size:14px;margin:2px 0 4px">${esc(pt.title)}</div>
           <div style="font-size:12px;line-height:1.45;color:#444">${esc(pt.body)}</div>
           ${linkHtml}
         </div>`,
        { maxWidth: 250 },
      );
      markersRef.current.push(m);
    }
  }, [points, ready]);

  // Category chips for the selected kind.
  const catOptions: { key: string; label: string }[] =
    kind === "events"
      ? [{ key: "all", label: t("map_all") }, ...EVENT_CATEGORIES_ORDER.map((c) => ({ key: c, label: t("cat_" + c) }))]
      : kind === "places"
      ? [{ key: "all", label: t("map_all") }, ...PLACE_CATS.map((c) => ({ key: c, label: t("place_pl_" + c) }))]
      : [];

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="px-4 pt-3 pb-2 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <AnimatedSegmented
            options={[
              { key: "all", label: t("map_all") },
              { key: "events", label: t("map_events") },
              { key: "places", label: t("map_places") },
            ]}
            value={kind}
            onChange={(k) => {
              setKind(k as Kind);
              setCat("all");
            }}
            size="sm"
          />
          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: KIND_COLOR.event }} />
              {t("map_events")}
            </span>
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: KIND_COLOR.place }} />
              {t("map_places")}
            </span>
          </div>
        </div>

        {catOptions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {catOptions.map((o) => {
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
        )}
      </div>

      {/* Map */}
      <div className="flex-1 min-h-0 relative">
        <div ref={containerRef} className="absolute inset-0" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            …
          </div>
        )}
      </div>
    </div>
  );
}
