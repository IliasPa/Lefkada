import type { BilingualText } from './news';

export type HealthCategory =
  | 'Hospital'
  | 'Advisory'
  | 'Vaccination'
  | 'Mental Health'
  | 'Dentistry'
  | 'Environment';

export interface HealthCard {
  id: string;
  title: BilingualText;
  content: BilingualText;
  category: HealthCategory;
  accentColor: string;
  phone?: string;
}

export const healthData: HealthCard[] = [
  {
    id: '1',
    title: {
      el: 'Γενικό Νοσοκομείο Λευκάδας – Ώρες Εφημερίας',
      en: 'Lefkada General Hospital – Emergency Hours',
    },
    content: {
      el: 'Το τμήμα επειγόντων λειτουργεί 24/7. Για μη επείγοντα, τα τακτικά ραντεβού είναι Δευτ–Παρ 8:00–14:00. Τηλ.: 26450-25371.',
      en: 'The emergency department operates 24/7. For non-urgent cases, outpatient appointments are Monday–Friday, 8:00–14:00. Call 26450-25371.',
    },
    category: 'Hospital',
    accentColor: '#FF6B6B',
    phone: '26450-25371',
  },
  {
    id: '2',
    title: {
      el: 'Προειδοποίηση Καύσωνα – Καλοκαίρι 2026',
      en: 'Summer Heat Wave Advisory',
    },
    content: {
      el: 'Κατά τους καλοκαιρινούς μήνες συνιστάται ενυδάτωση, αποφυγή υπαίθριων δραστηριοτήτων 12:00–17:00 και χρήση αντηλιακού SPF 50+. Χώροι δροσισμού στο Δημαρχείο.',
      en: 'During peak summer months, stay hydrated, avoid outdoor activities between 12:00–17:00, and use sunscreen SPF 50+. Cooling stations are open at the Municipal Center.',
    },
    category: 'Advisory',
    accentColor: '#FFA500',
  },
  {
    id: '3',
    title: {
      el: 'Δωρεάν Εμβολιασμός – Άνοιξη 2026',
      en: 'Free Vaccination Campaign – Spring 2026',
    },
    content: {
      el: 'Το Κέντρο Υγείας Λευκάδας προσφέρει δωρεάν εμβολιασμούς γρίπης και πνευμονίας για κατοίκους άνω των 60 και ευπαθείς ομάδες. Εγγραφές από 20 Μαρτίου.',
      en: 'The Lefkada Health Center is offering free flu and pneumonia vaccinations for residents over 60 and at-risk groups. Registration opens March 20th.',
    },
    category: 'Vaccination',
    accentColor: '#4CAF50',
  },
  {
    id: '4',
    title: {
      el: 'Γραμμή Ψυχοκοινωνικής Υποστήριξης',
      en: 'Mental Health Support Line',
    },
    content: {
      el: 'Δωρεάν και εμπιστευτική γραμμή ψυχολογικής υποστήριξης για κατοίκους Λευκάδας. Καλέστε 10306 (χωρίς χρέωση) Δευτ–Παρ 10:00–22:00.',
      en: 'A free and confidential mental health support line for Lefkada residents. Call 10306 (toll-free) Monday–Friday, 10:00–22:00.',
    },
    category: 'Mental Health',
    accentColor: '#9C27B0',
    phone: '10306',
  },
  {
    id: '5',
    title: {
      el: 'Οδοντιατρική Περίθαλψη Χαμηλόεισοδηματικών Οικογενειών',
      en: 'Dental Care for Low-Income Families',
    },
    content: {
      el: 'Επιδοτούμενη οδοντιατρική περίθαλψη μέσω της κοινωνικής υπηρεσίας του Δήμου. Απαιτούνται: ΑΜΚΑ και εκκαθαριστικό σημείωμα.',
      en: 'Eligible low-income families can access subsidized dental care through the municipal social services office. Required: AMKA number and income certificate.',
    },
    category: 'Dentistry',
    accentColor: '#2196F3',
  },
  {
    id: '6',
    title: {
      el: 'Έκθεση Ποιότητας Νερού – Μάρτιος 2026',
      en: 'Water Quality Report – March 2026',
    },
    content: {
      el: 'Μηνιαίος έλεγχος ποιότητας νερού: το νερό της βρύσης σε ολόκληρη τη Λευκάδα πληροί όλα τα ευρωπαϊκά πρότυπα ποσίμου ύδατος. Δεν υπάρχουν ενεργές ειδοποιήσεις.',
      en: 'Monthly water quality testing confirms that tap water throughout Lefkada municipality meets all EU drinking water standards. No advisories are currently in effect.',
    },
    category: 'Environment',
    accentColor: '#00BCD4',
  },
];
