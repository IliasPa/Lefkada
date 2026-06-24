import type { BilingualText } from './news';

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

// Active alerts. Types with no entries simply don't show a button.
export const alertsData: CityAlert[] = [
  {
    id: 'a1',
    type: 'water',
    area: { el: 'Νυδρί & Περιγιάλι', en: 'Nidri & Perigiali' },
    time: { el: 'Σήμερα 09:00–14:00', en: 'Today 09:00–14:00' },
    message: {
      el: 'Διακοπή υδροδότησης λόγω επισκευής αγωγού. Συνιστάται αποθήκευση νερού.',
      en: 'Water supply interruption for pipe repair. Storing water is advised.',
    },
  },
  {
    id: 'a2',
    type: 'electricity',
    area: { el: 'Καρυά & Σφακιώτες', en: 'Karya & Sfakiotes' },
    time: { el: 'Αύριο 08:00–11:00', en: 'Tomorrow 08:00–11:00' },
    message: {
      el: 'Προγραμματισμένη διακοπή ρεύματος ΔΕΔΔΗΕ για συντήρηση δικτύου.',
      en: 'Scheduled power outage (DEDDIE) for network maintenance.',
    },
  },
  {
    id: 'a3',
    type: 'fire',
    area: { el: 'Όλο το νησί', en: 'Island-wide' },
    time: { el: 'Σήμερα, κατηγορία κινδύνου 4 (πολύ υψηλή)', en: 'Today, risk category 4 (very high)' },
    message: {
      el: 'Πολύ υψηλός κίνδυνος πυρκαγιάς. Απαγορεύεται η καύση και η χρήση φωτιάς σε υπαίθριους χώρους.',
      en: 'Very high fire risk. Burning and outdoor fires are prohibited.',
    },
  },
  {
    id: 'a4',
    type: 'road',
    area: { el: 'Επαρχιακή οδός προς Αθάνι', en: 'Road to Athani' },
    time: { el: 'Έως Παρασκευή', en: 'Until Friday' },
    message: {
      el: 'Διακοπή κυκλοφορίας λόγω καθαρισμού κατολίσθησης. Χρησιμοποιήστε εναλλακτική διαδρομή.',
      en: 'Road closed for landslide clearing. Please use an alternative route.',
    },
  },
];
