"use client";

import {
  Globe,
  MapPinned,
  ShoppingBasket,
  HandHeart,
  Anchor,
  Droplets,
  ShieldAlert,
  Megaphone,
  ExternalLink,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  services,
  emergencyNumbers,
  SERVICE_GROUP_LABEL,
  type ServiceGroup,
  type ServiceIcon,
} from "@/data/services";

type Lang = "el" | "en";

const ICONS: Record<ServiceIcon, LucideIcon> = {
  eservices: Globe,
  report: Megaphone,
  projects: MapPinned,
  grocery: ShoppingBasket,
  community: HandHeart,
  port: Anchor,
  water: Droplets,
  whistle: ShieldAlert,
};

const GROUP_ACCENT: Record<ServiceGroup, string> = {
  digital: "#0D5EAF",
  social: "#16A34A",
  safety: "#DC2626",
};

const GROUP_ORDER: ServiceGroup[] = ["digital", "social", "safety"];

export default function ServicesTab() {
  const { t, lang } = useApp();

  return (
    <div className="h-full scroll-area">
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
        <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1 mb-3">
          {t("services_title")}
        </h1>

        {GROUP_ORDER.map((group) => {
          const items = services.filter((s) => s.group === group);
          const accent = GROUP_ACCENT[group];
          return (
            <section key={group} className="mb-5">
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase mb-2 ml-1" style={{ color: accent }}>
                {SERVICE_GROUP_LABEL[group][lang]}
              </p>
              <div className="space-y-2.5">
                {items.map((s) => {
                  const Icon = ICONS[s.icon];
                  return (
                    <a
                      key={s.id}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm p-4 active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: accent + "18", color: accent }}
                        >
                          <Icon size={18} />
                        </span>
                        <h3 className="font-bold text-[14px] text-gray-900 dark:text-white leading-snug flex-1">
                          {s.title[lang]}
                        </h3>
                      </div>
                      <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed mt-2.5">
                        {s.description[lang]}
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-bold"
                        style={{ color: accent }}
                      >
                        {s.cta ? s.cta[lang] : t("map_more")}
                        <ExternalLink size={13} />
                      </span>
                    </a>
                  );
                })}

                {/* Emergency quick-dial lives in the Safety group */}
                {group === "safety" && <EmergencyCard lang={lang} t={t} />}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function EmergencyCard({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  return (
    <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20">
        <ShieldAlert size={16} className="text-red-600 dark:text-red-400" />
        <span className="font-bold text-[13px] text-red-700 dark:text-red-300">
          {t("services_emergency")}
        </span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-[#1E2D4E]">
        {emergencyNumbers.map((e) => (
          <a
            key={e.id}
            href={`tel:${e.number.replace(/\s/g, "")}`}
            className="flex items-center justify-between gap-3 px-4 py-2.5 active:bg-gray-50 dark:active:bg-[#1A1F2E]"
          >
            <span className="text-[13px] text-gray-700 dark:text-gray-300">{e.label[lang]}</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[14px] text-red-600 dark:text-red-400">
              <Phone size={13} />
              {e.number}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
