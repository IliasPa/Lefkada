"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, Info, Download, BadgeCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AnimatedSegmented from "@/components/AnimatedSegmented";
import { type Poll } from "@/data/voting";
import { KEYS, storageGet, storageSet } from "@/lib/storage";
import {
  submitVote, getVerifiedUser, usePollState, countsFromState, fetchOwnCitizenStatus, acceptVotingTerms,
  VOTING_NOTICE_VERSION, type PollState, type VerifiedUser,
} from "@/lib/backend";
import { ConsentDialog, PrivacyLink } from "@/components/VotingPrivacy";
import { backendConfigured, getSupabase } from "@/lib/supabase";
import ProtectionNotice from "@/components/ProtectionNotice";
import { castAnonymousBallot, resumePendingBallot, pendingBallotInfo, installBallotFlush, getReceipt, checkReceipt } from "@/lib/ballot";

/** Holding the vote button this long is the deliberate-intent safeguard —
 *  matching the veto button, and standing in for the removed "change vote". */
const VOTE_HOLD_MS = 4000;

type VoteCounts = Record<string, number>;
type MyVotes = Record<string, string>;

export function isPollClosed(poll: Poll, now: number) {
  return new Date(poll.endDate).getTime() <= now;
}

// ── A single poll: countdown/ended + about + video + ballot/results ──────────
const CONSENT_EVENT = "lefkada:voting-consent";

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
  const [sending, setSending] = useState(false);
  const [voteError, setVoteError] = useState<"" | "failed" | "closed" | "taxis">("");
  // TAXISnet-only polls (v2.0): is the signed-in account verified?
  const taxisOnly = backendConfigured && !!poll.protections?.taxisOnly;
  const [taxisVerified, setTaxisVerified] = useState<boolean | null>(null);
  // v2.1 — the voting privacy notice must be accepted before a first vote.
  const [consented, setConsented] = useState<boolean | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentFailed, setConsentFailed] = useState(false);
  // Anonymous ballots (v1.8): a ticket this device holds whose ballot is not
  // delivered yet — v2.1: either waiting out its random delay ("scheduled") or
  // due / failed once ("overdue").
  const anonymous = backendConfigured && !!poll.protections?.anonymous;
  const [pending, setPending] = useState<{ optionId: string; dueIn: number } | null>(null);
  const [explainLength, setExplainLength] = useState<"short" | "medium" | "full">("short");
  const [vUser, setVUser] = useState<VerifiedUser | null>(null);

  // A demo poll (v2.1.1) stays on the device: no sign-in, no consent, nothing
  // sent. `live` = this poll's votes go to the server.
  const demo = !!poll.demo;
  const live = backendConfigured && !demo;

  // The server's view of this poll: has this ACCOUNT voted (on any device), and
  // the results — only when the referendum's protections allow them.
  const { state: pollState, reload } = usePollState(live ? poll.id : null);

  // Follow sign-in / sign-out live, so the ballot always belongs to whoever is
  // signed in right now (several people may vote in turn on a shared device).
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    getVerifiedUser().then(setVUser);
    const { data } = sb.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setVUser(u ? { id: u.id, email: u.email ?? "" } : null);
      reload();
    });
    return () => data.subscription.unsubscribe();
  }, [reload]);

  useEffect(() => {
    if (!live || !vUser) { setTaxisVerified(null); setConsented(null); return; }
    let alive = true;
    fetchOwnCitizenStatus().then((s) => {
      if (!alive) return;
      setTaxisVerified(!!s?.taxis_verified);
      setConsented(s?.consent_version === VOTING_NOTICE_VERSION);
    });
    return () => { alive = false; };
  }, [live, vUser]);

  const acceptConsent = useCallback(async () => {
    setConsentBusy(true); setConsentFailed(false);
    const ok = await acceptVotingTerms();
    setConsentBusy(false);
    if (ok) { setConsentOpen(false); window.dispatchEvent(new Event(CONSENT_EVENT)); } else setConsentFailed(true);
  }, []);
  // One acceptance covers every poll on the screen, not only the one it was given on.
  useEffect(() => {
    const onConsent = () => setConsented(true);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  const keyOf = (id: string) => `${poll.id}:${id}`;

  useEffect(() => {
    const saved = storageGet<VoteCounts>(KEYS.votes, {});
    const merged: VoteCounts = {};
    poll.options.forEach((o) => {
      merged[o.id] = (saved[`${poll.id}:${o.id}`] ?? 0) + (poll.seedVotes[o.id] ?? 0);
    });
    setVoteCounts(merged);
    setMyVotes(storageGet<MyVotes>(KEYS.myVotes, {}));
  }, [poll]);

  // The choice is remembered ONLY on the device that cast it, and per account —
  // the server never stores who chose what. With a backend, a signed-out
  // device shows nobody's choice.
  const voteKey = live ? (vUser ? `${vUser.id}:${poll.id}` : null) : poll.id;
  const myVote = voteKey ? myVotes[voteKey] : undefined;
  const serverVoted = live && !!vUser && !!pollState?.voted;
  const submitted = closed || !!myVote || serverVoted || !!pending;
  const receipt = anonymous && vUser ? getReceipt(vUser.id, poll.id) : undefined;

  /** Deliver a ballot this device still owes, if it is due (its random delay
   *  is over, or an earlier attempt failed) — or right away with `force`. */
  const resume = useCallback(async (force = false) => {
    const info = anonymous && vUser ? pendingBallotInfo(vUser.id, poll.id) : null;
    setPending(info);
    if (!info || !vUser) return;
    if (!force && info.dueIn > 0) return; // still scheduled — the timer below comes back
    setSending(true);
    const outcome = await resumePendingBallot(poll, force);
    setSending(false);
    setMyVotes(storageGet<MyVotes>(KEYS.myVotes, {}));
    setPending(pendingBallotInfo(vUser.id, poll.id));
    if (outcome === "closed") setVoteError("closed");
    reload();
  }, [anonymous, vUser, poll, reload]);
  useEffect(() => { resume(); }, [resume]);
  // A scheduled ballot goes by itself when its time comes — and at once if the
  // app is left before that (lib/ballot.ts ▸ flushPendingBallots).
  useEffect(() => { if (anonymous) installBallotFlush(); }, [anonymous]);
  useEffect(() => {
    if (!pending || pending.dueIn <= 0) return;
    const id = setTimeout(() => resume(), pending.dueIn + 50);
    return () => clearTimeout(id);
  }, [pending, resume]);

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  // One shot — a vote cannot be changed once cast (there is no "change vote").
  const handleVote = useCallback(async () => {
    if (!selected || closed || submitted || sending) return;
    if (!live) {
      // A demo poll, or no backend: the on-device tally is the whole story.
      const savedCounts = storageGet<VoteCounts>(KEYS.votes, {});
      const updated = { ...savedCounts, [keyOf(selected)]: (savedCounts[keyOf(selected)] ?? 0) + 1 };
      const updatedMyVotes = { ...myVotes, [poll.id]: selected };
      storageSet(KEYS.votes, updated);
      storageSet(KEYS.myVotes, updatedMyVotes);
      const merged: VoteCounts = {};
      poll.options.forEach((o) => {
        merged[o.id] = (updated[keyOf(o.id)] ?? 0) + (poll.seedVotes[o.id] ?? 0);
      });
      setVoteCounts(merged);
      setMyVotes(updatedMyVotes);
      return;
    }
    if (!voteKey) return;
    // The SERVER decides (cast_vote): the choice is remembered on this device
    // only once the ballot really landed — never on a failure, and never when
    // the account had already voted elsewhere.
    setSending(true);
    setVoteError("");
    const index = poll.options.findIndex((o) => o.id === selected);
    // Anonymous referendums go through the two-step ticket flow, which also
    // records the choice on this device itself once the ballot is delivered.
    const outcome = anonymous ? await castAnonymousBallot(poll, index) : await submitVote(poll.id, index);
    setSending(false);
    if (outcome === "ok" && !anonymous) {
      storageSet(KEYS.myVotes, { ...storageGet<MyVotes>(KEYS.myVotes, {}), [voteKey]: selected });
    } else if (outcome === "failed" || outcome === "closed" || outcome === "taxis") {
      setVoteError(outcome);
    } else if (outcome === "consent") {
      setConsented(false); setConsentOpen(true); // the server says the notice was not accepted
    }
    setMyVotes(storageGet<MyVotes>(KEYS.myVotes, {}));
    setPending(anonymous && vUser ? pendingBallotInfo(vUser.id, poll.id) : null);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, myVotes, poll, closed, submitted, sending, voteKey, anonymous, vUser, reload, live]);

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
                {closed ? t("vote_results_title") : t(demo ? "vote_demo_badge" : "vote_active_badge")}
              </span>
              <h2 className="font-bold text-[17px] text-white leading-snug">{poll.title[lang]}</h2>
              {/* v2.1 — never to be mistaken for the official municipal referendum */}
              <p className="text-[11px] font-semibold text-blue-200 mt-2 leading-snug">{t(demo ? "vote_demo_note" : "vote_unofficial_note")}</p>
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

          {!demo && <ProtectionNotice poll={poll} />}

          {live && <TurnoutLine state={pollState} t={t} />}

          {/* When signed out, a deep link into Settings ▸ Personal info where
              email sign-in lives (voting needs an account). */}
          {live && !closed && !vUser && (
            <button onClick={() => window.dispatchEvent(new Event("lefkada:open-profile"))}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-primary dark:text-primary-300 px-1 active:scale-[0.98] transition-transform">
              <BadgeCheck size={14} className="flex-shrink-0" />
              <span className="text-left">{t("vote_verify_cta")} →</span>
            </button>
          )}

          {voteError && !submitted && (
            <p className="text-[12.5px] font-semibold text-red-500 px-1">
              {t(voteError === "closed" ? "vote_closed_error" : voteError === "taxis" ? "vote_taxis_required" : "vote_send_error")}
            </p>
          )}

          {submitted ? (
            live ? (
              pollState?.state === "visible" ? (
                // Results the referendum's protections allow — live counts.
                <ResultsCard poll={poll} lang={lang} myVote={myVote}
                  voteCounts={countsFromState(pollState, poll.options.map((o) => o.id))}
                  totalVotes={pollState.rows.reduce((a, r) => a + r.v, 0)} closed={closed} t={t} />
              ) : (
                // Results withheld — show only what this person voted (if this
                // is the device they voted from) and why the rest is hidden.
                <YourVoteCard poll={poll} lang={lang} myVote={myVote} voted={serverVoted}
                  resultsState={pollState?.state} receipt={receipt}
                  pending={pending ? (pending.dueIn > 0 ? "scheduled" : "overdue") : undefined}
                  pendingChoice={pending?.optionId}
                  busy={sending} onRetry={() => resume(true)} t={t} />
              )
            ) : (
              <ResultsCard poll={poll} lang={lang} myVote={myVote} voteCounts={voteCounts} totalVotes={totalVotes} closed={closed} t={t} />
            )
          ) : (
            <VotingCard poll={poll} lang={lang} selected={selected} onSelect={setSelected} onSubmit={handleVote}
              busy={sending} busyLabel={anonymous ? t("vote_sending_anon") : t("vote_sending")}
              signInRequired={live && (!vUser || (taxisOnly && taxisVerified === false) || consented === false)}
              signInLabel={!vUser ? undefined
                : taxisOnly && taxisVerified === false ? t("vote_taxis_to_vote")
                : t("vote_consent_to_vote")}
              onSignIn={() => {
                if (vUser && !(taxisOnly && taxisVerified === false)) setConsentOpen(true);
                else window.dispatchEvent(new Event("lefkada:open-profile"));
              }} t={t} />
          )}

          {live && <div className="text-center"><PrivacyLink /></div>}
          {consentOpen && (
            <ConsentDialog onAccept={acceptConsent} onClose={() => setConsentOpen(false)} busy={consentBusy} failed={consentFailed} />
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

/** v2.1 — how many accounts have voted, out of how many could. Shown to
 *  everyone, also while the results themselves are hidden: a poll answered by
 *  40 people must not read as the opinion of the town. */
export function TurnoutLine({ state, t }: { state: PollState | null; t: (k: string) => string }) {
  if (!state || state.turnout == null || state.eligible == null) return null;
  const pct = state.eligible > 0 ? Math.round((state.turnout / state.eligible) * 100) : 0;
  return (
    <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 px-1">
      {t("vote_turnout").replace("{n}", state.turnout.toLocaleString()).replace("{m}", state.eligible.toLocaleString()).replace("{p}", String(pct))}
    </p>
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

function VotingCard({ poll, lang, selected, onSelect, onSubmit, busy = false, busyLabel, signInRequired = false, signInLabel, onSignIn, t }: {
  poll: Poll; lang: "el" | "en"; selected: string | null; onSelect: (id: string) => void; onSubmit: () => void;
  busy?: boolean; busyLabel?: string; signInRequired?: boolean; signInLabel?: string; onSignIn?: () => void; t: (k: string) => string;
}) {
  // Hold-to-submit: the ring fills over 4s (like the veto). Releasing early
  // cancels — a vote is one shot, so this stands in for the removed "change
  // vote" as a deliberate-intent gate.
  const [holdPct, setHoldPct] = useState(0);
  const holdRaf = useRef(0);
  const endHold = useCallback(() => {
    cancelAnimationFrame(holdRaf.current);
    holdRaf.current = 0;
    setHoldPct(0);
  }, []);
  const beginHold = useCallback(() => {
    if (!selected || busy || holdRaf.current) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / VOTE_HOLD_MS);
      setHoldPct(p);
      if (p >= 1) { endHold(); onSubmit(); }
      else holdRaf.current = requestAnimationFrame(tick);
    };
    holdRaf.current = requestAnimationFrame(tick);
  }, [selected, busy, onSubmit, endHold]);
  useEffect(() => () => cancelAnimationFrame(holdRaf.current), []);

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
      {signInRequired ? (
        <button onClick={onSignIn}
          className="mt-5 w-full py-3.5 rounded-xl font-bold text-[15px] bg-primary text-white shadow-md shadow-primary/30 transition-all active:scale-[0.98]">
          {signInLabel ?? t("vote_signin_to_vote")}
        </button>
      ) : (
        <>
          <button
            onPointerDown={beginHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            onContextMenu={(e) => e.preventDefault()}
            disabled={!selected || busy}
            style={{ WebkitTouchCallout: "none", touchAction: "manipulation" } as React.CSSProperties}
            className={`mt-5 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-[15px] select-none transition-colors ${selected ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-gray-100 dark:bg-[#252A3A] text-gray-300 dark:text-gray-600 cursor-not-allowed"}`}>
            <span className="relative flex items-center justify-center w-6 h-6 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 15.5} strokeDashoffset={(1 - holdPct) * 2 * Math.PI * 15.5} />
              </svg>
              <CheckCircle2 size={13} />
            </span>
            {busy ? busyLabel ?? t("vote_sending") : t("vote_submit")}
          </button>
          {selected && !busy && (
            <p className="text-center text-[11.5px] font-semibold text-gray-400 dark:text-gray-500 mt-2">
              {t("acc_veto_hold_hint")}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function ResultsCard({ poll, lang, myVote, voteCounts, totalVotes, closed, t }: {
  poll: Poll; lang: "el" | "en"; myVote?: string; voteCounts: Record<string, number>; totalVotes: number; closed: boolean; t: (k: string) => string;
}) {
  return (
    <div className="bg-white dark:bg-[#141929] rounded-2xl p-5 border border-gray-100 dark:border-[#1E2D4E] shadow-sm space-y-4">
      {myVote && !closed && (
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 p-3.5 rounded-xl">
          <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-green-700 dark:text-green-400">{t(poll.demo ? "vote_demo_done_title" : "vote_submitted_title")}</p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">{t(poll.demo ? "vote_demo_done_text" : "vote_submitted_text")}</p>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold tracking-wide uppercase text-gray-400 dark:text-gray-500">{t("vote_results_title")}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{totalVotes.toLocaleString()} {t("vote_total_votes")}</p>
        </div>
        {poll.demo && <p className="text-[11.5px] font-semibold text-amber-700 dark:text-amber-400 mb-3">{t("vote_demo_numbers")}</p>}
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
    </div>
  );
}

/** Why a poll's results are not shown — one line per poll_state() state. */
export function resultsNote(poll: Poll, state: PollState["state"] | undefined, t: (k: string) => string): string {
  if (state === "until_close") return t("vote_results_after_close");
  if (state === "awaiting_count") return t("vote_results_awaiting_count");
  if (state === "below_min") return t("vote_results_below_min").replace("{n}", String(poll.protections?.minVotes ?? 0));
  return t("vote_results_hidden");
}

/** Shown after voting while the results are withheld: the citizen sees only
 *  their own choice — and only on the device they voted from, because the
 *  server never stores who chose what. On any other device the account is
 *  simply told it has already voted. */
function YourVoteCard({ poll, lang, myVote, voted, resultsState, receipt, pending, pendingChoice, busy = false, onRetry, t }: {
  poll: Poll; lang: "el" | "en"; myVote?: string; voted: boolean;
  resultsState?: PollState["state"]; receipt?: string;
  /** Anonymous ballots: the ticket is on this device but the ballot is not
   *  delivered yet — "scheduled" (waiting out its random delay, all is well) or
   *  "overdue" (an attempt did not get through). */
  pending?: "scheduled" | "overdue"; pendingChoice?: string;
  busy?: boolean; onRetry?: () => void; t: (k: string) => string;
}) {
  const chosen = poll.options.find((o) => o.id === myVote);
  const waiting = poll.options.find((o) => o.id === pendingChoice);
  return (
    <div className="bg-white dark:bg-[#141929] rounded-2xl p-5 border border-gray-100 dark:border-[#1E2D4E] shadow-sm space-y-3">
      {pending === "scheduled" ? (
        <div className="bg-primary-50 dark:bg-primary-900/20 p-3.5 rounded-xl">
          <p className="font-semibold text-sm text-primary dark:text-primary-300">{t("vote_scheduled_title")}</p>
          {waiting && (
            <p className="text-[13px] text-gray-700 dark:text-gray-200 mt-1">
              {t("vote_your_vote")} <span className="font-bold">{waiting.text[lang]}</span>
            </p>
          )}
          <p className="text-[12.5px] text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">{t("vote_scheduled_text")}</p>
          <button type="button" onClick={onRetry} disabled={busy}
            className="mt-2.5 px-3 py-1.5 rounded-lg border border-primary/40 text-primary dark:text-primary-300 text-[12px] font-bold active:scale-95 disabled:opacity-50">
            {busy ? t("vote_sending_anon") : t("vote_pending_retry")}
          </button>
        </div>
      ) : pending ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-3.5 rounded-xl">
          <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">{t("vote_pending_title")}</p>
          <p className="text-[12.5px] text-amber-900 dark:text-amber-200 mt-1 leading-relaxed">{t("vote_pending_text")}</p>
          <button type="button" onClick={onRetry} disabled={busy}
            className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[12px] font-bold active:scale-95 disabled:opacity-50">
            {busy ? t("vote_sending_anon") : t("vote_pending_retry")}
          </button>
        </div>
      ) : chosen ? (
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 p-3.5 rounded-xl">
          <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-green-700 dark:text-green-400">{t("vote_submitted_title")}</p>
            <p className="text-[13px] text-green-700 dark:text-green-300 mt-1">
              {t("vote_your_vote")} <span className="font-bold">{chosen.text[lang]}</span>
            </p>
            {receipt && <p className="text-[11.5px] text-green-700/80 dark:text-green-300/80 mt-1.5 leading-relaxed">{t("vote_anon_note")}</p>}
          </div>
        </div>
      ) : voted ? (
        <div className="flex items-start gap-3 bg-primary-50 dark:bg-primary-900/20 p-3.5 rounded-xl">
          <CheckCircle2 size={20} className="text-primary dark:text-primary-300 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-primary dark:text-primary-300">{t("vote_already_title")}</p>
            <p className="text-[12.5px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{t("vote_already_text")}</p>
          </div>
        </div>
      ) : null}
      {receipt && !pending && <ReceiptLine pollId={poll.id} receipt={receipt} t={t} />}
      <p className={`text-gray-400 dark:text-gray-500 text-center ${chosen || voted || pending ? "text-[11.5px]" : "text-[13px] py-2"}`}>
        {resultsNote(poll, resultsState, t)}
      </p>
    </div>
  );
}

/** The receipt code of an anonymous ballot, checked against the public list of
 *  counted tickets — proof that the ballot arrived (it does not show, to
 *  anyone, which option it carried). */
function ReceiptLine({ pollId, receipt, t }: { pollId: string; receipt: string; t: (k: string) => string }) {
  const [found, setFound] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    checkReceipt(pollId, receipt).then((v) => { if (alive) setFound(v); });
    return () => { alive = false; };
  }, [pollId, receipt]);
  const code = (receipt.slice(0, 16).toUpperCase().match(/.{4}/g) ?? []).join("-");
  return (
    <div className="rounded-xl border border-gray-100 dark:border-[#1E2D4E] px-3.5 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t("vote_receipt")}</p>
      <p className="font-mono text-[13px] font-bold text-gray-700 dark:text-gray-200 mt-0.5 select-all" title={receipt}>{code}</p>
      {found !== null && (
        <p className={`text-[11.5px] font-semibold mt-0.5 ${found ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
          {found ? "✓ " : "✗ "}{t(found ? "vote_receipt_found" : "vote_receipt_missing")}
        </p>
      )}
    </div>
  );
}
