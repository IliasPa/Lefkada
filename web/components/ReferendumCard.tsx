"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap, Clock3, BookOpen, BarChart3, Youtube, FileText, CalendarDays, Vote } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { type Poll } from "@/data/voting";
import { KEYS, storageGet } from "@/lib/storage";
import { YouTubeEmbed, ResultsCard, resultsNote, TurnoutLine } from "@/components/PollBlock";
import ProtectionNotice from "@/components/ProtectionNotice";
import { usePollState, countsFromState, getVerifiedUser, submitMayorMessage, type PollState, type VerifiedUser } from "@/lib/backend";
import { keyFingerprint } from "@/lib/ballotSeal";
import { fetchBallots, recount, countUsedTickets } from "@/lib/tally";
import { backendConfigured } from "@/lib/supabase";

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
  // A referendum's real results live on the server and come back only when its
  // protections allow them; the bundled demo polls keep their on-device tally.
  const serverPoll = backendConfigured && poll.id.startsWith("ref_");
  const { state: pollState } = usePollState(poll.id, 60000);

  useEffect(() => {
    const saved = storageGet<Record<string, number>>(KEYS.votes, {});
    const mine = storageGet<Record<string, string>>(KEYS.myVotes, {});
    const merged: Record<string, number> = {};
    poll.options.forEach((o) => { merged[o.id] = (saved[`${poll.id}:${o.id}`] ?? 0) + (poll.seedVotes[o.id] ?? 0); });
    setCounts(merged);
    // Server polls key the remembered choice per account (see PollBlock); on
    // this read-only history card the aggregate is what matters.
    setMyVote(serverPoll ? undefined : mine[poll.id]);
  }, [poll, serverPoll]);

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

        <div className="mb-3 empty:hidden"><ProtectionNotice poll={poll} /></div>

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

        {serverPoll && <div className="mt-3 -mx-1"><TurnoutLine state={pollState} t={t} /></div>}
        {serverPoll && <ParticipationLine poll={poll} voted={pollState?.voted ?? null} loaded={!!pollState} t={t} />}

        {/* Active panel */}
        {open && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#1E2D4E]">
            {(open === "short" || open === "medium" || open === "full") && (
              <Explanation text={poll.explanations[open][lang]} />
            )}
            {open === "results" && (
              !serverPoll ? (
                <ResultsCard poll={poll} lang={lang} myVote={myVote} voteCounts={counts} totalVotes={total} closed t={t} />
              ) : pollState?.state === "visible" ? (
                <>
                  <ResultsCard poll={poll} lang={lang}
                    voteCounts={countsFromState(pollState, poll.options.map((o) => o.id))}
                    totalVotes={pollState.rows.reduce((a, r) => a + r.v, 0)} closed t={t} />
                  {poll.protections?.encrypted
                    ? <VerifyCount poll={poll} state={pollState} t={t} />
                    : poll.protections?.anonymous && <BallotBoxLine poll={poll} state={pollState} t={t} />}
                </>
              ) : (
                <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center py-3">
                  {resultsNote(poll, pollState?.state, t)}
                </p>
              )
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

/** Encrypted referendums (v1.9): anyone can re-decrypt every ballot on their
 *  own device with the published one-time keys and compare the recount with
 *  the published result — the count does not have to be taken on trust. */
function VerifyCount({ poll, state, t }: { poll: Poll; state: PollState; t: (k: string) => string }) {
  const [phase, setPhase] = useState<"idle" | "running" | "ok" | "mismatch" | "unavailable">("idle");
  const [info, setInfo] = useState<{ total: number; invalid: number; tickets: number | null }>({ total: 0, invalid: 0, tickets: null });
  const [fp, setFp] = useState("");
  useEffect(() => {
    if (poll.encryptionKey) keyFingerprint(poll.encryptionKey).then(setFp, () => setFp(""));
  }, [poll.encryptionKey]);

  const run = async () => {
    setPhase("running");
    const rows = await fetchBallots(poll.id);
    if (!rows || rows.length === 0 || rows.some((b) => !b.opening)) { setPhase("unavailable"); return; }
    const rc = await recount(poll.id, rows, poll.options.length);
    const published = poll.options.map((_, i) => state.rows.filter((r) => r.o === i).reduce((a, r) => a + r.v, 0));
    // v2.1: the ballot box must also hold exactly as many ballots as tickets
    // were used — a ballot removed from (or slipped into) the box shows here.
    const tickets = await countUsedTickets(poll.id);
    const same = rc.disagreements === 0 && rc.counts.every((c, i) => c === published[i])
      && (tickets === null || tickets === rc.total);
    setInfo({ total: rc.total, invalid: rc.invalid, tickets });
    setPhase(same ? "ok" : "mismatch");
  };

  return (
    <div className="mt-3 rounded-xl border border-gray-100 dark:border-[#1E2D4E] p-3.5 space-y-2">
      <button type="button" onClick={run} disabled={phase === "running"}
        className="px-3 py-1.5 rounded-lg text-[12px] font-bold border active:scale-95 disabled:opacity-50"
        style={{ borderColor: ACCENT + "44", color: ACCENT }}>
        {phase === "running" ? t("verify_running") : t("verify_btn")}
      </button>
      {phase === "ok" && (
        <p className="text-[12.5px] font-semibold text-green-600 dark:text-green-400 leading-relaxed">
          ✓ {t("verify_ok").replace("{n}", String(info.total))}
          {info.invalid > 0 && " " + t("verify_invalid").replace("{n}", String(info.invalid))}
        </p>
      )}
      {phase === "mismatch" && (
        <p className="text-[12.5px] font-bold text-red-500 leading-relaxed">
          ✗ {info.tickets !== null && info.tickets !== info.total
            ? t("verify_box_mismatch").replace("{t}", String(info.tickets)).replace("{b}", String(info.total))
            : t("verify_mismatch")}
        </p>
      )}
      {phase === "unavailable" && <p className="text-[12.5px] text-gray-500 dark:text-gray-400">{t("verify_unavailable")}</p>}
      {fp && <p className="text-[11px] text-gray-400">{t("verify_key")}: <span className="font-mono">{fp}</span></p>}
    </div>
  );
}

/** Anonymous (not encrypted) referendums, v2.1: the number of ballots the
 *  server accepted — the public list of used tickets — must equal the number
 *  of votes in the published result. Checked on the citizen's own device. */
function BallotBoxLine({ poll, state, t }: { poll: Poll; state: PollState; t: (k: string) => string }) {
  const [tickets, setTickets] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    countUsedTickets(poll.id).then((n) => { if (alive) setTickets(n); });
    return () => { alive = false; };
  }, [poll.id]);
  if (tickets === null) return null;
  const counted = state.rows.reduce((a, r) => a + r.v, 0);
  const same = tickets === counted;
  return (
    <p className={`mt-3 text-[12px] font-semibold leading-relaxed ${same ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
      {same
        ? "✓ " + t("box_ok").replace(/\{n\}/g, String(tickets))
        : "✗ " + t("verify_box_mismatch").replace("{t}", String(tickets)).replace("{b}", String(counted))}
    </p>
  );
}

/** v2.1 — what the roll says about THIS account, shown on every finished
 *  referendum: «you voted» / «you did not vote». A ballot cast in someone's
 *  name without them shows up here, and one tap reports it. (Only whether the
 *  account took part is recorded — never what it chose.) */
function ParticipationLine({ poll, voted, loaded, t }: { poll: Poll; voted: boolean | null; loaded: boolean; t: (k: string) => string }) {
  const [user, setUser] = useState<VerifiedUser | null>(null);
  const [sent, setSent] = useState<"" | "ok" | "fail">("");
  useEffect(() => { getVerifiedUser().then(setUser); }, []);
  if (!user || !loaded) return null;
  // The roll is deleted some weeks after closing (retention) — then nobody's
  // participation is on record any more, and the app says so.
  if (voted === null) {
    return <p className="mt-3 text-[12px] text-gray-400 dark:text-gray-500 leading-relaxed">{t("part_purged")}</p>;
  }
  const report = async () => {
    if (!window.confirm(t("part_report_confirm"))) return;
    const ok = await submitMayorMessage({
      anonymous: false, email: user.email,
      body: `[Αναφορά συμμετοχής] Ψηφοφορία «${poll.title.el}» (${poll.id}). Τα αρχεία δείχνουν ότι ο λογαριασμός ${user.email} `
        + `${voted ? "ΨΗΦΙΣΕ" : "ΔΕΝ ΨΗΦΙΣΕ"}, αλλά ο κάτοχός του δηλώνει ότι αυτό ΔΕΝ ισχύει.`,
    });
    setSent(ok ? "ok" : "fail");
  };
  return (
    <p className="mt-3 text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
      {t(voted ? "part_voted" : "part_not_voted")}{" "}
      {sent === "ok" ? (
        <span className="font-semibold text-green-600 dark:text-green-400">{t("part_report_sent")}</span>
      ) : (
        <button type="button" onClick={report} className="font-bold underline" style={{ color: ACCENT }}>
          {t(sent === "fail" ? "part_report_failed" : "part_report")}
        </button>
      )}
    </p>
  );
}
