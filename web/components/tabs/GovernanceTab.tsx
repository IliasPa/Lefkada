"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  Gavel,
  FileSignature,
  Megaphone,
  Video,
  Clock,
  Briefcase,
  CalendarDays,
  FileText,
  Users,
  FolderOpen,
  Landmark,
  Scale,
  MessagesSquare,
  Hash,
  Home,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  governanceData,
  GOV_ACCENT,
  GOV_TYPES,
  GOV_BODIES,
  GOV_BODY_ACCENT,
  GOV_ANN_TAGS,
  GOV_ANN_ACCENT,
  type GovItem,
  type GovType,
  type GovBody,
  type AnnTag,
} from "@/data/governance";
import { tendersData, bylawsData, consultationsData, decisionArchive } from "@/data/governanceActs";
import { pollsData } from "@/data/voting";
import AnimatedSegmented from "@/components/AnimatedSegmented";
import SubTabs from "@/components/SubTabs";
import CouncilView from "@/components/CouncilView";
import CommunitiesView from "@/components/CommunitiesView";
import ReferendumCard from "@/components/ReferendumCard";
import { isPollClosed } from "@/components/PollBlock";

type Lang = "el" | "en";
type TopSection = "townhall" | "communities";
type Section = "acts" | "council";

const TYPE_ICON: Record<GovType, React.ReactNode> = {
  Bylaw: <Scale size={13} />,
  Decision: <Gavel size={13} />,
  Tender: <FileSignature size={13} />,
  Announcement: <Megaphone size={13} />,
  Meeting: <Video size={13} />,
  Consultation: <MessagesSquare size={13} />,
};

const PAGE = 40;

