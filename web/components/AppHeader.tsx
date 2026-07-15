"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { slideGlass, snapGlass } from "@/lib/glass";
import {
  Newspaper,
  Amphora,
  Landmark,
  Heart,
  BarChart3,
  Briefcase,
  Phone,
  Mountain,
  HeartHandshake,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { useApp, type TabKey } from "@/context/AppContext";
import SettingsMenu from "@/components/SettingsMenu";

interface TabDef {
  key: TabKey;
  Icon: LucideIcon;
}

const TABS: TabDef[] = [
  { key: "home", Icon: Newspaper },
  { key: "culture", Icon: Amphora },
  { key: "health", Icon: Heart },
  { key: "financials", Icon: BarChart3 },
  { key: "governance", Icon: Landmark },
  { key: "about", Icon: Mountain },
  { key: "services", Icon: HeartHandshake },
  { key: "education", Icon: GraduationCap },
  { key: "jobs", Icon: Briefcase },
  { key: "contacts", Icon: Phone },
];

export default function AppHeader() {
  const { t, theme, activeTab, setActiveTab, a11y, hiddenTabs } = useApp();
  const visibleTabs = TABS.filter((tab) => !hiddenTabs.includes(tab.key));
  const headerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef(true);
  const lastLeftRef = useRef(0);
  const isDark = theme === "dark";
  const onAccount = activeTab === "account";

  // Position the liquid-glass indicator under the active tab. On tab changes it
  // springs into place (anime.js); on first paint / resize it snaps instantly.
  const place = useCallback(
    (withSpring: boolean) => {
      const header = headerRef.current;
      const indicator = indRef.current;
      if (!header || !indicator) return;

      const idx = visibleTabs.findIndex((tb) => tb.key === activeTab);
      const el = idx >= 0 ? tabRefs.current[idx] : null;
      if (!el) {
        // Profile/account active — no center tab, fade the indicator out.
        indicator.style.opacity = "0";
        return;
      }

      // Measure in layout space (offsetLeft) relative to the shared positioned
      // ancestor (the header), minus the tab row's horizontal scroll. This stays
      // correct when the "Larger text" setting CSS-zooms the header, and lets the
      // spring's overshoot breathe past the scrolling row instead of being clipped.
      const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
      const left = el.offsetLeft - scrollLeft + 3;
      const width = el.offsetWidth - 6;

      if (withSpring && !firstRef.current && !a11y.reduceMotion) {
        slideGlass(indicator, { left, width, distance: left - lastLeftRef.current });
      } else {
        snapGlass(indicator, { left, width });
      }
      lastLeftRef.current = left;
      firstRef.current = false;
    },
    [activeTab, a11y.reduceMotion, a11y.largeText, hiddenTabs],
  );

  useEffect(() => {
    place(true);
  }, [place]);

  // "Larger text" reveals the tab labels AND CSS-zooms the header — but the
  // .a11y-large class is set by the provider's effect, which runs AFTER this
  // child's. Measuring now would read the pre-toggle layout, so re-place once
  // the new layout has actually been painted; the indicator springs to the
  // resized tab instead of being left behind.
  useEffect(() => {
    if (firstRef.current) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => place(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a11y.largeText]);

  useEffect(() => {
    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [place]);

  // Keep the indicator aligned while the tab row scrolls horizontally.
  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const onScroll = () => place(false);
    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => sc.removeEventListener("scroll", onScroll);
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
      ref={headerRef}
      className="relative flex items-center h-12 px-1.5 flex-shrink-0 z-20"
      style={glass}
    >
      {/* Liquid-glass sliding indicator — lives at header level (outside the
          scrolling tab row) so its spring overshoot can breathe unclipped. */}
      <div
        ref={indRef}
        aria-hidden="true"
        className="absolute pointer-events-none rounded-xl"
        style={{ top: 8, bottom: 8, left: 0, width: 0, opacity: 0, ...pillActive }}
      />
      {/* ── LEFT: Logo + title. Stacks (name under logo) on small screens so the
          tab row fits on one line; side-by-side from sm up. ── */}
      <button
        onClick={() => {
          if (!onAccount) setActiveTab("account");
        }}
        disabled={onAccount}
        aria-label={t("tab_account")}
        className={`
          relative flex-shrink-0 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-2 h-full z-10
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

      {/* ── CENTER: tab icons — centered, horizontally scrollable ── */}
      <div
        ref={scrollRef}
        className="flex-1 flex justify-center overflow-x-auto items-center h-full"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex items-center">
          {visibleTabs.map(({ key, Icon }, idx) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                role="tab"
                aria-selected={active}
                aria-label={t(`tab_${key}`)}
                title={t(`tab_${key}`)}
                onClick={() => setActiveTab(key)}
                className={`
                  relative z-10 flex flex-col items-center justify-center flex-shrink-0
                  transition-colors duration-150 active:scale-90
                  ${a11y.largeText ? "gap-0.5 px-2 min-w-[2.75rem] h-10" : "w-10 h-10"}
                  ${active ? "text-primary dark:text-primary-300" : "text-gray-400 dark:text-gray-600"}
                `}
              >
                <Icon size={18} strokeWidth={active ? 2.3 : 1.7} />
                {a11y.largeText && (
                  <span className="text-[9px] font-semibold leading-none whitespace-nowrap">
                    {t(`tab_${key}`)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: settings (language + theme + accessibility) ── */}
      <div className="flex-shrink-0 flex items-center pl-1">
        <SettingsMenu />
      </div>
    </header>
  );
}
