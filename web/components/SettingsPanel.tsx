"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send,
  CheckCircle2,
  User,
  EyeOff,
  ShieldAlert,
  ShieldOff,
  Megaphone,
  Vote,
  History,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { KEYS, storageGet, storageSet } from "@/lib/storage";
import VetoOverlay from "@/components/VetoOverlay";
import AnimatedSegmented from "@/components/AnimatedSegmented";
import PollBlock, { isPollClosed } from "@/components/PollBlock";
import { pollsData } from "@/data/voting";
import { fetchLiveReferendums, submitMayorMessage, useLive } from "@/lib/backend";

export default function SettingsPanel() {
  const { t, lang, setActiveTab, setGovIntent } = useApp();

  const [anonymous, setAnonymous] = useState(true);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [vetoActive, setVetoActive] = useState(false);
  const [vetoOverlay, setVetoOverlay] = useState(false);
  const [identity, setIdentity] = useState<{ fullName: string; email: string }>({ fullName: "", email: "" });
  // Referendums created in /admin come first, then the bundled ones.
  const liveReferendums = useLive(fetchLiveReferendums);
  const activePolls = [...(liveReferendums ?? []), ...pollsData].filter((p) => !isPollClosed(p, Date.now()));

  useEffect(() => {
    setAnonymous(storageGet<boolean>(KEYS.mayorAnonymous, true));
    setVetoActive(storageGet<boolean>(KEYS.veto, false));
    const p = storageGet<{ fullName?: string; email?: string }>(KEYS.profile, {});
    setIdentity({ fullName: p.fullName ?? "", email: p.email ?? "" });
  }, []);

  useEffect(() => {
    if (!sent) return;
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); setSent(false); return 5; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sent]);

  const handleVetoPress = () => {
    if (vetoActive) { setVetoActive(false); storageSet(KEYS.veto, false); }
    else setVetoOverlay(true);
  };
  const handleVetoDismiss = useCallback(() => {
    setVetoOverlay(false); setVetoActive(true); storageSet(KEYS.veto, true);
  }, []);

  const handleAnon = (a: boolean) => { setAnonymous(a); storageSet(KEYS.mayorAnonymous, a); };

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    // Deliver to the mayor's inbox (Supabase). Keep a local copy either way so
    // the UX is unchanged when the backend isn't configured.
    await submitMayorMessage({
      body: message,
      anonymous,
      name: identity.fullName,
      email: identity.email,
    });
    storageSet(KEYS.mayorMessage, {
      text: message,
      anonymous,
      ...(anonymous ? {} : { name: identity.fullName, email: identity.email }),
      timestamp: new Date().toISOString(),
    });
    setSending(false);
    setSent(true);
    setMessage("");
  };

  return (
    <>
      <div className={`h-full scroll-area ${activePolls.length > 0 ? "snap-y" : ""}`}>
        <div className="pb-6 max-w-2xl mx-auto">
          <div className="px-4 pt-6 space-y-6">
            {/* ══ ACTIVE VOTINGS (each with its own countdown) ═══════════════ */}
            {activePolls.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-primary dark:text-primary-300"><Vote size={14} /></span>
                  <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500">{t("acc_active_votings")}</p>
                </div>
                <div className="space-y-5">
                  {activePolls.map((p) => (
                    <PollBlock key={p.id} poll={p} closed={false} />
                  ))}
                </div>
                <button
                  onClick={() => { setGovIntent({ type: "Consultation" }); setActiveTab("governance"); }}
                  className="w-full mt-4 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors active:scale-[0.98]"
                >
                  <History size={15} />
                  {t("acc_see_old_votings")}
                </button>
                {/* small snap marker at the end of the votings — a tiny target snaps
                    reliably, where the tall votings block (larger than the viewport) would not */}
                <div className="snap-stop" aria-hidden />
              </div>
            )}

            {/* ══ OFFICIAL ACTIONS (VETO) ════════════════════════════════════ */}
            <PSect icon={<ShieldAlert size={14} />} label={t("acc_official")}>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{t("acc_veto_desc")}</p>
              {vetoActive ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl veto-pulse">
                    <ShieldAlert size={20} className="text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-red-600 dark:text-red-400">{t("acc_veto_active_label")}</p>
                      <p className="text-xs text-red-400 mt-0.5">{lang === "el" ? "Η διαμαρτυρία σας είναι ενεργή" : "Your protest is active"}</p>
                    </div>
                  </div>
                  <button onClick={handleVetoPress} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 dark:border-red-800/40 text-red-500 dark:text-red-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-[0.98]">
                    <ShieldOff size={16} />{t("acc_veto_revoke")}
                  </button>
                </div>
              ) : (
                <button onClick={handleVetoPress} className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-lg tracking-wider shadow-lg shadow-red-600/30 transition-all active:scale-[0.97]">
                  <ShieldAlert size={22} />{t("acc_veto_exercise")}
                </button>
              )}
            </PSect>

            {/* ══ MAYOR MESSAGE ═════════════════════════════════════════════ */}
            <PSect icon={<Send size={14} />} label={t("settings_mayor_section")}>
              {sent ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CheckCircle2 size={40} className="text-green-500" />
                  <div>
                    <p className="font-bold text-[15px] text-gray-900 dark:text-white">{t("settings_mayor_sent_title")}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("settings_mayor_sent_text")}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-500">{countdown}</span>
                    </div>
                    <p className="text-xs text-gray-400">{lang === "el" ? "Αυτόματη επαναφορά σε" : "Auto-reset in"} {countdown}s</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <AnimatedSegmented
                      size="sm"
                      options={[
                        { key: "anon", label: t("settings_mayor_anonymous"), icon: <EyeOff size={12} /> },
                        { key: "profile", label: t("settings_mayor_with_profile"), icon: <User size={12} /> },
                      ]}
                      value={anonymous ? "anon" : "profile"}
                      onChange={(k) => handleAnon(k === "anon")}
                    />
                    <a href="https://4mycity.lefkada.gov.gr/" target="_blank" rel="noopener noreferrer" aria-label={t("settings_4mycity_aria")} title={t("settings_4mycity_aria")}
                      className="flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-xl text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-600/30">
                      <Megaphone size={14} className="flex-shrink-0" />
                      <span className="hidden min-[400px]:inline">4MyCity</span>
                    </a>
                  </div>
                  {!anonymous && (identity.fullName || identity.email) && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                      <User size={12} className="text-primary dark:text-primary-300 flex-shrink-0" />
                      <p className="text-[12px] text-primary dark:text-primary-300 font-medium">{[identity.fullName, identity.email].filter(Boolean).join(" · ")}</p>
                    </div>
                  )}
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("settings_mayor_placeholder")} rows={4}
                    className="w-full px-3.5 py-3 rounded-xl text-[14px] leading-relaxed resize-none bg-gray-50 dark:bg-[#252A3A] border border-gray-200 dark:border-[#3A4155] text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors" />
                  <button onClick={handleSend} disabled={!message.trim() || sending}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] transition-all active:scale-[0.98] ${message.trim() && !sending ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-gray-100 dark:bg-[#252A3A] text-gray-300 dark:text-gray-600 cursor-not-allowed"}`}>
                    <Send size={16} />{sending ? t("apply_form_sending") : t("settings_mayor_send")}
                  </button>
                </div>
              )}
            </PSect>
          </div>
        </div>
      </div>

      <VetoOverlay visible={vetoOverlay} onDismiss={handleVetoDismiss} />
    </>
  );
}

function PSect({ icon, label, children, className }: { icon?: React.ReactNode; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon && <span className="text-primary dark:text-primary-300">{icon}</span>}
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400 dark:text-gray-500">{label}</p>
      </div>
      <div className="bg-gray-50 dark:bg-[#0F1219] rounded-2xl border border-gray-100 dark:border-[#1E2D4E] p-4">{children}</div>
    </div>
  );
}