function daysLeft(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}
function fmtDate(s: string, lang: Lang) {
  const [y, m, d] = s.split("-").map(Number);
  if (!y) return "";
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(
    lang === "el" ? "el-GR" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

/** Lazy-loaded published decisions (2021-2026) from /public/decisions.json. */
type RawDecision = { t: string; n: string; d: string; b: string; f: string };
function decisionToItem(r: RawDecision, i: number, lang: Lang): GovItem {
  return {
    id: `dec-${i}`,
    type: "Decision",
    body: (r.b || undefined) as GovBody | undefined,
    title: { el: r.t, en: r.t },
    summary: { el: `Αριθμός ${r.n}`, en: `No. ${r.n}` },
    date: r.d,
    pdfUrl: r.f || undefined,
  };
}

export default function GovernanceTab() {
  const { t, lang, govIntent, setGovIntent } = useApp();
  const [topSection, setTopSection] = useState<TopSection>("townhall");
  const [section, setSection] = useState<Section>("acts");
  const [type, setType] = useState<GovType>("Decision");
  const [body, setBody] = useState<GovBody | "all">("all");
  const [annTag, setAnnTag] = useState<AnnTag | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  // Lazy decision archive (heavy ~4k items) — fetched once when Decisions is opened.
  const [decisions, setDecisions] = useState<GovItem[] | null>(null);
  const [decLoading, setDecLoading] = useState(false);
  useEffect(() => {
    if (type !== "Decision" || decisions || decLoading) return;
    setDecLoading(true);
    fetch("/decisions.json")
      .then((r) => r.json())
      .then((raw: RawDecision[]) => setDecisions(raw.map((r, i) => decisionToItem(r, i, lang))))
      .catch(() => setDecisions([]))
      .finally(() => setDecLoading(false));
  }, [type, decisions, decLoading, lang]);

  // Consume a one-shot deep-link intent (e.g. from Services ▸ Social Grocery / NSRF).
  useEffect(() => {
    if (!govIntent) return;
    setTopSection("townhall");
    setSection("acts");
    if (govIntent.type) setType(govIntent.type as GovType);
    setAnnTag((govIntent.annTag as AnnTag) ?? "all");
    setBody("all");
    setGovIntent(null);
  }, [govIntent, setGovIntent]);

  // Reset paging when the active view changes.
  useEffect(() => { setLimit(PAGE); }, [type, body, annTag, query]);

  // Finished referendums (former Vote tab) shown inside Consultations.
  const finishedPolls = useMemo(() => pollsData.filter((p) => isPollClosed(p, Date.now())), []);

  // Source list for the active type.
  const source: GovItem[] = useMemo(() => {
    switch (type) {
      case "Bylaw": return bylawsData;                 // already sorted by name
      case "Consultation": return consultationsData;   // already sorted by date
      case "Tender": return tendersData;
      case "Decision": return [...decisionArchive, ...(decisions ?? [])];
      default: return governanceData.filter((g) => g.type === type);
    }
  }, [type, decisions]);

  // Bodies present for the active type — drive the Meetings/Decisions sub-filter.
  const bodiesPresent = useMemo(() => {
    const set = new Set(source.filter((g) => g.body).map((g) => g.body));
    return GOV_BODIES.filter((b) => set.has(b.key));
  }, [source]);

  const annTagsPresent = useMemo(() => {
    const set = new Set(governanceData.filter((g) => g.type === "Announcement" && g.annTag).map((g) => g.annTag));
    return GOV_ANN_TAGS.filter((a) => set.has(a.key));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sortable = type === "Bylaw"; // bylaws keep name order; everything else newest-first
    const arr = source
      .filter((g) => (type !== "Meeting" && type !== "Decision") || body === "all" || g.body === body)
      .filter((g) => type !== "Announcement" || annTag === "all" || g.annTag === annTag)
      .filter((g) => {
        if (!q) return true;
        return [g.title.el, g.title.en, g.summary.el, g.summary.en].join(" ").toLowerCase().includes(q);
      });
    if (!sortable) arr.sort((a, b) => b.date.localeCompare(a.date));
    return arr;
  }, [source, type, body, annTag, query]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="h-full scroll-area">
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto">
        <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1 mb-3">
          {t("gov_title")}
        </h1>

        {/* Governance vs Communities */}
        <div className="mb-3">
          <AnimatedSegmented
            options={[
              { key: "townhall", label: t("gov_top_townhall"), icon: <Landmark size={13} /> },
              { key: "communities", label: t("gov_top_communities"), icon: <Home size={13} /> },
            ]}
            value={topSection}
            onChange={(k) => setTopSection(k as TopSection)}
            size="sm"
            fullWidth
          />
        </div>

        {topSection === "communities" ? (
          <CommunitiesView />
        ) : (
          <>
            {/* Acts vs Council (same layout as Communities) */}
            <SubTabs
              options={[
                { key: "acts", label: t("gov_sec_acts"), icon: <FolderOpen size={13} /> },
                { key: "council", label: t("gov_sec_council"), icon: <Users size={13} /> },
              ]}
              value={section}
              onChange={(k) => setSection(k as Section)}
            />

            {section === "council" ? (
              <CouncilView />
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    type="search"
                    placeholder={t("gov_search")}
                    aria-label={t("gov_search")}
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

                {/* Type filter — 6 sub-subtabs (scrollable pills, coloured per type) */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: "none" }}>
                  {GOV_TYPES.map((ty) => {
                    const active = type === ty;
                    const accent = GOV_ACCENT[ty];
                    return (
                      <button
                        key={ty}
                        onClick={() => { setType(ty); setBody("all"); setAnnTag("all"); }}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all active:scale-95"
                        style={active ? { backgroundColor: accent, color: "#fff", borderColor: accent } : { borderColor: accent + "55", color: accent }}
                      >
                        {TYPE_ICON[ty]}
                        {t("gov_f_" + ty)}
                      </button>
                    );
                  })}
                </div>

                {/* Body sub-filter (Meetings & Decisions) */}
                {(type === "Meeting" || type === "Decision") && bodiesPresent.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: "none" }}>
                    {[{ key: "all" as const, label: t("gov_body_all"), accent: "#6B7280" }, ...bodiesPresent.map((b) => ({ key: b.key, label: b.tag[lang], accent: GOV_BODY_ACCENT[b.key] }))].map((o) => {
                      const active = body === o.key;
                      return (
                        <button
                          key={o.key}
                          onClick={() => setBody(o.key as GovBody | "all")}
                          title={o.key === "all" ? t("gov_body_all") : GOV_BODIES.find((b) => b.key === o.key)?.name[lang]}
                          className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95"
                          style={active ? { backgroundColor: o.accent, color: "#fff", borderColor: o.accent } : { borderColor: o.accent + "55", color: o.accent }}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Announcement source sub-filter */}
                {type === "Announcement" && annTagsPresent.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: "none" }}>
                    {[{ key: "all" as const, label: t("gov_body_all"), accent: "#6B7280" }, ...annTagsPresent.map((a) => ({ key: a.key, label: a.tag[lang], accent: GOV_ANN_ACCENT[a.key] }))].map((o) => {
                      const active = annTag === o.key;
                      return (
                        <button
                          key={o.key}
                          onClick={() => setAnnTag(o.key as AnnTag | "all")}
                          title={o.key === "all" ? t("gov_body_all") : GOV_ANN_TAGS.find((a) => a.key === o.key)?.name[lang]}
                          className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95"
                          style={active ? { backgroundColor: o.accent, color: "#fff", borderColor: o.accent } : { borderColor: o.accent + "55", color: o.accent }}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Finished referendums (former active votings) live in Consultations */}
                {type === "Consultation" && finishedPolls.length > 0 && (
                  <div className="space-y-3 mb-3">
                    {finishedPolls.map((p) => (
                      <ReferendumCard key={p.id} poll={p} />
                    ))}
                  </div>
                )}

                {type === "Decision" && decLoading && !decisions ? (
                  <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">{t("gov_loading")}</p>
                ) : filtered.length === 0 ? (
                  type === "Consultation" && finishedPolls.length > 0 ? null : (
                    <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-sm">{t("gov_no_results")}</p>
                  )
                ) : (
                  <>
                    <div className="space-y-3">
                      {visible.map((g) => (
                        <GovCard key={g.id} g={g} lang={lang} t={t} />
                      ))}
                    </div>
                    {filtered.length > limit && (
                      <button
                        onClick={() => setLimit((n) => n + PAGE)}
                        className="w-full mt-4 py-2.5 rounded-xl text-[13px] font-bold text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-[0.98]"
                      >
                        {t("gov_load_more")} ({filtered.length - limit})
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GovCard({ g, lang, t }: { g: GovItem; lang: Lang; t: (k: string) => string }) {
  const { setActiveTab } = useApp();
  const bodyMeta = (g.type === "Meeting" || g.type === "Decision") && g.body ? GOV_BODIES.find((b) => b.key === g.body) : undefined;
  const annMeta = g.type === "Announcement" && g.annTag ? GOV_ANN_TAGS.find((a) => a.key === g.annTag) : undefined;
  const accent = bodyMeta ? GOV_BODY_ACCENT[bodyMeta.key] : annMeta ? GOV_ANN_ACCENT[annMeta.key] : GOV_ACCENT[g.type];
  const [watch, setWatch] = useState(false);

  return (
    <article className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {bodyMeta ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: accent + "18", color: accent }} title={bodyMeta.name[lang]}>
              {bodyMeta.tag[lang]}
            </span>
          ) : annMeta ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: accent + "18", color: accent }} title={annMeta.name[lang]}>
              {annMeta.tag[lang]}
            </span>
          ) : (
            <span />
          )}
          {g.date && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
              <CalendarDays size={11} />
              {fmtDate(g.date, lang)}
            </span>
          )}
        </div>

        <h2 className="font-bold text-[15px] text-gray-900 dark:text-white leading-snug">{g.title[lang]}</h2>
        {g.summary[lang] && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5 inline-flex items-start gap-1">
            {g.type === "Decision" && g.summary[lang].match(/\d/) && <Hash size={13} className="mt-0.5 flex-shrink-0 opacity-60" />}
            <span>{g.summary[lang]}</span>
          </p>
        )}

        {/* Tender: deadline + status + optional job link */}
        {g.type === "Tender" && g.deadline && (
          <div className="flex items-center flex-wrap gap-2 mt-3">
            {(() => {
              const d = daysLeft(g.deadline!);
              const open = d >= 0;
              return (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${open ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-[#252A3A] text-gray-500 dark:text-gray-400"}`}>
                  {open ? `${t("gov_closes_in")} ${d} ${t("gov_days")}` : t("gov_closed")}
                </span>
              );
            })()}
            {g.jobId && (
              <button onClick={() => setActiveTab("jobs")} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-95">
                <Briefcase size={12} />
                {t("gov_view_job")}
              </button>
            )}
          </div>
        )}

        {/* Meeting: time + watch + agenda/minutes */}
        {g.type === "Meeting" && (
          <>
            {watch && g.youtubeId && (
              <div className="relative w-full overflow-hidden rounded-xl bg-black mt-3" style={{ aspectRatio: "16 / 9" }}>
                <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube-nocookie.com/embed/${g.youtubeId}?modestbranding=1&rel=0`} title={g.title[lang]} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              </div>
            )}
            <div className="flex items-center flex-wrap gap-2 mt-3">
              {g.time && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  <Clock size={12} />
                  {g.time}
                </span>
              )}
              {g.youtubeId && (
                <button onClick={() => setWatch((v) => !v)} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: accent }}>
                  <Video size={12} />
                  {t("gov_watch")}
                </button>
              )}
              {g.agendaPdf && <GovPdf url={g.agendaPdf} label={t("gov_agenda")} />}
              {g.minutesPdf && <GovPdf url={g.minutesPdf} label={t("gov_minutes")} />}
            </div>
          </>
        )}

        {/* Multiple named links (decision archive) */}
        {g.links && g.links.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {g.links.map((l, i) => (
              <GovPdf key={i} url={l.url} label={l.label[lang]} />
            ))}
          </div>
        )}

        {/* Generic PDF for decisions/announcements/tenders/bylaws/consultations */}
        {g.pdfUrl && (
          <div className="mt-3">
            <GovPdf url={g.pdfUrl} label={t("gov_pdf")} />
          </div>
        )}
      </div>
    </article>
  );
}

function GovPdf({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#252A3A] hover:bg-gray-200 dark:hover:bg-[#2E3548] transition-colors active:scale-95">
      <FileText size={12} />
      {label}
    </a>
  );
}
