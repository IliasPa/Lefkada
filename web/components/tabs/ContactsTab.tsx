"use client";

import { useMemo, useState } from "react";
import { Search, Phone, Mail, Clock, Star, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  contactsData,
  STANDARD_HOURS,
  type Contact,
  type ContactCategory,
} from "@/data/contacts";

const CAT_TKEY: Record<ContactCategory, string> = {
  Administration: "con_cat_Administration",
  Services: "con_cat_Services",
  Emergency: "con_cat_Emergency",
  Utilities: "con_cat_Utilities",
  Tourism: "con_cat_Tourism",
  Health: "con_cat_Health",
};

const CAT_COLOR: Record<ContactCategory, string> = {
  Administration: "#0D5EAF",
  Services: "#6D44C8",
  Emergency: "#DC2626",
  Utilities: "#0EA5E9",
  Tourism: "#E4802C",
  Health: "#22C55E",
};

export default function ContactsTab() {
  const { t, lang } = useApp();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contactsData;
    return contactsData.filter((c) => {
      const hay = [
        c.name.el,
        c.name.en,
        c.phone ?? "",
        c.email ?? "",
        t(CAT_TKEY[c.category]),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, t]);

  const usesStandard = filtered.some((c) => !c.hours);

  return (
    <div className="h-full scroll-area">
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
        <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1 mb-3">
          {t("contacts_title")}
        </h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder={t("contacts_search")}
            aria-label={t("contacts_search")}
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

        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">
            {t("contacts_no_results")}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <ContactCard key={c.id} c={c} lang={lang} t={t} />
            ))}
          </div>
        )}

        {/* Standard-hours footnote (★) */}
        {usesStandard && (
          <div className="flex items-start gap-2 mt-5 px-1 text-[12px] text-gray-400 dark:text-gray-500">
            <Star size={13} className="flex-shrink-0 mt-0.5 fill-current" />
            <p>
              {t("contacts_standard_note")}{" "}
              <span className="font-semibold text-gray-500 dark:text-gray-400">
                {STANDARD_HOURS[lang]}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactCard({
  c,
  lang,
  t,
}: {
  c: Contact;
  lang: "el" | "en";
  t: (k: string) => string;
}) {
  const color = CAT_COLOR[c.category];
  const standard = !c.hours;
  return (
    <article className="bg-white dark:bg-[#141929] rounded-2xl p-4 border border-gray-100 dark:border-[#1E2D4E] shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h2 className="font-bold text-[15px] text-gray-900 dark:text-white leading-snug">
          {c.name[lang]}
        </h2>
        <span
          className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: color + "18", color }}
        >
          {t(CAT_TKEY[c.category])}
        </span>
      </div>

      {/* Hours */}
      <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 mb-3">
        <Clock size={13} className="flex-shrink-0" />
        <span>{standard ? STANDARD_HOURS[lang] : c.hours![lang]}</span>
        {standard && (
          <Star size={11} className="fill-current text-gray-300 dark:text-gray-600" />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {c.phone && (
          <a
            href={`tel:${c.phone}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-[12px] font-bold hover:bg-primary-600 active:scale-95 transition-all"
          >
            <Phone size={13} />
            {c.phone}
          </a>
        )}
        {c.email && (
          <a
            href={`mailto:${c.email}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#252A3A] text-gray-700 dark:text-gray-300 text-[12px] font-bold hover:bg-gray-200 dark:hover:bg-[#2E3548] active:scale-95 transition-all"
          >
            <Mail size={13} />
            {t("contacts_email")}
          </a>
        )}
      </div>
    </article>
  );
}
