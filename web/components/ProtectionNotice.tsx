"use client";

import { useState } from "react";
import { ShieldOff } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Poll } from "@/data/voting";
import { inactiveProtections } from "@/lib/protections";

/** Lists the protections this poll does NOT use, so every citizen knows before
 *  voting. Tapping one explains what its absence means. Renders nothing when
 *  the poll uses all of them. */
export default function ProtectionNotice({ poll }: { poll: Poll }) {
  const { t } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const missing = inactiveProtections(poll);
  if (missing.length === 0) return null;
  const shown = missing.find((d) => d.key === open);
  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/15 px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-amber-800 dark:text-amber-300">
        <ShieldOff size={13} className="flex-shrink-0" />
        {t("prot_title")}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {missing.map((d) => (
          <button key={d.key} type="button" aria-expanded={open === d.key}
            onClick={() => setOpen((cur) => (cur === d.key ? null : d.key))}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors active:scale-95 ${
              open === d.key
                ? "bg-amber-600 border-amber-600 text-white"
                : "border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
            }`}>
            {t(d.label)}
          </button>
        ))}
      </div>
      {shown && (
        <p className="mt-2 text-[12px] leading-relaxed text-amber-900 dark:text-amber-200">{t(shown.text)}</p>
      )}
    </div>
  );
}
