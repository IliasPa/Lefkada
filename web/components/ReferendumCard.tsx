"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap, Clock3, BookOpen, BarChart3, Youtube, FileText, CalendarDays, Vote } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { type Poll } from "@/data/voting";
import { KEYS, storageGet } from "@/lib/storage";
import { YouTubeEmbed, ResultsCard } from "@/components/PollBlock";

type Panel = "short" | "medium" | "full" | "results" | "youtube";
const ACCENT = "#A61E34"; // Consultations accent

function Explanation({ text }: { text: string }) {
  return (
    <div className="space-y-0.5">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        if (line.startsWith("**") && line.endsWith("**"))
          return <p key={i} className="font-bold text-gray-800 dark:text-gray-200 mt-3 mb-0.5 text-sm">{line.slice(2, -2)}</p>;
        if (line.startsWith("- "))
          return <li key={i} className="ml-4 list-disc text-gray-600 dark:text-gray-400 text-[13px] leading-relaxed">{line.slice(2)}</li>;
        return <p key={i} className="text-gray-600 dark:text-gray-400 text-[13px] leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export default function ReferendumCard({ poll }: { poll: Poll }) {
  const { t, lang } = useApp();
  const [open, setOpen] = useState<Panel | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | undefined>();

  useEffect(() => {
    const saved = storageGet<Record<string, number>>(KEYS.votes, {});
    const mine = storageGet<Record<string, string>>(KEYS.myVotes, {});
    const merged: Record<string, number> = {};
    poll.options.forEach((o) => { merged[o.id] = (saved[`${poll.id}:${o.id}`] ?? 0) + (poll.seedVotes[o.id] ?? 0); });
    setCounts(merged);
    setMyVote(mine[poll.id]);
  }, [poll]);

  const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const ended = new Date(poll.endDate).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  const toggle = (p: Panel) => setOpen((cur) => (cur === p ? null : p));
  const btn = (p: Panel, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => toggle(p)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95"
      style={open === p ? { backgroundColor: ACCENT, color: "#fff", borderColor: ACCENT } : { borderColor: ACCENT + "44", color: ACCENT }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <article className="rounded-2xl border border-gray-100 dark:border-[#1E2D4E] bg-white dark:bg-[#141929] shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: ACCENT }} />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: ACCENT + "18", color: ACCENT }}>
            <Vote size={11} /> {t("gov_referendum")}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <CalendarDays size={11} /> {ended}
          </span>
        </div>

        <h2 className="font-bold text-[15px] text-gray-900 dark:text-white leading-snug mb-3">{poll.title[lang]}</h2>

        {/* Inline open/close buttons */}
        <div className="flex flex-wrap gap-2">
          {btn("short", <Zap size={12} />, t("vote_explain_short"))}
          {btn("medium", <Clock3 size={12} />, t("vote_explain_medium"))}
          {btn("full", <BookOpen size={12} />, t("vote_explain_full"))}
          {btn("results", <BarChart3 size={12} />, t("vote_results_title"))}
          {poll.youtubeId && btn("youtube", <Youtube size={12} />, t("gov_watch"))}
          {poll.pdfUrl && (
            <a href={poll.pdfUrl} download target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95"
              style={{ borderColor: ACCENT + "44", color: ACCENT }}>
              <FileText size={12} /> {t("gov_pdf")}
            </a>
          )}
        </div>

        {/* Active panel */}
        {open && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#1E2D4E]">
            {(open === "short" || open === "medium" || open === "full") && (
              <Explanation text={poll.explanations[open][lang]} />
            )}
            {open === "results" && (
              <ResultsCard poll={poll} lang={lang} myVote={myVote} voteCounts={counts} totalVotes={total} closed t={t} />
            )}
            {open === "youtube" && poll.youtubeId && (
              <YouTubeEmbed id={poll.youtubeId} title={poll.title[lang]} />
            )}
          </div>
        )}
      </div>
    </article>
  );
}
