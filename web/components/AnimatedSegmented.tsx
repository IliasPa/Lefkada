"use client";

import { useRef, useEffect, useCallback } from "react";
import { slideGlass, snapGlass } from "@/lib/glass";
import { useAppOptional } from "@/context/AppContext";

export interface SegOption {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

/** "nav" is the header-tab look: icon with the title underneath, no container
 *  background, translucent liquid-glass pill — used by the /admin navigation so
 *  the private areas read exactly like the public app's tab bar. */
type Variant = "default" | "onPrimary" | "nav";

/** A segmented toggle with the same liquid-glass spring indicator as the header
 *  tabs. Used for every subtab / toggle across the app. */
export default function AnimatedSegmented({
  options,
  value,
  onChange,
  variant = "default",
  fullWidth = false,
  size = "md",
  className = "",
}: {
  options: SegOption[];
  value: string;
  onChange: (key: string) => void;
  variant?: Variant;
  fullWidth?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  // Optional so the component also works on the standalone /admin pages
  // (no AppProvider there — reduce-motion falls back to the OS preference).
  const app = useAppOptional();
  const a11y = app?.a11y ?? {
    reduceMotion:
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    highContrast: false,
    largeText: false,
  };
  const isNav = variant === "nav";
  const rowRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef(true);
  const lastLeftRef = useRef(0);

  const place = useCallback(
    (withSpring: boolean) => {
      const row = rowRef.current;
      const ind = indRef.current;
      if (!row || !ind) return;
      const idx = options.findIndex((o) => o.key === value);
      const el = idx >= 0 ? btnRefs.current[idx] : null;
      if (!el) {
        ind.style.opacity = "0";
        return;
      }
      // Measure in layout space (offsetLeft/offsetWidth) rather than screen
      // space (getBoundingClientRect). The indicator and the buttons share the
      // same positioned ancestor (this row), so layout coordinates align even
      // when the content is CSS-zoomed by the "Larger text" setting.
      // The nav variant insets the pill like the header tabs do.
      const left = el.offsetLeft + (isNav ? 3 : 0);
      const width = el.offsetWidth - (isNav ? 6 : 0);
      if (withSpring && !firstRef.current && !a11y.reduceMotion) {
        slideGlass(ind, { left, width, distance: left - lastLeftRef.current });
      } else {
        snapGlass(ind, { left, width });
      }
      lastLeftRef.current = left;
      firstRef.current = false;
    },
    [value, options, isNav, a11y.reduceMotion, a11y.largeText],
  );

  useEffect(() => {
    place(true);
  }, [place]);
  useEffect(() => {
    const on = () => place(false);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [place]);

  // "Larger text" CSS-zooms the content, but the class lands in the provider's
  // effect — which runs after this child's. Re-measure once the zoomed layout
  // has been painted, so the indicator springs onto the resized option.
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

  const container = isNav
    ? "" // header-tab look: the pill floats over the bar's own background
    : variant === "onPrimary"
      ? "bg-white/10"
      : "bg-gray-100 dark:bg-[#0F1219] border border-gray-200 dark:border-[#252A3A]";
  const indColor = isNav
    ? "bg-primary/10 dark:bg-primary-900/40 border border-primary/20 dark:border-primary/45 shadow-sm shadow-primary/10 backdrop-blur-[6px]"
    : variant === "onPrimary"
      ? "bg-white/40"
      : "bg-primary shadow-sm";
  const pad = isNav ? "px-2 py-1" : size === "sm" ? "px-2.5 py-1" : "px-3.5 py-1.5";
  const text = isNav ? "text-[9px]" : size === "sm" ? "text-[11px]" : "text-[12px]";

  return (
    <div
      ref={rowRef}
      className={`relative ${fullWidth ? "flex w-full" : "inline-flex"} ${isNav ? "" : "p-0.5"} rounded-xl ${container} ${className}`}
    >
      <div
        ref={indRef}
        aria-hidden="true"
        className={`absolute ${isNav ? "top-0 bottom-0 rounded-xl" : "top-0.5 bottom-0.5 rounded-lg"} ${indColor}`}
        style={{ left: 0, width: 0, opacity: 0 }}
      />
      {options.map((o, i) => {
        const active = o.key === value;
        const activeText = isNav ? "text-primary dark:text-primary-300" : "text-white";
        const idleText = isNav
          ? "text-gray-400 dark:text-gray-600"
          : variant === "onPrimary"
            ? "text-blue-100"
            : "text-gray-600 dark:text-gray-400";
        return (
          <button
            key={o.key}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            onClick={() => onChange(o.key)}
            aria-pressed={active}
            aria-label={o.ariaLabel ?? o.label}
            title={isNav ? (o.ariaLabel ?? o.label) : undefined}
            className={`relative z-10 flex items-center justify-center rounded-lg font-bold transition-colors active:scale-95 ${
              isNav ? "flex-col gap-0.5 flex-shrink-0" : "gap-1.5"
            } ${pad} ${text} ${fullWidth ? "flex-1 min-w-0" : ""} ${active ? activeText : idleText}`}
          >
            {o.icon}
            {o.label && (
              <span className={isNav ? "leading-none whitespace-nowrap" : "truncate"}>
                {o.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
