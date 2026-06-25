import type { BilingualText } from './news';

export type ServiceGroup = 'digital' | 'social' | 'safety';

export type ServiceIcon =
  | 'eservices'
  | 'report'
  | 'projects'
  | 'grocery'
  | 'community'
  | 'port'
  | 'water'
  | 'whistle';

export interface ServiceItem {
  id: string;
  group: ServiceGroup;
  icon: ServiceIcon;
  title: BilingualText;
  description: BilingualText;
  href: string;
  cta?: BilingualText;
}

export interface EmergencyNumber {
  id: string;
  label: BilingualText;
  number: string;
}

export const SERVICE_GROUP_LABEL: Record<ServiceGroup, BilingualText> = {
  digital: { el: 'Ψηφιακές Υπηρεσίες', en: 'Digital Services' },
  social: { el: 'Κοινωνικές Υπηρεσίες & Φορείς', en: 'Social Services & Bodies' },
  safety: { el: 'Ασφάλεια & Διαφάνεια', en: 'Safety & Integrity' },
};

export const services: ServiceItem[] = [
  // ── Digital ──
  {
    id: 'eservices',
    group: 'digital',
    icon: 'eservices',
    title: { el: 'Ηλεκτρονικές Υπηρεσίες (gov.gr)', en: 'E-Services (gov.gr)' },
    description: {
      el: 'Πιστοποιητικά, βεβαιώσεις και ηλεκτρονικά αιτήματα μέσω της Ενιαίας Ψηφιακής Πύλης gov.gr και των ΚΕΠ του Δήμου.',
      en: 'Certificates, attestations and electronic requests through the gov.gr national portal and the Municipality’s Citizen Service Centres (KEP).',
    },
    href: 'https://www.gov.gr/',
    cta: { el: 'Άνοιγμα gov.gr', en: 'Open gov.gr' },
  },
  {
    id: 'report',
    group: 'digital',
    icon: 'report',
    title: { el: 'Αναφορά Προβλήματος (4MyCity)', en: 'Report a Problem (4MyCity)' },
    description: {
      el: 'Αναφέρετε ένα πρόβλημα της πόλης — λακκούβα, φωτισμός, καθαριότητα — και παρακολουθήστε την πορεία του αιτήματός σας.',
      en: 'Report a city issue — pothole, lighting, cleanliness — and track the progress of your request.',
    },
    href: 'https://4mycity.lefkada.gov.gr/',
    cta: { el: 'Νέα αναφορά', en: 'New report' },
  },
  {
    id: 'projects-map',
    group: 'digital',
    icon: 'projects',
    title: { el: 'Έργα στον Χάρτη (ΕΣΠΑ)', en: 'Projects on a Map (NSRF/EU)' },
    description: {
      el: 'Δείτε στον χάρτη τα συγχρηματοδοτούμενα έργα (ΕΣΠΑ/Ταμείο Ανάκαμψης) που υλοποιεί ο Δήμος σε όλο το νησί.',
      en: 'See on a map the co-funded (NSRF / Recovery Fund) projects the Municipality is delivering across the island.',
    },
    href: 'https://lefkada.gov.gr/',
    cta: { el: 'Άνοιγμα χάρτη έργων', en: 'Open projects map' },
  },

  // ── Social ──
  {
    id: 'grocery',
    group: 'social',
    icon: 'grocery',
    title: { el: 'Κοινωνικό Παντοπωλείο & ΔΕΚΟΚΑΛ', en: 'Social Grocery & DEKOKAL' },
    description: {
      el: 'Στήριξη ευάλωτων νοικοκυριών με τρόφιμα και είδη πρώτης ανάγκης, μέσω της κοινωφελούς επιχείρησης του Δήμου (ΔΕΚΟΚΑΛ).',
      en: 'Support for vulnerable households with food and basic goods, run by the Municipality’s public-benefit enterprise (DEKOKAL).',
    },
    href: 'https://lefkada.gov.gr/',
    cta: { el: 'Περισσότερα', en: 'Learn more' },
  },
  {
    id: 'community-centre',
    group: 'social',
    icon: 'community',
    title: { el: 'Κέντρο Κοινότητας', en: 'Community Centre' },
    description: {
      el: 'Υπηρεσία υποδοχής και κοινωνικής υποστήριξης: ενημέρωση για επιδόματα, διασύνδεση με προνοιακές δομές και συμβουλευτική.',
      en: 'A reception and social-support service: guidance on benefits, referral to welfare structures and counselling.',
    },
    href: 'https://lefkada.gov.gr/',
    cta: { el: 'Περισσότερα', en: 'Learn more' },
  },
  {
    id: 'port-fund',
    group: 'social',
    icon: 'port',
    title: { el: 'Δημοτικό Λιμενικό Ταμείο', en: 'Municipal Port Fund' },
    description: {
      el: 'Διαχείριση και αξιοποίηση των λιμενικών υποδομών του Δήμου — προβλήτες, μαρίνες και χώροι ελλιμενισμού.',
      en: 'Management of the Municipality’s port infrastructure — quays, marinas and mooring areas.',
    },
    href: 'https://lefkada.gov.gr/',
    cta: { el: 'Περισσότερα', en: 'Learn more' },
  },
  {
    id: 'water-analyses',
    group: 'social',
    icon: 'water',
    title: { el: 'Αναλύσεις Πόσιμου Νερού', en: 'Drinking-Water Analyses' },
    description: {
      el: 'Οι περιοδικές αναλύσεις ποιότητας του πόσιμου νερού ανά οικισμό, όπως δημοσιεύονται από τον Δήμο.',
      en: 'Periodic drinking-water quality analyses per settlement, as published by the Municipality.',
    },
    href: 'https://lefkada.gov.gr/',
    cta: { el: 'Δείτε αναλύσεις', en: 'View analyses' },
  },

  // ── Safety & integrity ──
  {
    id: 'whistleblowing',
    group: 'safety',
    icon: 'whistle',
    title: { el: 'Αναφορές Παρατυπιών (Whistleblowing)', en: 'Whistleblowing Channel' },
    description: {
      el: 'Εμπιστευτικό κανάλι αναφοράς παραβιάσεων, σύμφωνα με την Οδηγία (ΕΕ) 2019/1937 για την προστασία όσων καταγγέλλουν.',
      en: 'A confidential channel for reporting breaches, under EU Directive 2019/1937 protecting whistleblowers.',
    },
    href: 'https://lefkada.gov.gr/',
    cta: { el: 'Υποβολή αναφοράς', en: 'Submit a report' },
  },
];

/** Civil-protection & emergency numbers surfaced as a quick-dial card. */
export const emergencyNumbers: EmergencyNumber[] = [
  { id: 'eu', label: { el: 'Ευρωπαϊκός Αριθμός Έκτακτης Ανάγκης', en: 'European Emergency Number' }, number: '112' },
  { id: 'municipal', label: { el: 'Δήμος — Γραμμή Έκτακτης Ανάγκης', en: 'Municipality — Emergency Line' }, number: '967' },
  { id: 'police', label: { el: 'Αστυνομία', en: 'Police' }, number: '100' },
  { id: 'fire', label: { el: 'Πυροσβεστική', en: 'Fire Service' }, number: '199' },
  { id: 'ekab', label: { el: 'ΕΚΑΒ (Ασθενοφόρο)', en: 'EKAB (Ambulance)' }, number: '166' },
  { id: 'coastguard', label: { el: 'Λιμενικό', en: 'Coast Guard' }, number: '108' },
  { id: 'civil-protection', label: { el: 'Πολιτική Προστασία Δήμου', en: 'Municipal Civil Protection' }, number: '+302645360660' },
];
