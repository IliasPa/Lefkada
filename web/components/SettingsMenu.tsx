"use client";

import { useEffect, useRef, useState } from "react";
import {
  Settings,
  Moon,
  Sun,
  Languages,
  Accessibility,
  CircleSlash2,
  Contrast,
  Type,
  Check,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function SettingsMenu() {
  const { t, lang, setLang, theme, setTheme, a11y, setA11y } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("settings_menu")}
        aria-haspopup="true"
        aria-expanded={open}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95"
      >
        <Settings size={17} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 w-64 p-3 rounded-2xl bg-white dark:bg-[#141929] border border-gray-200 dark:border-[#252A3A] shadow-2xl space-y-3"
        >
          {/* Language */}
          <Section icon={<Languages size={13} />} label={t("settings_language")}>
            <Segmented
              options={[
                { key: "el", label: "Ελληνικά" },
                { key: "en", label: "English" },
              ]}
              value={lang}
              onChange={(v) => setLang(v as "el" | "en")}
            />
          </Section>

          {/* Theme */}
          <Section
            icon={isDark ? <Moon size={13} /> : <Sun size={13} />}
            label={t("settings_theme")}
          >
            <Segmented
              options={[
                { key: "light", label: t("toggle_light") },
                { key: "dark", label: t("toggle_dark") },
              ]}
              value={theme}
              onChange={(v) => setTheme(v as "light" | "dark")}
            />
          </Section>

          {/* Accessibility */}
          <Section icon={<Accessibility size={13} />} label={t("settings_a11y")}>
            <div className="space-y-1">
              <SwitchRow
                icon={<CircleSlash2 size={14} />}
                label={t("a11y_reduce_motion")}
                checked={a11y.reduceMotion}
                onChange={(v) => setA11y({ reduceMotion: v })}
              />
              <SwitchRow
                icon={<Contrast size={14} />}
                label={t("a11y_high_contrast")}
                checked={a11y.highContrast}
                onChange={(v) => setA11y({ highContrast: v })}
              />
              <SwitchRow
                icon={<Type size={14} />}
                label={t("a11y_large_text")}
                checked={a11y.largeText}
                onChange={(v) => setA11y({ largeText: v })}
              />
            </div>
          </Section>

          {/* WCAG note */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-[#1E2D4E] text-[11px] font-semibold text-green-600 dark:text-green-400">
            <Check size={13} className="flex-shrink-0" />
            {t("a11y_wcag")}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex p-0.5 rounded-xl bg-gray-100 dark:bg-[#0F1219]">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[12px] font-bold transition-colors active:scale-95 ${active ? "bg-primary text-white shadow-sm" : "text-gray-600 dark:text-gray-400"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SwitchRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-2 py-1.5 active:scale-[0.98] transition-transform"
    >
      <span className="flex items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-gray-300">
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        {label}
      </span>
      <span
        className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${checked ? "bg-primary" : "bg-gray-300 dark:bg-[#3A4155]"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </span>
    </button>
  );
}
