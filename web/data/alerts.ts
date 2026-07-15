import type { BilingualText } from './news';
import raw from './alerts.json';

export type AlertType = 'water' | 'electricity' | 'fire' | 'weather' | 'road';

export interface CityAlert {
  id: string;
  type: AlertType;
  /** Where the alert applies. */
  area: BilingualText;
  /** When it applies (date/time window). */
  time: BilingualText;
  /** Details of the alert. */
  message: BilingualText;
}

export const ALERT_META: Record<
  AlertType,
  { emoji: string; tKey: string; color: string }
> = {
  water: { emoji: '💧', tKey: 'alert_water', color: '#0EA5E9' },
  electricity: { emoji: '⚡', tKey: 'alert_electricity', color: '#F59E0B' },
  fire: { emoji: '🔥', tKey: 'alert_fire', color: '#DC2626' },
  weather: { emoji: '🌧️', tKey: 'alert_weather', color: '#6366F1' },
  road: { emoji: '🚧', tKey: 'alert_road', color: '#E4802C' },
};

export const ALERT_ORDER: AlertType[] = [
  'water',
  'electricity',
  'fire',
  'weather',
  'road',
];

// alerts.json = { bundled: [...], baked: [content rows, kind=alert] }.
// Deliberately NOT merged: risk alerts are time-critical and live-REPLACE
// semantics apply (with the backend configured, /admin is the source of truth
// so clearing an alert clears the app; a stale baked alert must never keep
// showing). The baked rows exist purely as the git archive.
export const alertsData: CityAlert[] = raw.bundled as unknown as CityAlert[];
