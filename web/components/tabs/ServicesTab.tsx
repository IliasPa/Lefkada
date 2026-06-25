"use client";

import {
  Globe,
  CreditCard,
  Megaphone,
  ShoppingBasket,
  HandHeart,
  Anchor,
  ShieldAlert,
  Recycle,
  FileText,
  ExternalLink,
  Phone,
  Trash2,
  MapPinned,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  govEServices,
  ESERVICE_GROUP_LABEL,
  ePayments,
  infoServices,
  recyclingStreams,
  wasteAreas,
  bulkyWasteNote,
  bulkyWastePhone,
  nsrfProjects,
  whistleblowing,
  emergencyNumbers,
  type EServiceGroup,
  type InfoIcon,
} from "@/data/services";
import WaterAnalysesCard from "@/components/WaterAnalysesCard";

type Lang = "el" | "en";

const FOURMYCITY_URL = "https://4mycity.lefkada.gov.gr/";

const INFO_ICONS: Record<InfoIcon, LucideIcon> = {
  grocery: ShoppingBasket,
  community: HandHeart,
  port: Anchor,
};

const ESERVICE_ORDER: EServiceGroup[] = ["cert", "registry", "lixiarcheio"];

export default function ServicesTab() {
  const { t, lang } = useApp();

  return (
    <div className="h-full scroll-area">
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
        <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1 mb-3">
          {t("services_title")}
        </h1>

        {/* ── Report a problem (4MyCity) ── */}
        <SectionLabel accent="#0D5EAF">{t("services_engage")}</SectionLabel>
        <a
          href={FOURMYCITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm p-4 mb-5 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0D5EAF18", color: "#0D5EAF" }}>
              <Megaphone size={18} />
            </span>
            <h3 className="font-bold text-[14px] text-gray-900 dark:text-white leading-snug flex-1">
              {t("services_report")}
            </h3>
          </div>
          <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed mt-2.5">
            {t("services_report_desc")}
          </p>
          <span className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-bold text-primary dark:text-primary-300">
            4MyCity <ExternalLink size={13} />
          </span>
        </a>

        {/* ── NSRF / ΕΣΠΑ projects ── */}
        <a
          href={nsrfProjects.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm p-4 mb-5 active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#6D44C818", color: "#6D44C8" }}>
              <MapPinned size={18} />
            </span>
            <h3 className="font-bold text-[14px] text-gray-900 dark:text-white leading-snug flex-1">
              {nsrfProjects.title[lang]}
            </h3>
          </div>
          <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed mt-2.5">
            {nsrfProjects.description[lang]}
          </p>
          <span className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-bold" style={{ color: "#6D44C8" }}>
            {t("services_projects_cta")} <ExternalLink size={13} />
          </span>
        </a>

        {/* ── e-Services (gov.gr) ── */}
        <SectionLabel accent="#0D5EAF">{t("services_eservices")}</SectionLabel>
        <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed -mt-1 mb-2.5 ml-1">
          {t("services_eservices_desc")}
        </p>
        {ESERVICE_ORDER.map((g) => {
          const items = govEServices.filter((s) => s.group === g);
          return (
            <div key={g} className="mb-3">
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">
                {ESERVICE_GROUP_LABEL[g][lang]}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm active:scale-[0.98] transition-transform"
                  >
                    <Globe size={15} className="text-primary flex-shrink-0" />
                    <span className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-200 leading-snug flex-1 min-w-0">
                      {s.title[lang]}
                    </span>
                    <ExternalLink size={13} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          );
        })}

        {/* ── e-Payments ── */}
        <SectionLabel accent="#16A34A">{t("services_epayments")}</SectionLabel>
        <div className="space-y-2 mb-5">
          {ePayments.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm p-3.5 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#16A34A18", color: "#16A34A" }}>
                  <CreditCard size={17} />
                </span>
                <h3 className="font-bold text-[13.5px] text-gray-900 dark:text-white leading-snug flex-1">
                  {p.title[lang]}
                </h3>
                <ExternalLink size={13} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
              </div>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
                {p.description[lang]}
              </p>
            </a>
          ))}
        </div>

        {/* ── Social services (in-app info, no external link) ── */}
        <SectionLabel accent="#16A34A">{t("services_social")}</SectionLabel>
        <div className="space-y-2 mb-5">
          {infoServices
            .filter((s) => ["grocery", "community", "port"].includes(s.id))
            .map((s) => (
              <InfoCard key={s.id} icon={INFO_ICONS[s.icon]} accent="#16A34A" title={s.title[lang]} desc={s.description[lang]} />
            ))}
        </div>

        {/* ── Waste, recycling & water ── */}
        <SectionLabel accent="#0EA5E9">{t("services_environment")}</SectionLabel>
        <div className="space-y-2 mb-5">
          <WasteCard lang={lang} t={t} />
          <WaterAnalysesCard />
        </div>

        {/* ── Safety & integrity ── */}
        <SectionLabel accent="#DC2626">{t("services_safety")}</SectionLabel>
        <div className="space-y-2">
          <EmergencyCard lang={lang} t={t} />
          <a
            href={lang === "el" ? whistleblowing.urlEl : whistleblowing.urlEn}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm p-4 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#DC262618", color: "#DC2626" }}>
                <ShieldAlert size={17} />
              </span>
              <h3 className="font-bold text-[13.5px] text-gray-900 dark:text-white leading-snug flex-1">
                {whistleblowing.title[lang]}
              </h3>
              <ExternalLink size={13} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </div>
            <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed mt-2.5">
              {whistleblowing.description[lang]}
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-[0.12em] uppercase mb-2 ml-1" style={{ color: accent }}>
      {children}
    </p>
  );
}

function InfoCard({ icon: Icon, accent, title, desc }: { icon: LucideIcon; accent: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm p-4">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent + "18", color: accent }}>
          <Icon size={17} />
        </span>
        <h3 className="font-bold text-[13.5px] text-gray-900 dark:text-white leading-snug flex-1">{title}</h3>
      </div>
      <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed mt-2.5">{desc}</p>
    </div>
  );
}

function WasteCard({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#16A34A18", color: "#16A34A" }}>
          <Recycle size={17} />
        </span>
        <h3 className="font-bold text-[13.5px] text-gray-900 dark:text-white leading-snug flex-1">
          {t("services_waste")}
        </h3>
      </div>

      {/* Recycling streams */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {recyclingStreams.map((s) => (
          <span key={s.en} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#252A3A] text-gray-600 dark:text-gray-300">
            {s[lang]}
          </span>
        ))}
      </div>

      {/* Per-area indicative schedule */}
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
        {t("services_waste_areas")}
      </p>
      <div className="divide-y divide-gray-100 dark:divide-[#1E2D4E]">
        {wasteAreas.map((a) => (
          <div key={a.id} className="flex items-start justify-between gap-3 py-2">
            <span className="text-[12.5px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <Trash2 size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              {a.area[lang]}
            </span>
            <span className="text-[11.5px] text-gray-500 dark:text-gray-400 text-right">{a.schedule[lang]}</span>
          </div>
        ))}
      </div>
      <p className="text-[11.5px] text-gray-500 dark:text-gray-400 leading-relaxed mt-2.5">
        <FileText size={11} className="inline mr-1 -mt-0.5" />
        {bulkyWasteNote[lang]}
      </p>
      <a
        href={`tel:${bulkyWastePhone}`}
        className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[12px] font-bold active:scale-95"
      >
        <Phone size={13} />
        {t("services_bulky_call")}: {bulkyWastePhone}
      </a>
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
