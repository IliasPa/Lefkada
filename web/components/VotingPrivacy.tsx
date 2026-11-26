"use client";

import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { PARTICIPATION_RETENTION_DAYS } from "@/lib/backend";

/**
 * The voting privacy notice (v2.1): what is stored when someone votes in the
 * app's own polls, who sees it and for how long — and the consent dialog shown
 * before an account's first vote (recorded by accept_voting_terms()).
 *
 * The wording describes what the code does. It is NOT a legal text: before
 * real use, the body running the app must have it reviewed and must name
 * itself as the data controller (i18n keys vpriv_*).
 */
function NoticeBody() {
  const { t } = useApp();
  const days = String(PARTICIPATION_RETENTION_DAYS);
  return (
    <ul className="space-y-2.5 text-[13px] leading-relaxed text-gray-700 dark:text-gray-200">
      {["vpriv_that", "vpriv_what", "vpriv_device", "vpriv_keep", "vpriv_unofficial", "vpriv_rights"].map((k) => (
        <li key={k} className="flex gap-2">
          <span className="text-primary dark:text-primary-300 flex-shrink-0">•</span>
          <span>{t(k).replace("{n}", days)}</span>
        </li>
      ))}
    </ul>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-3" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#141929] border border-gray-100 dark:border-[#1E2D4E] shadow-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 font-bold text-[15px] text-gray-900 dark:text-white">
            <ShieldCheck size={17} className="text-primary dark:text-primary-300 flex-shrink-0" />{title}
          </p>
          <button type="button" onClick={onClose} aria-label="×" className="text-gray-400 p-1 -m-1"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** «What is stored when I vote?» — a link that opens the notice, read-only. */
export function PrivacyLink() {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="text-[11.5px] font-semibold text-gray-400 dark:text-gray-500 underline px-1">
        {t("vpriv_link")}
      </button>
      {open && <Sheet title={t("vpriv_title")} onClose={() => setOpen(false)}><NoticeBody /></Sheet>}
    </>
  );
}

/** Shown before an account's first vote: the notice plus an explicit «I agree». */
export function ConsentDialog({ onAccept, onClose, busy, failed }: {
  onAccept: () => void; onClose: () => void; busy: boolean; failed: boolean;
}) {
  const { t } = useApp();
  const [ticked, setTicked] = useState(false);
  return (
    <Sheet title={t("vpriv_title")} onClose={onClose}>
      <NoticeBody />
      <label className="flex items-start gap-2.5 text-[13px] font-semibold text-gray-800 dark:text-gray-100">
        <input type="checkbox" className="mt-0.5" checked={ticked} onChange={(e) => setTicked(e.target.checked)} />
        <span>{t("vpriv_agree")}</span>
      </label>
      {failed && <p className="text-[12px] font-semibold text-red-500">{t("vpriv_failed")}</p>}
      <button type="button" onClick={onAccept} disabled={!ticked || busy}
        className={`w-full py-3 rounded-xl font-bold text-[14px] transition-all active:scale-[0.98] ${ticked && !busy ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-gray-100 dark:bg-[#252A3A] text-gray-400 cursor-not-allowed"}`}>
        {busy ? "…" : t("vpriv_accept")}
      </button>
    </Sheet>
  );
}
