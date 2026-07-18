"use client";

import { alertsData, ALERT_META, type CityAlert } from "@/data/alerts";
import { backendConfigured } from "@/lib/supabase";
import { fetchLiveAlerts } from "@/lib/backend";
import { KEYS, storageGet, storageSet } from "@/lib/storage";

export function hasActiveAlerts() {
  return alertsData.length > 0;
}

/** Current alerts: /admin-managed when the backend is configured, else bundled. */
async function currentAlerts(): Promise<CityAlert[]> {
  if (!backendConfigured) return alertsData;
  return (await fetchLiveAlerts()) ?? [];
}

export type NotifyPermission = NotificationPermission | "unsupported";

/** "unsupported" ⇒ the Notification API doesn't exist here — on iPhone/iPad
 *  that means the app must be installed to the Home Screen first. */
export async function requestNotificationPermission(): Promise<NotifyPermission> {
  if (typeof window === "undefined" || typeof Notification === "undefined")
    return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** Show a single coalesced notification summarising the active city risk alerts.
 *  Uses the service worker (so clicks route through it) and falls back to a plain
 *  Notification. Clicking it opens the app/website. */
export async function showAlertNotification(lang: "el" | "en"): Promise<void> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  const alerts = await currentAlerts();
  if (alerts.length === 0) return;

  const types = Array.from(new Set(alerts.map((a) => a.type)));
  const emojis = types.map((ty) => ALERT_META[ty].emoji).join(" ");
  const title =
    lang === "el" ? "Ειδοποιήσεις Κινδύνου — Λευκάδα" : "Risk alerts — Lefkada";
  const body =
    lang === "el"
      ? `${alerts.length} ενεργές ειδοποιήσεις ${emojis}`
      : `${alerts.length} active alerts ${emojis}`;

  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: "/PegasusFlag.png",
    badge: "/PegasusFlag.png",
    tag: "lefkada-alerts",
    renotify: true,
    data: { url: "/" },
  };

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* fall through */
  }
  try {
    new Notification(title, options);
  } catch {
    /* ignore */
  }
}

/** Mayor-side: notify once per 10%-step the weekly veto ratio climbs through
 *  (10%, 20%, …). Fired when /admin loads its data — the step memory lives in
 *  the mayor's own localStorage, keyed by week so every Monday starts clean.
 *  Greek only (the admin is Greek). */
export async function maybeNotifyVetoStep(week: string, pct: number, active: number, total: number): Promise<void> {
  if (total <= 0) return;
  const step = Math.floor(pct / 10);
  const seen = storageGet<{ week: string; step: number }>(KEYS.vetoStepSeen, { week: "", step: 0 });
  if (seen.week === week && seen.step >= step) return;
  storageSet(KEYS.vetoStepSeen, { week, step });
  if (step <= 0) return;
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  const title = "Βέτο πολιτών — Δήμος Λευκάδας";
  const body = `Το βέτο ξεπέρασε το ${step * 10}%: ${active}/${total} δημότες (${pct}%).`;
  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: "/PegasusFlag.png",
    badge: "/PegasusFlag.png",
    tag: "lefkada-veto-step",
    renotify: true,
    data: { url: "/admin?view=referendums" },
  };
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* fall through */
  }
  try {
    new Notification(title, options);
  } catch {
    /* ignore */
  }
}

/** One-shot notice when the municipality (mayor) changes this citizen's
 *  municipal-roll designation — fired by the profile screen when it detects
 *  the change; same SW-first delivery as the alerts notification. */
export async function showCitizenStatusNotification(lang: "el" | "en", resident: boolean): Promise<void> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  const title = lang === "el" ? "Δήμος Λευκάδας — Δημοτολόγιο" : "Municipality of Lefkada — Municipal roll";
  const body = resident
    ? lang === "el"
      ? "Καταχωρηθήκατε ως δημότης/-ισσα Λευκάδας — η ψήφος σας μετρά στη βασική στατιστική."
      : "You were registered as a citizen of Lefkada — your vote counts in the main statistic."
    : lang === "el"
      ? "Η ιδιότητα δημότη ενημερώθηκε από τον δήμο."
      : "Your municipal-roll status was updated by the municipality.";

  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: "/PegasusFlag.png",
    badge: "/PegasusFlag.png",
    tag: "lefkada-citizen-status",
    renotify: true,
    data: { url: "/" },
  };

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* fall through */
  }
  try {
    new Notification(title, options);
  } catch {
    /* ignore */
  }
}
