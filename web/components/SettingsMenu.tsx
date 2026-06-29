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
  Bell,
  LayoutGrid,
  ExternalLink,
  Newspaper,
  Amphora,
  Heart,
  BarChart3,
  Landmark,
  Mountain,
  HeartHandshake,
  GraduationCap,
  Briefcase,
  Phone,
  User,
  ChevronDown,
} from "lucide-react";
import { useApp, HIDEABLE_TABS } from "@/context/AppContext";
import type { TabKey } from "@/context/AppContext";
import { requestNotificationPermission, showAlertNotification } from "@/lib/notify";
import AnimatedSegmented from "@/components/AnimatedSegmented";
import ProfileForm from "@/components/ProfileForm";

/** Mirrors the header tab icons so the show/hide buttons read at a glance. */
const TAB_ICON: Partial<Record<TabKey, React.ReactNode>> = {
  home: <Newspaper size={13} />,
  culture: <Amphora size={13} />,
  health: <Heart size={13} />,
  financials: <BarChart3 size={13} />,
  governance: <Landmark size={13} />,
  about: <Mountain size={13} />,
  services: <HeartHandshake size={13} />,
  education: <GraduationCap size={13} />,
  jobs: <Briefcase size={13} />,
  contacts: <Phone size={13} />,
};

export default function SettingsMenu() {
  const {
    t, lang, setLang, theme, setTheme, a11y, setA11y,
    hiddenTabs, toggleHiddenTab, notifications, setNotifications,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  const handleNotifications = async (on: boolean) => {
    if (!on) {
      setNotifications(false);
      return;
    }
    const perm = await requestNotificationPermission();
    if (perm === "granted") {
      setNotifications(true);
      showAlertNotification(lang); // fire immediately if risks are active
    } else {
      setNotifications(false);
    }
  };

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
          style={{ scrollbarWidth: "none" }}
          className="absolute right-0 top-10 z-50 w-72 p-3 rounded-2xl bg-white dark:bg-[#141929] border border-gray-200 dark:border-[#252A3A] shadow-2xl space-y-3 max-h-[calc(100vh-3.5rem-var(--sat))] overflow-y-auto"
        >
          {/* Profile (moved here from the Account page) */}
          <div>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-expanded={profileOpen}
              className="w-full flex items-center gap-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
            >
              <User size={13} />
              <span className="flex-1 text-left">{t("settings_profile")}</span>
              <ChevronDown size={14} className={`transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            {profileOpen && (
              <div className="pt-2">
                <ProfileForm />
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100 dark:bg-[#1E2D4E]" />

          {/* Language */}
          <Section icon={<Languages size={13} />} label={t("settings_language")}>
            <AnimatedSegmented
              fullWidth
              size="sm"
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
            <AnimatedSegmented
              fullWidth
              size="sm"
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

          {/* Notifications */}
          <Section icon={<Bell size={13} />} label={t("settings_notifications")}>
            <SwitchRow
              icon={<Bell size={14} />}
              label={t("settings_notify_alerts")}
              checked={notifications}
              onChange={handleNotifications}
            />
          </Section>

          {/* Show / hide tabs — each name is a button that greys out when hidden */}
          <Section icon={<LayoutGrid size={13} />} label={t("settings_tabs")}>
            <div className="flex flex-wrap gap-1.5">
              {HIDEABLE_TABS.map((key) => {
                const visible = !hiddenTabs.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleHiddenTab(key)}
                    aria-pressed={visible}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all active:scale-95 ${
                      visible
                        ? "bg-primary/10 dark:bg-primary-900/30 text-primary dark:text-primary-300 border-primary/30"
                        : "bg-gray-100 dark:bg-[#252A3A] text-gray-400 dark:text-gray-500 border-transparent"
                    }`}
                  >
                    <span className="flex-shrink-0">{TAB_ICON[key]}</span>
                    {t(`tab_${key}`)}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* WCAG note — links to Lighthouse */}
          <a
            href="https://achecks.org/achecker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-[#1E2D4E] text-[11px] font-semibold text-green-600 dark:text-green-400 hover:underline"
          >
            <Check size={13} className="flex-shrink-0" />
            {t("a11y_wcag")}
            <ExternalLink size={11} className="flex-shrink-0" />
          </a>
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

function SwitchRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon?: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-2 py-1.5 active:scale-[0.98] transition-transform"
    >
      <span className="flex items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-gray-300">
        {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
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
