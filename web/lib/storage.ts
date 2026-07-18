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
  /** The vetoWeek() string of the week this device vetoed — active only while
   *  it equals the current week (auto-reset every Monday 03:00 Athens). */
  veto: 'veto',
  /** Mayor-side: last 10%-step of the veto ratio already notified, per week. */
  vetoStepSeen: 'veto_step_seen',
  healthBookmarks: 'health_bookmarks',
  cvFilename: 'cv_filename',
  mayorMessage: 'mayor_message',
  mayorAnonymous: 'mayor_anonymous',
  gameState: 'game_state',
  streak: 'game_streak',
  lastGameDate: 'game_last_date',
  recentSearch: 'recent_search',
  /** Last-open /admin tab — restored after a refresh. */
  adminView: 'admin_view',
  /** Official-residency stamp last sent with this account's vote, per poll —
   *  lets the app silently re-stamp when the mayor's designation changes. */
  voteStamps: 'my_vote_stamps',
  /** Last-seen municipal-roll designation ('true'/'false') — a change shows
   *  the "the municipality updated your status" notice exactly once. */
  citizenStatus: 'citizen_status_seen',
} as const;
