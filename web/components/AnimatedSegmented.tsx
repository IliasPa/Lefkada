"use client";

import { useRef, useEffect, useCallback } from "react";
import { animate, spring } from "animejs";
import { useAppOptional } from "@/context/AppContext";

export interface SegOption {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

type Variant = "default" | "onPrimary";

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
  const rowRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef(true);

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
      const left = el.offsetLeft;
      const width = el.offsetWidth;
      if (withSpring && !firstRef.current && !a11y.reduceMotion) {
        animate(ind, {
          left,
          width,
          opacity: 1,
          ease: spring({ bounce: 0.4, duration: 520 }),
        });
      } else {
        ind.style.left = `${left}px`;
        ind.style.width = `${width}px`;
        ind.style.opacity = "1";
      }
      firstRef.current = false;
    },
    [value, options, a11y.reduceMotion, a11y.largeText],
  );

  useEffect(() => {
    place(true);
  }, [place]);
  useEffect(() => {
    const on = () => place(false);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [place]);

  const container =
    variant === "onPrimary"
      ? "bg-white/10"
      : "bg-gray-100 dark:bg-[#0F1219] border border-gray-200 dark:border-[#252A3A]";
  const indColor = variant === "onPrimary" ? "bg-white/40" : "bg-primary shadow-sm";
  const pad = size === "sm" ? "px-2.5 py-1" : "px-3.5 py-1.5";
  const text = size === "sm" ? "text-[11px]" : "text-[12px]";

  return (
    <div
      ref={rowRef}
      className={`relative ${fullWidth ? "flex w-full" : "inline-flex"} p-0.5 rounded-xl ${container} ${className}`}
    >
      <div
        ref={indRef}
        aria-hidden="true"
        className={`absolute top-0.5 bottom-0.5 rounded-lg ${indColor}`}
        style={{ left: 0, width: 0, opacity: 0 }}
      />
      {options.map((o, i) => {
        const active = o.key === value;
        const activeText = variant === "onPrimary" ? "text-white" : "text-white";
        const idleText =
          variant === "onPrimary"
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
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg font-bold transition-colors active:scale-95 ${pad} ${text} ${fullWidth ? "flex-1 min-w-0" : ""} ${active ? activeText : idleText}`}
          >
            {o.icon}
            {o.label && <span className="truncate">{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
