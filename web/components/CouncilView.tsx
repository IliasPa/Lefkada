"use client";

import { useState } from "react";
import {
  Crown,
  UserCog,
  ChevronRight,
  ChevronDown,
  X,
  ExternalLink,
  Mail,
  Phone,
  FileText,
  Scale,
  CalendarDays,
  Users,
  Network,
  FileSignature,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  councilTerms,
  cityCouncil,
  orgTree,
  ASSET_DISCLOSURES_URL,
  DEPUTY_ASSIGNMENT_DECISION,
  MAYOR_CV_URL,
  type CouncilPerson,
  type Committee,
  type OrgNode,
} from "@/data/council";
import AnimatedSegmented from "@/components/AnimatedSegmented";

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
function fmtDate(s: string, lang: Lang) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CouncilView() {
  const { t, lang } = useApp();
  const [termId, setTermId] = useState(councilTerms[0].id);
  const [person, setPerson] = useState<CouncilPerson | null>(null);
  const [committee, setCommittee] = useState<Committee | null>(null);

  const term = councilTerms.find((tm) => tm.id === termId) ?? councilTerms[0];
  const isCurrent = term.id === councilTerms[0].id;
  const close = () => {
    setPerson(null);
    setCommittee(null);
  };

  return (
    <div className="space-y-4">
      {/* Term selector — one tab per council, labelled by start year */}
      <AnimatedSegmented
        options={councilTerms.map((tm) => ({ key: tm.id, label: String(tm.startYear) }))}
        value={termId}
        onChange={setTermId}
        size="sm"
        fullWidth
      />

      {term.startDate && (
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 -mt-1 ml-1">
          <CalendarDays size={13} />
          {t("council_in_office")}: {fmtDate(term.startDate, lang)}
          {term.endYear && ` – ${term.endYear}`}
        </p>
      )}

      {/* Leadership */}
      <Group label={t("council_leadership")}>
        <PersonCard person={term.mayor} lang={lang} onClick={() => setPerson(term.mayor)} accent="#0D5EAF" icon={<Crown size={18} />} large />
        {term.secretaryGeneral && (
          <PersonCard person={term.secretaryGeneral} lang={lang} onClick={() => setPerson(term.secretaryGeneral!)} accent="#6D44C8" icon={<UserCog size={18} />} />
        )}
      </Group>

      {term.note && term.deputyMayors.length === 0 ? (
        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-[#10141F] border border-gray-100 dark:border-[#1E2D4E] rounded-xl p-3">
          {term.note[lang]}
        </p>
      ) : (
        <>
          {/* Deputy mayors — name + decision/CV buttons (no role line, no sheet) */}
          {term.deputyMayors.length > 0 && (
            <Group label={`${t("council_deputies")} · ${term.deputyMayors.length}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {term.deputyMayors.map((d) => (
                  <div key={d.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm">
                    <Avatar text={initials(d.name[lang])} accent="#0D5EAF" />
                    <div className="min-w-0 flex-1">
                      <span className="block font-bold text-[13px] text-gray-900 dark:text-white truncate">{d.name[lang]}</span>
                      <a
                        href={DEPUTY_ASSIGNMENT_DECISION}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary dark:text-primary-300 mt-0.5"
                      >
                        <FileSignature size={11} /> {t("council_decision")}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Group>
          )}

          {/* Committees */}
          {term.committees.length > 0 && (
            <Group label={t("council_bodies")}>
              {term.committees.map((c) => (
                <button key={c.id} onClick={() => setCommittee(c)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm text-left active:scale-[0.98] transition-transform">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E4802C18", color: "#E4802C" }}>
                    <Scale size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[13px] text-gray-900 dark:text-white truncate">{c.name[lang]}</span>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">{t("council_committee")}</span>
                  </span>
                  <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                </button>
              ))}
            </Group>
          )}
        </>
      )}

      {/* City Council members — current term only */}
      {isCurrent && <CityCouncilSection t={t} />}

      {/* Asset disclosures — national documents registry */}
      <a href={ASSET_DISCLOSURES_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm active:scale-[0.98] transition-transform">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0D5EAF18", color: "#0D5EAF" }}>
          <FileText size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[13px] text-gray-900 dark:text-white truncate">{t("council_disclosures")}</span>
          <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">{t("council_disclosures_sub")}</span>
        </span>
        <ExternalLink size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
      </a>

      {/* Organisational structure (term-independent) */}
      <OrgTreeSection lang={lang} t={t} />

      {/* Detail sheet (mayor / secretary / committee) */}
      {(person || committee) && (
        <DetailSheet onClose={close}>
          {person && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Avatar text={initials(person.name[lang])} accent="#0D5EAF" large />
                <div className="min-w-0">
                  <h3 className="font-bold text-[16px] text-gray-900 dark:text-white leading-snug">{person.name[lang]}</h3>
                  <p className="text-[12px] font-semibold text-primary dark:text-primary-300">{person.role[lang]}</p>
                </div>
              </div>
              {person.bio && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{person.bio[lang]}</p>}
              <div className="flex flex-wrap gap-2 mt-4">
                {person.id.startsWith("mayor") && (
                  <a href={MAYOR_CV_URL} target="_blank" rel="noopener noreferrer" className="sheet-btn">
                    <FileText size={13} /> {t("council_cv")}
                  </a>
                )}
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
              </div>
            </>
          )}
          {committee && (
            <>
              <h3 className="font-bold text-[16px] text-gray-900 dark:text-white leading-snug mb-2">{committee.name[lang]}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{committee.description[lang]}</p>
              {committee.members && (
                <div className="mt-4 space-y-3">
                  {committee.members.president && (
                    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                      <span className="text-[12.5px] font-bold text-gray-800 dark:text-gray-200">{committee.members.president}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary dark:text-primary-300">{t("council_president")}</span>
                    </div>
                  )}
                  <MemberList label={t("council_members_regular")} names={committee.members.regular} />
                  <MemberList label={t("council_members_alternate")} names={committee.members.alternate} />
                </div>
              )}
            </>
          )}
        </DetailSheet>
      )}

      <style jsx>{`
        :global(.sheet-btn) {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 10px; border-radius: 10px; font-size: 12px; font-weight: 700;
          color: #0d5eaf; background: rgba(13, 94, 175, 0.08);
        }
        :global(.dark .sheet-btn) { color: #93c5fd; background: rgba(13, 94, 175, 0.2); }
      `}</style>
    </div>
  );
}

function CityCouncilSection({ t }: { t: (k: string) => string }) {
  const [open, setOpen] = useState(false);
  const officers: [string, string][] = [
    [t("council_president"), cityCouncil.president],
    [t("council_vice_president"), cityCouncil.vicePresident],
    [t("council_secretary"), cityCouncil.secretary],
  ];
  return (
    <div className="rounded-xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3 text-left active:scale-[0.99]" aria-expanded={open}>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#16A34A18", color: "#16A34A" }}>
          <Users size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[13px] text-gray-900 dark:text-white">{t("council_members")}</span>
          <span className="block text-[11px] text-gray-500 dark:text-gray-400">{cityCouncil.councillors.length + 3} {t("council_members_count")}</span>
        </span>
        <ChevronDown size={17} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3">
          <div className="space-y-1.5 mb-2">
            {officers.map(([role, name]) => (
              <div key={role} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <span className="text-[12.5px] font-bold text-gray-800 dark:text-gray-200">{name}</span>
                <span className="text-[10.5px] font-bold uppercase tracking-wide text-primary dark:text-primary-300">{role}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cityCouncil.councillors.map((c) => (
              <span key={c} className="text-[11.5px] font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#252A3A] text-gray-700 dark:text-gray-300">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrgTreeSection({ lang, t }: { lang: Lang; t: (k: string) => string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3 text-left active:scale-[0.99]" aria-expanded={open}>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#6D44C818", color: "#6D44C8" }}>
          <Network size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[13px] text-gray-900 dark:text-white">{t("council_structure")}</span>
          <span className="block text-[11px] text-gray-500 dark:text-gray-400">{t("council_structure_sub")}</span>
        </span>
        <ChevronDown size={17} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1">
          {orgTree.map((node, i) => (
            <OrgBranch key={i} node={node} lang={lang} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrgBranch({ node, lang, depth }: { node: OrgNode; lang: Lang; depth: number }) {
  const [open, setOpen] = useState(false);
  const hasKids = !!node.children?.length;
  return (
    <div style={{ marginLeft: depth * 12 }}>
      <button
        onClick={() => hasKids && setOpen((v) => !v)}
        className={`w-full flex items-center gap-1.5 py-1.5 text-left ${hasKids ? "active:scale-[0.99]" : "cursor-default"}`}
      >
        {hasKids ? (
          <ChevronRight size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 ml-1 mr-1" />
        )}
        <span className={`text-[12.5px] leading-snug ${depth === 0 ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-600 dark:text-gray-300"}`}>
          {node.name[lang]}
        </span>
      </button>
      {open && node.children?.map((ch, i) => <OrgBranch key={i} node={ch} lang={lang} depth={depth + 1} />)}
    </div>
  );
}

function MemberList({ label, names }: { label: string; names: string[] }) {
  if (!names.length) return null;
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {names.map((n) => (
          <span key={n} className="text-[11.5px] font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#252A3A] text-gray-700 dark:text-gray-300">{n}</span>
        ))}
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 mb-2 ml-1">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Avatar({ text, accent, large = false }: { text: string; accent: string; large?: boolean }) {
  return (
    <span className={`flex items-center justify-center rounded-full font-bold flex-shrink-0 ${large ? "w-12 h-12 text-[15px]" : "w-9 h-9 text-[12px]"}`} style={{ backgroundColor: accent + "18", color: accent }}>
      {text}
    </span>
  );
}

function PersonCard({ person, lang, onClick, accent, icon, large = false }: { person: CouncilPerson; lang: Lang; onClick: () => void; accent: string; icon: React.ReactNode; large?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm text-left active:scale-[0.98] transition-transform ${large ? "p-4" : "p-3"}`}>
      <span className={`rounded-xl flex items-center justify-center flex-shrink-0 ${large ? "w-12 h-12" : "w-10 h-10"}`} style={{ backgroundColor: accent + "18", color: accent }}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block font-bold text-gray-900 dark:text-white leading-snug ${large ? "text-[16px]" : "text-[14px]"}`}>{person.name[lang]}</span>
        <span className="block text-[12px] text-gray-500 dark:text-gray-400">{person.role[lang]}</span>
      </span>
      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
    </button>
  );
}

function DetailSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const { t } = useApp();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#141929] rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 flex items-center justify-end px-3 py-2 bg-white/90 dark:bg-[#141929]/90 backdrop-blur">
          <button onClick={onClose} aria-label={t("close")} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 active:scale-90">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-6">{children}</div>
      </div>
    </div>
  );
}
