"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Info, Download, BadgeCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AnimatedSegmented from "@/components/AnimatedSegmented";
import { type Poll } from "@/data/voting";
import { KEYS, storageGet, storageSet } from "@/lib/storage";
import { submitVote, getVerifiedUser, restampVoteIfNeeded, type VerifiedUser } from "@/lib/backend";
import { backendConfigured } from "@/lib/supabase";

type VoteCounts = Record<string, number>;
type MyVotes = Record<string, string>;

export function isPollClosed(poll: Poll, now: number) {
  return new Date(poll.endDate).getTime() <= now;
}

// ── A single poll: countdown/ended + about + video + ballot/results ──────────
export default function PollBlock({
  poll,
  closed,
  floatVideoOnDesktop = false,
}: {
  poll: Poll;
  closed: boolean;
  floatVideoOnDesktop?: boolean;
}) {
  const { t, lang } = useApp();

  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [myVotes, setMyVotes] = useState<MyVotes>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [explainLength, setExplainLength] = useState<"short" | "medium" | "full">("short");
  const [vUser, setVUser] = useState<VerifiedUser | null>(null);

  useEffect(() => {
    if (!backendConfigured) return;
    getVerifiedUser().then(setVUser);
    // If the mayor's municipal-roll designation changed since this account's
    // vote here, silently re-submit the unchanged choice with the new stamp
    // (open polls only) — the Δημότες statistic self-heals.
    if (!closed) restampVoteIfNeeded(poll.id);
  }, [closed, poll.id]);

  const keyOf = (id: string) => `${poll.id}:${id}`;

  useEffect(() => {
    const saved = storageGet<VoteCounts>(KEYS.votes, {});
    const mine = storageGet<MyVotes>(KEYS.myVotes, {});
    const merged: VoteCounts = {};
    poll.options.forEach((o) => {
      merged[o.id] = (saved[`${poll.id}:${o.id}`] ?? 0) + (poll.seedVotes[o.id] ?? 0);
    });
    setVoteCounts(merged);
    setMyVotes(mine);
    if (mine[poll.id]) setSelected(mine[poll.id]);
    if (closed || mine[poll.id]) setSubmitted(true);
  }, [poll, closed]);

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  const handleVote = useCallback(() => {
    if (!selected || closed) return;
    const savedCounts = storageGet<VoteCounts>(KEYS.votes, {});
    const prevVote = myVotes[poll.id];
    const updated = { ...savedCounts };
    if (prevVote && prevVote !== selected) {
      updated[keyOf(prevVote)] = Math.max(0, (updated[keyOf(prevVote)] ?? 0) - 1);
    }
    if (!prevVote || prevVote !== selected) {
      updated[keyOf(selected)] = (updated[keyOf(selected)] ?? 0) + 1;
    }
    const updatedMyVotes = { ...myVotes, [poll.id]: selected };
    storageSet(KEYS.votes, updated);
    storageSet(KEYS.myVotes, updatedMyVotes);
    const merged: VoteCounts = {};
    poll.options.forEach((o) => {
      merged[o.id] = (updated[keyOf(o.id)] ?? 0) + (poll.seedVotes[o.id] ?? 0);
    });
    setVoteCounts(merged);
    setMyVotes(updatedMyVotes);
    setSubmitted(true);
    // Record server-side too (anonymous hashed voter key). If the insert
    // fails we must SAY so — the local tally alone is not "counted".
    setSendError(false);
    submitVote(poll.id, selected).then((ok) => setSendError(!ok));
  }, [selected, myVotes, poll, closed]);

  const explanation = poll.explanations[explainLength][lang];
  const explainNodes = explanation.split("\n").map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-bold text-white mt-3 mb-0.5 text-sm">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith("- ")) {
      return <li key={i} className="ml-4 list-disc text-blue-100 text-[13px] leading-relaxed">{line.slice(2)}</li>;
    }
    return <p key={i} className="text-blue-100 text-[13px] leading-relaxed">{line}</p>;
  });

  return (
    <div className="space-y-3">
      {closed ? <EndedBanner endDate={poll.endDate} lang={lang} t={t} /> : <Countdown endDate={poll.endDate} t={t} />}

      <div className={floatVideoOnDesktop ? "relative" : undefined}>
        <div className="space-y-3">
          <div className="bg-primary rounded-2xl overflow-hidden shadow-md shadow-primary/20">
            <div className="p-5">
              <span className="text-[10px] font-black tracking-[0.22em] text-blue-200 block mb-2">
                {closed ? t("vote_results_title") : t("vote_active_badge")}
              </span>
              <h2 className="font-bold text-[17px] text-white leading-snug">{poll.title[lang]}</h2>
            </div>

            <div className="border-t border-white/15">
              <div className="w-full flex items-center justify-between px-5 py-3 gap-2">
                <button className="flex items-center gap-2 flex-1 text-left" onClick={() => setShowAbout((v) => !v)}>
                  <Info size={14} className="text-blue-200" />
                  <span className="text-[12px] font-semibold text-blue-100">{showAbout ? t("vote_about_hide") : t("vote_about_btn")}</span>
                </button>
                <div className="flex items-center gap-1">
                  {poll.pdfUrl && (
                    <a href={poll.pdfUrl} download target="_blank" rel="noopener noreferrer" aria-label={t("vote_download_pdf")} title={t("vote_download_pdf")}
                      className="flex items-center justify-center w-9 h-9 rounded-lg text-blue-100 hover:bg-white/15 active:bg-white/30 active:scale-95 transition-colors">
                      <Download size={17} />
                    </a>
                  )}
                  <button onClick={() => setShowAbout((v) => !v)} aria-label={showAbout ? t("vote_about_hide") : t("vote_about_btn")} className="flex items-center justify-center w-7 h-7 text-blue-200">
                    {showAbout ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {showAbout && (
                <div className="px-5 pb-5 pt-3" style={{ background: "rgba(0,0,0,0.18)" }}>
                  <div className="mb-4">
                    <AnimatedSegmented
                      variant="onPrimary"
                      fullWidth
                      options={[
                        { key: "short", label: `⚡ ${t("vote_explain_short")}` },
                        { key: "medium", label: `🕐 ${t("vote_explain_medium")}` },
                        { key: "full", label: `📖 ${t("vote_explain_full")}` },
                      ]}
                      value={explainLength}
                      onChange={(k) => setExplainLength(k as "short" | "medium" | "full")}
                    />
                  </div>
                  <div className="space-y-0.5">{explainNodes}</div>
                </div>
              )}
            </div>
          </div>

          {poll.youtubeId && (
            <div className={floatVideoOnDesktop ? "xl:hidden" : undefined}>
              <YouTubeEmbed id={poll.youtubeId} title={poll.title[lang]} />
            </div>
          )}

          {/* Verified-vote status: green when signed in, otherwise a deep link
              into Settings ▸ Personal info where email verification lives. */}
          {backendConfigured && !closed && (
            vUser ? (
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-green-600 dark:text-green-400 px-1">
                <BadgeCheck size={14} className="flex-shrink-0" />
                <span className="min-w-0 truncate">{t("vote_verified_line")} — {vUser.email}</span>
              </p>
            ) : (
              <button onClick={() => window.dispatchEvent(new Event("lefkada:open-profile"))}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-primary dark:text-primary-300 px-1 active:scale-[0.98] transition-transform">
                <BadgeCheck size={14} className="flex-shrink-0" />
                <span className="text-left">{t("vote_verify_cta")} →</span>
              </button>
            )
          )}

          {submitted ? (
            <>
              {sendError && (
                <p className="text-[12.5px] font-semibold text-red-500 px-1">{t("vote_send_error")}</p>
              )}
              <ResultsCard poll={poll} lang={lang} myVote={myVotes[poll.id]} voteCounts={voteCounts} totalVotes={totalVotes} closed={closed} t={t} onChangeVote={() => setSubmitted(false)} />
            </>
          ) : (
            <VotingCard poll={poll} lang={lang} selected={selected} onSelect={setSelected} onSubmit={handleVote}
              signInRequired={backendConfigured && !vUser}
              onSignIn={() => window.dispatchEvent(new Event("lefkada:open-profile"))} t={t} />
          )}
        </div>

        {floatVideoOnDesktop && poll.youtubeId && (
          <div className="hidden xl:block absolute top-0 bottom-0 left-full ml-3 w-[calc(50vw-340px)]">
            <YouTubeEmbed id={poll.youtubeId} title={poll.title[lang]} fill />
          </div>
        )}
      </div>
    </div>
  );
}

