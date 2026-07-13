"use client";

import { alertsData, ALERT_META, type CityAlert } from "@/data/alerts";
import { backendConfigured } from "@/lib/supabase";
import { fetchLiveAlerts } from "@/lib/backend";

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
