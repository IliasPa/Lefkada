"use client";

import { useState } from "react";
import { X, Clock, MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  alertsData,
  ALERT_META,
  ALERT_ORDER,
  type AlertType,
} from "@/data/alerts";

/** Circular emoji alert buttons (water/power/fire/weather/road). A type only
 *  appears when it has at least one active alert. Tapping opens its details. */
export default function NewsAlerts() {
  const { t, lang } = useApp();
  const [sel, setSel] = useState<AlertType | null>(null);

  const active = ALERT_ORDER.filter((ty) =>
    alertsData.some((a) => a.type === ty),
  );
  if (active.length === 0) return null;

  const selAlerts = sel ? alertsData.filter((a) => a.type === sel) : [];

  return (
    <>
      <div className="flex justify-center flex-wrap gap-3 mb-4">
        {active.map((ty) => {
          const meta = ALERT_META[ty];
          return (
            <button
              key={ty}
              onClick={() => setSel(ty)}
              aria-label={t(meta.tKey)}
              title={t(meta.tKey)}
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-base bg-white dark:bg-[#141929] border border-gray-200 dark:border-[#252A3A] shadow-sm hover:scale-105 active:scale-95 transition-transform"
            >
              <span aria-hidden="true">{meta.emoji}</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center leading-none">
                !
              </span>
            </button>
          );
        })}
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSel(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#141929] rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[80vh] flex flex-col">
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1E2D4E]"
              style={{ borderTop: `4px solid ${ALERT_META[sel].color}` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">
                  {ALERT_META[sel].emoji}
                </span>
                <h3 className="font-bold text-[16px] text-gray-900 dark:text-white">
                  {t(ALERT_META[sel].tKey)}
                </h3>
              </div>
              <button
                onClick={() => setSel(null)}
                aria-label={t("close")}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252A3A] active:scale-90"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              {selAlerts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl p-3.5 bg-gray-50 dark:bg-[#0F1219] border border-gray-100 dark:border-[#1E2D4E]"
                >
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-700 dark:text-gray-300">
                    <MapPin size={13} style={{ color: ALERT_META[sel].color }} />
                    {a.area[lang]}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 mt-1">
                    <Clock size={12} />
                    {a.time[lang]}
                  </div>
                  <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
                    {a.message[lang]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
