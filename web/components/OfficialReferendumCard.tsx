"use client";

import { ExternalLink, FileText, Landmark } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { athensToday, type OfficialReferendum } from "@/lib/backend";

/**
 * The OFFICIAL municipal referendum (Law 5314/2026, articles 173–181).
 *
 * The app does not — and by law cannot — hold this vote: it is conducted by
 * the municipality through ΕΔΥΤΕ's ballot box, and each voter receives a
 * personal link at the contact details they registered in the National
 * Contact Registry (Ε.Μ.Επ.). What the app does is inform: the question, the
 * two answers, the day, the registration deadline that decides who can vote,
 * and afterwards the result with the turnout the law requires.
 */
const EMEP_URL = "https://emep.gov.gr";

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);

export default function OfficialReferendumCard({ item }: { item: OfficialReferendum }) {
  const { t, lang } = useApp();
  const today = athensToday();
  const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString(lang === "el" ? "el-GR" : "en-GB",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const over = today > item.voteDate;
  const emepLeft = item.emepDeadline ? daysBetween(today, item.emepDeadline) : null;

  // Result + validity (art. 180): relative majority of valid ballots; valid if
  // turnout ≥ 30% of registered voters OR ≥ 50% of those who voted in the last
  // local elections. Blank ballots are not valid ballots.
  const a = item.votesA ?? null; const b = item.votesB ?? null;
  const hasResult = a !== null && b !== null;
  const valid = hasResult ? a + b : 0;
  const voted = valid + (item.blank ?? 0);
  const byRegistered = item.registered ? voted / item.registered : null;
  const byLastElection = item.lastElectionVoters ? voted / item.lastElectionVoters : null;
  const quorum = byRegistered === null && byLastElection === null
    ? null
    : (byRegistered !== null && byRegistered >= 0.3) || (byLastElection !== null && byLastElection >= 0.5);
  const pct = (n: number) => (valid > 0 ? Math.round((n / valid) * 100) : 0);

  return (
    <article className="rounded-2xl overflow-hidden border-2 border-[#A61E34]/40 bg-white dark:bg-[#141929] shadow-sm">
      <div className="px-5 py-3 bg-[#A61E34] text-white">
        <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em]">
          <Landmark size={12} /> {t("off_badge")}
        </p>
        <p className="text-[10.5px] font-semibold text-red-100 mt-0.5">{t("off_law")}</p>
      </div>
      <div className="p-5 space-y-3.5">
        <h2 className="font-bold text-[16px] leading-snug text-gray-900 dark:text-white">{item.question[lang] || item.question.el}</h2>
        <div className="grid grid-cols-2 gap-2">
          {[item.answerA, item.answerB].map((ans, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-[#3A4155] px-3 py-2.5 text-center text-[13.5px] font-bold text-gray-800 dark:text-gray-100">
              {ans?.[lang] || ans?.el}
            </div>
          ))}
        </div>
        <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">
          {t(over ? "off_held_on" : "off_vote_on")} <span className="font-black">{fmt(item.voteDate)}</span>{!over && <> · 07:00–19:00</>}
        </p>

        {!over && (
          <p className="text-[12.5px] leading-relaxed text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#0F1219] rounded-xl p-3">
            {t("off_not_here")}
          </p>
        )}

        {/* The Ε.Μ.Επ. reminder — who is not registered by the deadline cannot vote. */}
        {!over && item.emepDeadline && emepLeft !== null && (
          emepLeft >= 0 ? (
            <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/15 p-3.5 space-y-2">
              <p className="text-[13px] font-bold text-amber-900 dark:text-amber-200">
                {t("off_emep_title").replace("{date}", fmt(item.emepDeadline))}
                {" "}({emepLeft === 0 ? t("off_emep_today") : t("off_emep_days").replace("{n}", String(emepLeft))})
              </p>
              <p className="text-[12.5px] leading-relaxed text-amber-900 dark:text-amber-200">{t("off_emep_text")}</p>
              <a href={EMEP_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 text-white text-[12.5px] font-bold active:scale-95">
                {t("off_emep_btn")} <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            <p className="text-[12.5px] font-semibold text-gray-500 dark:text-gray-400">{t("off_emep_passed").replace("{date}", fmt(item.emepDeadline))}</p>
          )
        )}

        {item.info?.el && (
          <div className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">{item.info[lang] || item.info.el}</div>
        )}

        {hasResult && (
          <div className="rounded-xl border border-gray-100 dark:border-[#1E2D4E] p-3.5 space-y-2.5">
            <p className="text-xs font-bold tracking-wide uppercase text-gray-400 dark:text-gray-500">{t("off_result")}</p>
            {[[item.answerA, a], [item.answerB, b]].map(([ans, n], i) => (
              <div key={i}>
                <div className="flex justify-between text-[12.5px] mb-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{(ans as OfficialReferendum["answerA"])?.[lang] || (ans as OfficialReferendum["answerA"])?.el}</span>
                  <span className="font-black text-gray-800 dark:text-gray-100">{(n as number).toLocaleString()} · {pct(n as number)}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-[#252A3A] overflow-hidden">
                  <div className="h-full rounded-full bg-[#A61E34]" style={{ width: `${pct(n as number)}%` }} />
                </div>
              </div>
            ))}
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              {t("off_voted").replace("{n}", voted.toLocaleString())}
              {byRegistered !== null && <> · {t("off_of_registered").replace("{p}", String(Math.round(byRegistered * 100)))}</>}
              {item.blank ? <> · {t("off_blank").replace("{n}", item.blank.toLocaleString())}</> : null}
            </p>
            {quorum !== null && (
              <p className={`text-[12.5px] font-bold ${quorum ? "text-green-600 dark:text-green-400" : "text-amber-600"}`}>
                {t(quorum ? "off_quorum_yes" : "off_quorum_no")}
              </p>
            )}
            <p className="text-[11.5px] text-gray-400 dark:text-gray-500">{t("off_advisory")}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {item.decisionPdf && (
            <a href={item.decisionPdf} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold border border-[#A61E34]/40 text-[#A61E34]">
              <FileText size={12} /> {t("off_decision")}
            </a>
          )}
          {item.voteUrl && (
            <a href={item.voteUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold border border-[#A61E34]/40 text-[#A61E34]">
              <ExternalLink size={12} /> {t("off_more")}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
