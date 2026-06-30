'use client';

const NS = 'lefkada_';

export function storageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently fail
  }
}

export function storageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(NS + key);
}

// Typed key helpers
export const KEYS = {
  theme: 'theme',
  lang: 'lang',
  a11y: 'a11y',
  hiddenTabs: 'hidden_tabs',
  notifications: 'notifications',
  profile: 'me_profile',
  votes: 'votes',
  myVotes: 'my_votes',
  veto: 'veto',
  healthBookmarks: 'health_bookmarks',
  cvFilename: 'cv_filename',
  mayorMessage: 'mayor_message',
  mayorAnonymous: 'mayor_anonymous',
  gameState: 'game_state',
  streak: 'game_streak',
  lastGameDate: 'game_last_date',
  recentSearch: 'recent_search',
} as const;
