'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { KEYS, storageGet, storageSet } from '@/lib/storage';
import { translations, type Lang } from '@/lib/i18n';

export type TabKey = 'home' | 'culture' | 'vote' | 'health' | 'financials' | 'governance' | 'about' | 'services' | 'jobs' | 'game' | 'contacts' | 'account';
export type ThemeMode = 'light' | 'dark';

export interface A11ySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
}
const DEFAULT_A11Y: A11ySettings = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
};

/** Center tabs the user can show/hide (Profile/account is always reachable via the logo). */
export const HIDEABLE_TABS: TabKey[] = [
  'home', 'culture', 'vote', 'health', 'financials', 'governance', 'about', 'services', 'jobs', 'game', 'contacts',
];

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  a11y: A11ySettings;
  setA11y: (patch: Partial<A11ySettings>) => void;
  hiddenTabs: TabKey[];
  toggleHiddenTab: (tab: TabKey) => void;
  notifications: boolean;
  setNotifications: (on: boolean) => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('el');
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [activeTab, setActiveTabState] = useState<TabKey>('home');
  const [a11y, setA11yState] = useState<A11ySettings>(DEFAULT_A11Y);
  const [hiddenTabs, setHiddenTabsState] = useState<TabKey[]>([]);
  const [notifications, setNotificationsState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = storageGet<Lang>(KEYS.lang, 'el');
    const savedTheme = storageGet<ThemeMode>(KEYS.theme, 'light');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedTheme = savedTheme ?? (prefersDark ? 'dark' : 'light');

    setLangState(savedLang);
    setThemeState(resolvedTheme);

    // Default Reduce Motion to the OS preference when the user has no saved choice.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setA11yState({
      ...DEFAULT_A11Y,
      reduceMotion: prefersReduced,
      ...storageGet<Partial<A11ySettings>>(KEYS.a11y, {}),
    });
    setHiddenTabsState(storageGet<TabKey[]>(KEYS.hiddenTabs, []));
    setNotificationsState(storageGet<boolean>(KEYS.notifications, false));

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as TabKey | null;
    if (tabParam && ['home', 'culture', 'vote', 'health', 'financials', 'governance', 'about', 'services', 'jobs', 'game', 'contacts', 'account'].includes(tabParam)) {
      setActiveTabState(tabParam);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme, mounted]);

  // Apply accessibility preferences to the document root.
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', a11y.reduceMotion);
    root.classList.toggle('hc', a11y.highContrast);
    root.classList.toggle('a11y-large', a11y.largeText);
  }, [a11y, mounted]);

  const setA11y = useCallback((patch: Partial<A11ySettings>) => {
    setA11yState((prev) => {
      const next = { ...prev, ...patch };
      storageSet(KEYS.a11y, next);
      return next;
    });
  }, []);

  const toggleHiddenTab = useCallback((tab: TabKey) => {
    setHiddenTabsState((prev) => {
      const next = prev.includes(tab)
        ? prev.filter((x) => x !== tab)
        : [...prev, tab];
      storageSet(KEYS.hiddenTabs, next);
      return next;
    });
  }, []);

  const setNotifications = useCallback((on: boolean) => {
    setNotificationsState(on);
    storageSet(KEYS.notifications, on);
  }, []);

  // If the current tab gets hidden, fall back to the first visible one.
  useEffect(() => {
    if (!mounted) return;
    if (activeTab !== 'account' && hiddenTabs.includes(activeTab)) {
      const fallback =
        (HIDEABLE_TABS).find((tk) => !hiddenTabs.includes(tk)) ?? 'account';
      setActiveTabState(fallback);
    }
  }, [hiddenTabs, activeTab, mounted]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    storageSet(KEYS.lang, l);
    document.documentElement.lang = l;
  }, []);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    storageSet(KEYS.theme, t);
  }, []);

  const setActiveTab = useCallback((tab: TabKey) => setActiveTabState(tab), []);

  const t = useCallback(
    (key: string): string =>
      (translations[lang] as Record<string, string>)[key] ?? key,
    [lang]
  );

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-[#0F1219] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-300 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{ lang, setLang, theme, setTheme, activeTab, setActiveTab, a11y, setA11y, hiddenTabs, toggleHiddenTab, notifications, setNotifications, t }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
