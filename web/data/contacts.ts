import type { BilingualText } from './news';

export type ContactCategory =
  | 'Administration'
  | 'Services'
  | 'Emergency'
  | 'Utilities'
  | 'Tourism'
  | 'Health';

export interface Contact {
  id: string;
  name: BilingualText;
  phone?: string;
  /** Additional phone numbers (rendered as extra call buttons). */
  phones?: string[];
  email?: string;
  /** Opening hours. When omitted, the contact keeps the STANDARD office hours
   *  (marked with a ★ in the UI to avoid repeating the same line everywhere). */
  hours?: BilingualText;
  category: ContactCategory;
}

/** The default municipal office hours shared by most departments. */
export const STANDARD_HOURS: BilingualText = {
  el: 'Δευτ–Παρ 08:00–14:00',
  en: 'Mon–Fri 08:00–14:00',
};

export const contactsData: Contact[] = [
  {
    id: 'mayor',
    name: { el: 'Γραφείο Δημάρχου', en: "Mayor's Office" },
    phone: '+302645360500',
    phones: ['+302645360507', '+302645360511'],
    email: 'dimarxos@lefkada.gov.gr',
    category: 'Administration',
  },
  {
    id: 'secretary-general',
    name: { el: 'Γενικός Γραμματέας', en: 'Secretary General' },
    phone: '+302645360519',
    category: 'Administration',
  },
  {
    id: 'legal',
    name: { el: 'Νομική Υπηρεσία', en: 'Legal Service' },
    phone: '+302645360588',
    category: 'Administration',
  },
  {
    id: 'kep',
    name: { el: 'ΚΕΠ – Κέντρο Εξυπηρέτησης Πολιτών', en: 'Citizen Service Centre (KEP)' },
    phone: '+302645360700',
    email: 'kep@lefkada.gov.gr',
    category: 'Services',
  },
  {
    id: 'registry',
    name: { el: 'Δημοτολόγιο / Ληξιαρχείο', en: 'Registry Office' },
    phone: '+302645360520',
    email: 'dimotologio@lefkada.gov.gr',
    category: 'Services',
  },
  {
    id: 'technical',
    name: { el: 'Τεχνική Υπηρεσία', en: 'Technical Services' },
    phone: '+302645360540',
    email: 'texniki@lefkada.gov.gr',
    category: 'Administration',
  },
  {
    id: 'finance',
    name: { el: 'Οικονομική Υπηρεσία / Ταμείο', en: 'Finance & Treasury' },
    phone: '+302645360560',
    email: 'tameio@lefkada.gov.gr',
    category: 'Administration',
  },
  {
    id: 'cleaning',
    name: { el: 'Υπηρεσία Καθαριότητας & Ανακύκλωσης', en: 'Cleaning & Recycling' },
    phone: '+302645360580',
    email: 'katharaiotita@lefkada.gov.gr',
    hours: { el: 'Δευτ–Σαβ 06:00–14:00', en: 'Mon–Sat 06:00–14:00' },
    category: 'Utilities',
  },
  {
    id: 'deya',
    name: { el: 'ΔΕΥΑ Λευκάδας (Ύδρευση)', en: 'Water Utility (DEYA)' },
    phone: '+302645025060',
    email: 'info@deyalefkadas.gr',
    category: 'Utilities',
  },
  {
    id: 'tourism',
    name: { el: 'Γραφείο Τουρισμού', en: 'Tourism Office' },
    phone: '+302645360610',
    email: 'tourism@lefkada.gov.gr',
    hours: { el: 'Καθημερινά 09:00–21:00 (καλοκαίρι)', en: 'Daily 09:00–21:00 (summer)' },
    category: 'Tourism',
  },
  {
    id: 'culture',
    name: { el: 'Πνευματικό Κέντρο / Πολιτισμός', en: 'Cultural Centre' },
    phone: '+302645360630',
    email: 'politismos@lefkada.gov.gr',
    category: 'Services',
  },
  {
    id: 'health-center',
    name: { el: 'Γενικό Νοσοκομείο Λευκάδας', en: 'Lefkada General Hospital' },
    phone: '+302645360200',
    hours: { el: '24 ώρες', en: '24 hours' },
    category: 'Health',
  },
  {
    id: 'police',
    name: { el: 'Αστυνομικό Τμήμα Λευκάδας', en: 'Lefkada Police' },
    phone: '+302645029370',
    hours: { el: '24 ώρες', en: '24 hours' },
    category: 'Emergency',
  },
  {
    id: 'fire',
    name: { el: 'Πυροσβεστική Υπηρεσία', en: 'Fire Service' },
    phone: '199',
    hours: { el: '24 ώρες', en: '24 hours' },
    category: 'Emergency',
  },
  {
    id: 'port',
    name: { el: 'Λιμεναρχείο Λευκάδας', en: 'Port Authority' },
    phone: '+302645360950',
    hours: { el: '24 ώρες', en: '24 hours' },
    category: 'Emergency',
  },
  {
    id: 'civil-protection',
    name: { el: 'Πολιτική Προστασία Δήμου', en: 'Civil Protection' },
    phone: '+302645360660',
    email: 'politiki.prostasia@lefkada.gov.gr',
    hours: { el: '24 ώρες (περίοδος κινδύνου)', en: '24 hours (risk periods)' },
    category: 'Emergency',
  },
];
