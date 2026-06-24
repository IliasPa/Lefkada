"use client";

import { alertsData, ALERT_META } from "@/data/alerts";

export function hasActiveAlerts() {
  return alertsData.length > 0;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || typeof Notification === "undefined")
    return "denied";
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
  if (alertsData.length === 0) return;

  const types = Array.from(new Set(alertsData.map((a) => a.type)));
  const emojis = types.map((ty) => ALERT_META[ty].emoji).join(" ");
  const title =
    lang === "el" ? "Ειδοποιήσεις Κινδύνου — Λευκάδα" : "Risk alerts — Lefkada";
  const body =
    lang === "el"
      ? `${alertsData.length} ενεργές ειδοποιήσεις ${emojis}`
      : `${alertsData.length} active alerts ${emojis}`;

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
