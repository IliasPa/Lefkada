"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { animate, spring } from "animejs";
import {
  Newspaper,
  CalendarDays,
  Vote,
  Heart,
  BarChart3,
  Briefcase,
  Dices,
  Phone,
  Moon,
  Sun,
  Languages,
  type LucideIcon,
} from "lucide-react";
import { useApp, type TabKey } from "@/context/AppContext";

interface TabDef {
  key: TabKey;
  Icon: LucideIcon;
}

const TABS: TabDef[] = [
  { key: "home", Icon: Newspaper },
  { key: "culture", Icon: CalendarDays },
  { key: "vote", Icon: Vote },
  { key: "health", Icon: Heart },
  { key: "financials", Icon: BarChart3 },
  { key: "jobs", Icon: Briefcase },
  { key: "game", Icon: Dices },
  { key: "contacts", Icon: Phone },
];

export default function AppHeader() {
  const { t, theme, setTheme, lang, setLang, activeTab, setActiveTab } =
    useApp();
  const tabRowRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef(true);
  const isDark = theme === "dark";
  const onAccount = activeTab === "account";

  // Position the liquid-glass indicator under the active tab. On tab changes it
  // springs into place (anime.js); on first paint / resize it snaps instantly.
  const place = useCallback(
    (withSpring: boolean) => {
      const row = tabRowRef.current;
      const indicator = indRef.current;
      if (!row || !indicator) return;

      const idx = TABS.findIndex((tb) => tb.key === activeTab);
      const el = idx >= 0 ? tabRefs.current[idx] : null;
      if (!el) {
        // Profile/account active — no center tab, fade the indicator out.
        indicator.style.opacity = "0";
        return;
      }

      const rRect = row.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      const left = eRect.left - rRect.left + 3;
      const width = eRect.width - 6;

      if (withSpring && !firstRef.current) {
        animate(indicator, {
          left,
          width,
          opacity: 1,
          ease: spring({ bounce: 0.4, duration: 620 }),
        });
      } else {
        indicator.style.left = `${left}px`;
        indicator.style.width = `${width}px`;
        indicator.style.opacity = "1";
      }
      firstRef.current = false;
    },
    [activeTab],
  );

  useEffect(() => {
    place(true);
  }, [place]);

  useEffect(() => {
    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [place]);

  const glass: React.CSSProperties = {
    background: isDark ? "rgba(11,15,24,0.88)" : "rgba(255,255,255,0.84)",
    backdropFilter: "blur(20px) saturate(200%)",
    WebkitBackdropFilter: "blur(20px) saturate(200%)",
    borderBottom: isDark
      ? "1px solid rgba(255,255,255,0.05)"
      : "1px solid rgba(0,0,0,0.07)",
    boxShadow: isDark
      ? "0 2px 16px rgba(0,0,0,0.35)"
      : "0 2px 16px rgba(0,0,0,0.06)",
  };

  const pillActive: React.CSSProperties = {
    background: isDark ? "rgba(13,94,175,0.28)" : "rgba(13,94,175,0.10)",
    border: isDark
      ? "1px solid rgba(13,94,175,0.45)"
      : "1px solid rgba(13,94,175,0.20)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    boxShadow: isDark
      ? "0 2px 8px rgba(13,94,175,0.3)"
      : "0 2px 8px rgba(13,94,175,0.12)",
  };

  return (
    <header
      className="flex items-center h-12 px-1.5 flex-shrink-0 z-20"
      style={glass}
    >
      {/* ── LEFT: Logo + title. Stacks (name under logo) on small screens so the
          tab row fits on one line; side-by-side from sm up. ── */}
      <button
        onClick={() => {
          if (!onAccount) setActiveTab("account");
        }}
        disabled={onAccount}
        aria-label={t("tab_account")}
        className={`
          relative flex-shrink-0 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 h-full z-10
          transition-colors duration-150
          ${onAccount ? "text-primary dark:text-primary-300 cursor-default" : "text-gray-700 dark:text-gray-300 active:scale-90"}
        `}
      >
        {/* Logo image */}
        <div className="relative z-10 w-7 h-7 sm:w-[35px] sm:h-[35px] rounded-[5px] overflow-hidden flex-shrink-0">
          <Image
            src="/PegasusFlag.png"
            alt={t("appName")}
            width={35}
            height={35}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        {/* Label — translates to "Lefkada" in English */}
        <span className="relative z-10 text-[9px] sm:text-[13px] font-bold whitespace-nowrap leading-none">
          {t("appName")}
        </span>
      </button>

      {/* ── CENTER: 6 tab icons — truly centered ── */}
      <div
        className="flex-1 flex justify-center overflow-x-auto items-center h-full"
        style={{ scrollbarWidth: "none" }}
      >
        <div ref={tabRowRef} className="relative flex items-center">
          {/* Liquid-glass sliding indicator (anime.js spring) */}
          <div
            ref={indRef}
            aria-hidden="true"
            className="absolute pointer-events-none rounded-xl"
            style={{ top: 4, bottom: 4, left: 0, width: 0, opacity: 0, ...pillActive }}
          />
          {TABS.map(({ key, Icon }, idx) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(key)}
                className={`
                  relative z-10 flex items-center justify-center w-10 h-10 flex-shrink-0
                  transition-colors duration-150 active:scale-90
                  ${active ? "text-primary dark:text-primary-300" : "text-gray-400 dark:text-gray-600"}
                `}
              >
                <Icon size={18} strokeWidth={active ? 2.3 : 1.7} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: language + theme ── */}
      <div className="flex-shrink-0 flex items-center gap-1 pl-1">
        <button
          onClick={() => setLang(lang === "el" ? "en" : "el")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors active:scale-95"
        >
          <Languages size={12} />
          {t("toggle_lang")}
        </button>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
