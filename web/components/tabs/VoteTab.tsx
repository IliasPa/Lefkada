"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { pollsData } from "@/data/voting";
import { KEYS, storageGet, storageSet } from "@/lib/storage";

type VoteCounts = Record<string, number>;
type MyVotes = Record<string, string>;

export default function VoteTab() {
  const { t, lang } = useApp();
  const poll = pollsData[0];

  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [myVotes, setMyVotes] = useState<MyVotes>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [explainLength, setExplainLength] = useState<
    "short" | "medium" | "full"
  >("short");

  useEffect(() => {
    const saved = storageGet<VoteCounts>(KEYS.votes, {});
    const mine = storageGet<MyVotes>(KEYS.myVotes, {});
    const merged: VoteCounts = {};
    poll.options.forEach((o) => {
      merged[o.id] = (saved[o.id] ?? 0) + (poll.seedVotes[o.id] ?? 0);
    });
    setVoteCounts(merged);
    setMyVotes(mine);
    if (mine[poll.id]) {
      setSubmitted(true);
      setSelected(mine[poll.id]);
    }
  }, [poll]);

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  const handleVote = useCallback(() => {
    if (!selected) return;
    const savedCounts = storageGet<VoteCounts>(KEYS.votes, {});
    const prevVote = myVotes[poll.id];
    const updated = { ...savedCounts };
    if (prevVote && prevVote !== selected) {
      updated[prevVote] = Math.max(0, (updated[prevVote] ?? 0) - 1);
    }
    if (!prevVote || prevVote !== selected) {
      updated[selected] = (updated[selected] ?? 0) + 1;
    }
    const updatedMyVotes = { ...myVotes, [poll.id]: selected };
    storageSet(KEYS.votes, updated);
    storageSet(KEYS.myVotes, updatedMyVotes);
    const merged: VoteCounts = {};
    poll.options.forEach((o) => {
      merged[o.id] = (updated[o.id] ?? 0) + (poll.seedVotes[o.id] ?? 0);
    });
    setVoteCounts(merged);
    setMyVotes(updatedMyVotes);
    setSubmitted(true);
  }, [selected, myVotes, poll]);

  // Parse markdown-ish explanation — always on blue bg, so use white/blue-light palette
  const explanation = poll.explanations[explainLength][lang];
  const explainNodes = explanation.split("\n").map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <p key={i} className="font-bold text-white mt-3 mb-0.5 text-sm">
          {line.slice(2, -2)}
        </p>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li
          key={i}
          className="ml-4 list-disc text-blue-100 text-[13px] leading-relaxed"
        >
          {line.slice(2)}
        </li>
      );
    }
    return (
      <p key={i} className="text-blue-100 text-[13px] leading-relaxed">
        {line}
      </p>
    );
  });

  return (
    <div className="h-full scroll-area">
      <div className="px-4 pt-4 pb-6 max-w-2xl mx-auto space-y-3">
        {/* Section header */}
        <h1 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500 ml-1">
          {t("vote_title")}
        </h1>

        {/* ── Poll header + About (details) at top ── */}
        <div className="bg-primary rounded-2xl overflow-hidden shadow-md shadow-primary/20">
          {/* Main poll info */}
          <div className="p-5">
            <span className="text-[10px] font-black tracking-[0.22em] text-blue-200 block mb-2">
              {t("vote_active_badge")}
            </span>
            <h2 className="font-bold text-[17px] text-white leading-snug">
              {poll.title[lang]}
            </h2>
          </div>

          {/* About this poll — expandable "details" inside the header card */}
          <div className="border-t border-white/15">
            <button
              className="w-full flex items-center justify-between px-5 py-3"
              onClick={() => setShowAbout((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Info size={14} className="text-blue-200" />
                <span className="text-[12px] font-semibold text-blue-100">
                  {showAbout ? t("vote_about_hide") : t("vote_about_btn")}
                </span>
              </div>
              {showAbout ? (
                <ChevronUp size={15} className="text-blue-200 flex-shrink-0" />
              ) : (
                <ChevronDown
                  size={15}
                  className="text-blue-200 flex-shrink-0"
                />
              )}
            </button>

            {showAbout && (
              <div
                className="px-5 pb-5 pt-3"
                style={{ background: "rgba(0,0,0,0.18)" }}
              >
                {/* Length selector buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setExplainLength("short")}
                    className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${explainLength === "short" ? "bg-white/40 text-white" : "bg-white/10 text-blue-100 hover:bg-white/15"}`}
                  >
                    ⚡ Σύντομα
                  </button>
                  <button
                    onClick={() => setExplainLength("medium")}
                    className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${explainLength === "medium" ? "bg-white/40 text-white" : "bg-white/10 text-blue-100 hover:bg-white/15"}`}
                  >
                    🕐 Ανάλυση
                  </button>
                  <button
                    onClick={() => setExplainLength("full")}
                    className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${explainLength === "full" ? "bg-white/40 text-white" : "bg-white/10 text-blue-100 hover:bg-white/15"}`}
                  >
                    📖 Πλήρης
                  </button>
                </div>
                {/* Explanation content */}
                <div className="space-y-0.5">{explainNodes}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Voting or Results ── */}
        {submitted ? (
          <ResultsCard
            poll={poll}
            lang={lang}
            myVote={myVotes[poll.id]}
            voteCounts={voteCounts}
            totalVotes={totalVotes}
            t={t}
            onChangeVote={() => setSubmitted(false)}
          />
        ) : (
          <VotingCard
            poll={poll}
            lang={lang}
            selected={selected}
            onSelect={setSelected}
            onSubmit={handleVote}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-cards ──────────────────────────────────────────────────────────────────
function VotingCard({
  poll,
  lang,
  selected,
  onSelect,
  onSubmit,
  t,
}: {
  poll: (typeof pollsData)[0];
  lang: "el" | "en";
  selected: string | null;
  onSelect: (id: string) => void;
  onSubmit: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="bg-white dark:bg-[#141929] rounded-2xl p-5 border border-gray-100 dark:border-[#1E2D4E] shadow-sm">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-4">
        {t("vote_choose")}
      </p>
      <div className="space-y-2.5">
        {poll.options.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`
                w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left
                transition-all duration-150 active:scale-[0.98]
                ${
                  active
                    ? "border-primary bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-100 dark:border-[#252A3A] bg-gray-50 dark:bg-[#0F1219]"
                }
              `}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${active ? "border-primary" : "border-gray-300 dark:border-gray-600"}`}
              >
                {active && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={`text-[14px] leading-snug ${active ? "font-semibold text-primary dark:text-primary-300" : "text-gray-600 dark:text-gray-300"}`}
              >
                {opt.text[lang]}
              </span>
            </button>
          );
        })}
      </div>
      <button
        onClick={onSubmit}
        disabled={!selected}
        className={`mt-5 w-full py-3.5 rounded-xl font-bold text-[15px] transition-all active:scale-[0.98] ${selected ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-gray-100 dark:bg-[#252A3A] text-gray-300 dark:text-gray-600 cursor-not-allowed"}`}
      >
        {t("vote_submit")}
      </button>
    </div>
  );
}

function ResultsCard({
  poll,
  lang,
  myVote,
  voteCounts,
  totalVotes,
  t,
  onChangeVote,
}: {
  poll: (typeof pollsData)[0];
  lang: "el" | "en";
  myVote: string;
  voteCounts: Record<string, number>;
  totalVotes: number;
  t: (k: string) => string;
  onChangeVote: () => void;
}) {
  const myOptText = poll.options.find((o) => o.id === myVote)?.text[lang] ?? "";
  return (
    <div className="bg-white dark:bg-[#141929] rounded-2xl p-5 border border-gray-100 dark:border-[#1E2D4E] shadow-sm space-y-4">
      <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 p-3.5 rounded-xl">
        <CheckCircle2
          size={20}
          className="text-green-500 flex-shrink-0 mt-0.5"
        />
        <div>
          <p className="font-semibold text-sm text-green-700 dark:text-green-400">
            {t("vote_submitted_title")}
          </p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
            {t("vote_submitted_text")}
          </p>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-1">
          {t("vote_your_vote")}
        </p>
        <p className="text-sm font-semibold text-primary dark:text-primary-300">
          {myOptText}
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold tracking-wide uppercase text-gray-400 dark:text-gray-500">
            {t("vote_results_title")}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {totalVotes.toLocaleString()} {t("vote_total_votes")}
          </p>
        </div>
        <div className="space-y-3">
          {poll.options.map((opt) => {
            const count = voteCounts[opt.id] ?? 0;
            const pct =
              totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isMyVote = opt.id === myVote;
            return (
              <div key={opt.id}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span
                    className={`font-medium leading-snug ${isMyVote ? "text-primary dark:text-primary-300" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    {isMyVote && "✓ "}
                    {opt.text[lang]}
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300 flex-shrink-0 ml-2">
                    {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-[#252A3A] overflow-hidden">
                  <div
                    className="h-full rounded-full bar-fill"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isMyVote ? "#0D5EAF" : "#94A3B8",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button
        onClick={onChangeVote}
        className="w-full py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#252A3A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252A3A] transition-colors"
      >
        {t("vote_change")}
      </button>
    </div>
  );
}