export function Countdown({ endDate, t }: { endDate: string; t: (k: string) => string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, new Date(endDate).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000) % 60;
  const seconds = Math.floor(diff / 1000) % 60;

  const units = [
    { v: days, label: t("cd_days") },
    { v: hours, label: t("cd_hours") },
    { v: minutes, label: t("cd_minutes") },
    { v: seconds, label: t("cd_seconds") },
  ];
  let start = 0;
  while (start < units.length - 1 && units[start].v === 0) start++;
  const visible = units.slice(start);

  return (
    <div className="flex justify-center items-start gap-1 py-1">
      {visible.map((u, i) => (
        <div key={u.label} className="flex items-start gap-1">
          {i > 0 && <span className="text-2xl font-bold text-gray-300 dark:text-gray-600 leading-[2.4rem]">:</span>}
          <div className="flex flex-col items-center min-w-[44px]">
            <span className="text-3xl font-extrabold tabular-nums text-primary dark:text-primary-300 leading-none">{String(u.v).padStart(2, "0")}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-1">{u.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EndedBanner({ endDate, lang, t }: { endDate: string; lang: "el" | "en"; t: (k: string) => string }) {
  const formatted = new Date(endDate).toLocaleString(lang === "el" ? "el-GR" : "en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return <p className="text-center text-[12px] font-semibold text-gray-400 dark:text-gray-500 py-1">{t("vote_ended_on")} {formatted}</p>;
}

export function YouTubeEmbed({ id, title, fill = false }: { id: string; title: string; fill?: boolean }) {
  const src = `https://www.youtube-nocookie.com/embed/${id}?modestbranding=1&rel=0&iv_load_policy=3&cc_load_policy=1&color=white`;
  const iframe = (
    <iframe className="absolute inset-0 w-full h-full" src={src} title={title} loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
  );
  if (fill) return <div className="relative w-full h-full overflow-hidden rounded-2xl bg-black shadow-md">{iframe}</div>;
  return <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-md" style={{ aspectRatio: "16 / 9" }}>{iframe}</div>;
}

function VotingCard({ poll, lang, selected, onSelect, onSubmit, signInRequired = false, onSignIn, t }: {
  poll: Poll; lang: "el" | "en"; selected: string | null; onSelect: (id: string) => void; onSubmit: () => void;
  signInRequired?: boolean; onSignIn?: () => void; t: (k: string) => string;
}) {
  return (
    <div className="bg-white dark:bg-[#141929] rounded-2xl p-5 border border-gray-100 dark:border-[#1E2D4E] shadow-sm">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-4">{t("vote_choose")}</p>
      <div className="space-y-2.5">
        {poll.options.map((opt) => {
          const active = selected === opt.id;
          return (
            <button key={opt.id} onClick={() => onSelect(opt.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 active:scale-[0.98] ${active ? "border-primary bg-primary-50 dark:bg-primary-900/20" : "border-gray-100 dark:border-[#252A3A] bg-gray-50 dark:bg-[#0F1219]"}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${active ? "border-primary" : "border-gray-300 dark:border-gray-600"}`}>
                {active && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <span className={`text-[14px] leading-snug ${active ? "font-semibold text-primary dark:text-primary-300" : "text-gray-600 dark:text-gray-300"}`}>{opt.text[lang]}</span>
            </button>
          );
        })}
      </div>
      {/* With the backend on, voting needs a signed-in account — the button
          routes to Settings ▸ Personal info until then. */}
      <button onClick={signInRequired ? onSignIn : onSubmit} disabled={!signInRequired && !selected}
        className={`mt-5 w-full py-3.5 rounded-xl font-bold text-[15px] transition-all active:scale-[0.98] ${signInRequired || selected ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-gray-100 dark:bg-[#252A3A] text-gray-300 dark:text-gray-600 cursor-not-allowed"}`}>
        {signInRequired ? t("vote_signin_to_vote") : t("vote_submit")}
      </button>
    </div>
  );
}

export function ResultsCard({ poll, lang, myVote, voteCounts, totalVotes, closed, t, onChangeVote }: {
  poll: Poll; lang: "el" | "en"; myVote?: string; voteCounts: Record<string, number>; totalVotes: number; closed: boolean; t: (k: string) => string; onChangeVote?: () => void;
}) {
  return (
    <div className="bg-white dark:bg-[#141929] rounded-2xl p-5 border border-gray-100 dark:border-[#1E2D4E] shadow-sm space-y-4">
      {myVote && !closed && (
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 p-3.5 rounded-xl">
          <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-green-700 dark:text-green-400">{t("vote_submitted_title")}</p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">{t("vote_submitted_text")}</p>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold tracking-wide uppercase text-gray-400 dark:text-gray-500">{t("vote_results_title")}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{totalVotes.toLocaleString()} {t("vote_total_votes")}</p>
        </div>
        <div className="space-y-3">
          {poll.options.map((opt) => {
            const count = voteCounts[opt.id] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isMyVote = opt.id === myVote;
            return (
              <div key={opt.id}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className={`font-medium leading-snug ${isMyVote ? "text-primary dark:text-primary-300" : "text-gray-600 dark:text-gray-400"}`}>
                    {isMyVote && "✓ "}{opt.text[lang]}
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300 flex-shrink-0 ml-2">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-[#252A3A] overflow-hidden">
                  <div className="h-full rounded-full bar-fill" style={{ width: `${pct}%`, backgroundColor: isMyVote ? "#0D5EAF" : "#94A3B8" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {!closed && onChangeVote && (
        <button onClick={onChangeVote} className="w-full py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#252A3A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252A3A] transition-colors">
          {t("vote_change")}
        </button>
      )}
    </div>
  );
}
