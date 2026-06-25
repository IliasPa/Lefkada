"use client";

import { useState } from "react";
import {
  Crown,
  Users,
  UserCog,
  ChevronRight,
  X,
  ExternalLink,
  Mail,
  Phone,
  FileText,
  Scale,
  Archive,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  mayor,
  secretaryGeneral,
  deputyMayors,
  committees,
  COUNCIL_LINKS,
  type CouncilPerson,
  type Committee,
} from "@/data/council";

type Lang = "el" | "en";

function initials(name: string) {
  return name
    .replace(/^Δρ\.?\s*|^Dr\.?\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function CouncilView() {
  const { t, lang } = useApp();
  const [person, setPerson] = useState<CouncilPerson | null>(null);
  const [committee, setCommittee] = useState<Committee | null>(null);

  const close = () => {
    setPerson(null);
    setCommittee(null);
  };

  return (
    <div className="space-y-5">
      {/* Mayor */}
      <Group label={t("council_leadership")}>
        <PersonCard
          person={mayor}
          lang={lang}
          onClick={() => setPerson(mayor)}
          accent="#0D5EAF"
          icon={<Crown size={18} />}
          large
        />
        <PersonCard
          person={secretaryGeneral}
          lang={lang}
          onClick={() => setPerson(secretaryGeneral)}
          accent="#6D44C8"
          icon={<UserCog size={18} />}
        />
      </Group>

      {/* Deputy mayors */}
      <Group label={`${t("council_deputies")} · ${deputyMayors.length}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {deputyMayors.map((d) => (
            <button
              key={d.id}
              onClick={() => setPerson(d)}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm text-left active:scale-[0.98] transition-transform"
            >
              <Avatar text={initials(d.name[lang])} accent="#0D5EAF" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-[13px] text-gray-900 dark:text-white truncate">
                  {d.name[lang]}
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {d.role[lang]}
                </span>
              </span>
              <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      </Group>

      {/* Councillors + committees + references */}
      <Group label={t("council_bodies")}>
        <LinkCard
          icon={<Users size={17} />}
          accent="#16A34A"
          title={t("council_full_list")}
          subtitle={t("council_full_list_sub")}
          href={COUNCIL_LINKS.councillors}
        />
        {committees.map((c) => (
          <button
            key={c.id}
            onClick={() => setCommittee(c)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm text-left active:scale-[0.98] transition-transform"
          >
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#E4802C18", color: "#E4802C" }}
            >
              <Scale size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-[13px] text-gray-900 dark:text-white truncate">
                {c.name[lang]}
              </span>
              <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {t("council_committee")}
              </span>
            </span>
            <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
          </button>
        ))}
        <LinkCard
          icon={<FileText size={17} />}
          accent="#0D5EAF"
          title={t("council_disclosures")}
          subtitle={t("council_disclosures_sub")}
          href={COUNCIL_LINKS.assetDisclosures}
        />
        <LinkCard
          icon={<Archive size={17} />}
          accent="#6B7280"
          title={t("council_archive")}
          subtitle={t("council_archive_sub")}
          href={COUNCIL_LINKS.archive}
        />
      </Group>

      {/* Detail sheet */}
      {(person || committee) && (
        <DetailSheet onClose={close}>
          {person && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Avatar text={initials(person.name[lang])} accent="#0D5EAF" large />
                <div className="min-w-0">
                  <h3 className="font-bold text-[16px] text-gray-900 dark:text-white leading-snug">
                    {person.name[lang]}
                  </h3>
                  <p className="text-[12px] font-semibold text-primary dark:text-primary-300">
                    {person.role[lang]}
                  </p>
                </div>
              </div>
              {person.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {person.bio[lang]}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {person.email && (
                  <a href={`mailto:${person.email}`} className="sheet-btn">
                    <Mail size={13} /> {person.email}
                  </a>
                )}
                {person.phone && (
                  <a href={`tel:${person.phone}`} className="sheet-btn">
                    <Phone size={13} /> {person.phone}
                  </a>
                )}
                {person.url && (
                  <a href={person.url} target="_blank" rel="noopener noreferrer" className="sheet-btn">
                    <ExternalLink size={13} /> {t("council_official_page")}
                  </a>
                )}
              </div>
            </>
          )}
          {committee && (
            <>
              <h3 className="font-bold text-[16px] text-gray-900 dark:text-white leading-snug mb-2">
                {committee.name[lang]}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {committee.description[lang]}
              </p>
              {committee.url && (
                <a
                  href={committee.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sheet-btn mt-4"
                >
                  <ExternalLink size={13} /> {t("council_official_page")}
                </a>
              )}
            </>
          )}
        </DetailSheet>
      )}

      <style jsx>{`
        :global(.sheet-btn) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          color: #0d5eaf;
          background: rgba(13, 94, 175, 0.08);
        }
        :global(.dark .sheet-btn) {
          color: #93c5fd;
          background: rgba(13, 94, 175, 0.2);
        }
      `}</style>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-2 ml-1">
        {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Avatar({ text, accent, large = false }: { text: string; accent: string; large?: boolean }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full font-bold flex-shrink-0 ${large ? "w-12 h-12 text-[15px]" : "w-9 h-9 text-[12px]"}`}
      style={{ backgroundColor: accent + "18", color: accent }}
    >
      {text}
    </span>
  );
}

function PersonCard({
  person,
  lang,
  onClick,
  accent,
  icon,
  large = false,
}: {
  person: CouncilPerson;
  lang: Lang;
  onClick: () => void;
  accent: string;
  icon: React.ReactNode;
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm text-left active:scale-[0.98] transition-transform ${large ? "p-4" : "p-3"}`}
    >
      <span
        className={`rounded-xl flex items-center justify-center flex-shrink-0 ${large ? "w-12 h-12" : "w-10 h-10"}`}
        style={{ backgroundColor: accent + "18", color: accent }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-bold text-gray-900 dark:text-white leading-snug ${large ? "text-[16px]" : "text-[14px]"}`}>
          {person.name[lang]}
        </span>
        <span className="block text-[12px] text-gray-500 dark:text-gray-400">
          {person.role[lang]}
        </span>
      </span>
      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
    </button>
  );
}

function LinkCard({
  icon,
  accent,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm active:scale-[0.98] transition-transform"
    >
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent + "18", color: accent }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-[13px] text-gray-900 dark:text-white truncate">
          {title}
        </span>
        <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
          {subtitle}
        </span>
      </span>
      <ExternalLink size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
    </a>
  );
}

function DetailSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const { t } = useApp();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#141929] rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 flex items-center justify-end px-3 py-2 bg-white/90 dark:bg-[#141929]/90 backdrop-blur">
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-6">{children}</div>
      </div>
    </div>
  );
}
