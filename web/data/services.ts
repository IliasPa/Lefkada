import type { BilingualText } from './news';

// ── gov.gr e-services (real links from lefkada.gov.gr/e-ypiresies) ────────────
export type EServiceGroup = 'cert' | 'registry' | 'lixiarcheio';

export interface EService {
  id: string;
  group: EServiceGroup;
  title: BilingualText;
  url: string;
}

export const ESERVICE_GROUP_LABEL: Record<EServiceGroup, BilingualText> = {
  cert: { el: 'Πιστοποιητικά Δημοτολογίου', en: 'Registry Certificates' },
  registry: { el: 'Δημοτολόγιο', en: 'Citizen Registry' },
  lixiarcheio: { el: 'Ληξιαρχείο', en: 'Civil Registry (Births/Marriages/Deaths)' },
};

export const govEServices: EService[] = [
  { id: 'es-residence', group: 'cert', title: { el: 'Βεβαίωση μόνιμης κατοικίας', en: 'Permanent residence certificate' }, url: 'https://www.gov.gr/ipiresies/polites-kai-kathemerinoteta/dieuthunse-katoikias-kai-epikoinonias/bebaiose-monimes-katoikias' },
  { id: 'es-birth-cert', group: 'cert', title: { el: 'Πιστοποιητικό γέννησης', en: 'Birth certificate' }, url: 'https://www.gov.gr/ipiresies/oikogeneia/gennese/pistopoietiko-genneses' },
  { id: 'es-family', group: 'cert', title: { el: 'Πιστοποιητικό οικογενειακής κατάστασης', en: 'Family status certificate' }, url: 'https://www.gov.gr/ipiresies/oikogeneia/oikogeneiake-katastase/pistopoietiko-oikogeneiakes-katastases' },
  { id: 'es-relatives', group: 'cert', title: { el: 'Πιστοποιητικό εγγυτέρων συγγενών', en: 'Next-of-kin certificate' }, url: 'https://www.gov.gr/ipiresies/oikogeneia/apoleia/pistopoietiko-egguteron-suggenon' },
  { id: 'es-nationality', group: 'cert', title: { el: 'Πιστοποιητικό ιθαγένειας', en: 'Citizenship certificate' }, url: 'https://www.gov.gr/ipiresies/oikogeneia/oikogeneiake-katastase/pistopoietiko-ithageneias' },
  { id: 'es-origin', group: 'cert', title: { el: 'Πιστοποιητικό εντοπιότητας', en: 'Certificate of local origin' }, url: 'https://www.gov.gr/ipiresies/oikogeneia/oikogeneiake-katastase/pistopoietiko-entopiotetas' },

  { id: 'es-eterodimotes', group: 'registry', title: { el: 'Ειδικοί Εκλογικοί Κατάλογοι Ετεροδημοτών', en: 'Special electoral rolls (out-of-municipality voters)' }, url: 'https://aitiseis.eterodimotes.gov.gr/' },
  { id: 'es-civil-marriage', group: 'registry', title: { el: 'Αίτηση Άδειας Πολιτικού Γάμου', en: 'Civil marriage licence application' }, url: 'https://dilosi.services.gov.gr/templates/ADEIA-POLITIKOU-GAMOU/create' },

  { id: 'es-birth-act', group: 'lixiarcheio', title: { el: 'Ληξιαρχική πράξη γέννησης', en: 'Birth registration act' }, url: 'https://www.gov.gr/ipiresies/oikogeneia/gennese/lexiarkhike-praxe-genneses' },
  { id: 'es-marriage-act', group: 'lixiarcheio', title: { el: 'Ληξιαρχική πράξη γάμου', en: 'Marriage registration act' }, url: 'https://www.gov.gr/ipiresies/oikogeneia/gamos-sumbiose/lexiarkhike-praxe-gamou' },
  { id: 'es-death-act', group: 'lixiarcheio', title: { el: 'Ληξιαρχική πράξη θανάτου', en: 'Death registration act' }, url: 'https://www.gov.gr/ipiresies/oikogeneia/apoleia/lexiarkhike-praxe-thanatou' },
  { id: 'es-partnership-act', group: 'lixiarcheio', title: { el: 'Ληξιαρχική πράξη συμφώνου συμβίωσης', en: 'Civil partnership registration act' }, url: 'https://www.gov.gr/ipiresies/oikogeneia/gamos-sumbiose/lexiarkhike-praxe-sumphonou-sumbioses' },
];

// ── e-Payments (eservices.lefkada.gov.gr — functional payment portal) ─────────
export interface EPayment {
  id: string;
  title: BilingualText;
  description: BilingualText;
  url: string;
}

export const ePayments: EPayment[] = [
  {
    id: 'pay-certified',
    title: { el: 'Πληρωμή Βεβαιωμένων Οφειλών', en: 'Pay certified debts' },
    description: { el: 'Δημοτικά τέλη, πρόστιμα και λοιπές βεβαιωμένες οφειλές με κάρτα.', en: 'Municipal fees, fines and other certified debts, paid by card.' },
    url: 'https://eservices.lefkada.gov.gr/egwebapps/home',
  },
  {
    id: 'pay-uncertified',
    title: { el: 'Πληρωμή Μη Βεβαιωμένων Οφειλών', en: 'Pay non-certified debts' },
    description: { el: 'Εξόφληση οφειλών που δεν έχουν ακόμη βεβαιωθεί, μέσω του συστήματος του Δήμου.', en: 'Settle debts not yet certified, via the municipal system.' },
    url: 'https://eservices.lefkada.gov.gr/egwebapps/home',
  },
  {
    id: 'pay-childcare',
    title: { el: 'Αιτήσεις Παιδικών/Βρεφονηπιακών Σταθμών', en: 'Childcare / nursery applications' },
    description: { el: 'Ηλεκτρονική υποβολή αιτήσεων εγγραφής στους δημοτικούς παιδικούς σταθμούς.', en: 'Online enrolment applications for the municipal childcare facilities.' },
    url: 'https://eservices.lefkada.gov.gr/egwebapps/domes/aitiseis/1',
  },
];

// ── In-app informational services (no external municipal-site link) ───────────
export type InfoIcon = 'grocery' | 'community' | 'port' | 'water' | 'whistle';

export interface InfoService {
  id: string;
  icon: InfoIcon;
  title: BilingualText;
  description: BilingualText;
}

export const infoServices: InfoService[] = [
  {
    id: 'grocery',
    icon: 'grocery',
    title: { el: 'Κοινωνικό Παντοπωλείο & ΔΕΚΟΚΑΛ', en: 'Social Grocery & DEKOKAL' },
    description: {
      el: 'Στήριξη ευάλωτων νοικοκυριών με τρόφιμα και είδη πρώτης ανάγκης, μέσω της κοινωφελούς επιχείρησης του Δήμου (ΔΕΚΟΚΑΛ). Η αίτηση γίνεται στην Κοινωνική Υπηρεσία του Δήμου.',
      en: 'Support for vulnerable households with food and basic goods, run by the Municipality’s public-benefit enterprise (DEKOKAL). Apply at the Municipality’s Social Service.',
    },
  },
  {
    id: 'community-centre',
    icon: 'community',
    title: { el: 'Κέντρο Κοινότητας', en: 'Community Centre' },
    description: {
      el: 'Υπηρεσία υποδοχής και κοινωνικής υποστήριξης: ενημέρωση για επιδόματα, διασύνδεση με προνοιακές δομές και συμβουλευτική.',
      en: 'A reception and social-support service: guidance on benefits, referral to welfare structures and counselling.',
    },
  },
  {
    id: 'port-fund',
    icon: 'port',
    title: { el: 'Δημοτικό Λιμενικό Ταμείο', en: 'Municipal Port Fund' },
    description: {
      el: 'Διαχείριση και αξιοποίηση των λιμενικών υποδομών του Δήμου — προβλήτες, μαρίνες και χώροι ελλιμενισμού.',
      en: 'Management of the Municipality’s port infrastructure — quays, marinas and mooring areas.',
    },
  },
  {
    id: 'water-analyses',
    icon: 'water',
    title: { el: 'Αναλύσεις Πόσιμου Νερού', en: 'Drinking-Water Analyses' },
    description: {
      el: 'Οι περιοδικές αναλύσεις ποιότητας του πόσιμου νερού ανά οικισμό δημοσιεύονται από τη Δ.Ε.Υ.Α. Λευκάδας. (Σύνδεσμος προς τις εκθέσεις θα προστεθεί όταν δοθεί επίσημος.)',
      en: 'Periodic drinking-water quality analyses per settlement are published by DEYAL (the Lefkada water utility). (A link to the reports will be added once an official one is provided.)',
    },
  },
  {
    id: 'whistleblowing',
    icon: 'whistle',
    title: { el: 'Αναφορές Παρατυπιών (Whistleblowing)', en: 'Whistleblowing Channel' },
    description: {
      el: 'Εμπιστευτικό κανάλι αναφοράς παραβιάσεων, σύμφωνα με την Οδηγία (ΕΕ) 2019/1937. Η αναφορά υποβάλλεται στον Υπεύθυνο Παραλαβής & Παρακολούθησης Αναφορών (Υ.Π.Π.Α.) του Δήμου. (Επίσημο κανάλι/φόρμα θα συνδεθεί όταν δοθεί.)',
      en: 'A confidential channel for reporting breaches under EU Directive 2019/1937. Reports go to the Municipality’s designated Reports Officer. (An official channel/form will be linked once provided.)',
    },
  },
];

// ── Waste & recycling ────────────────────────────────────────────────────────
export interface WasteArea {
  id: string;
  area: BilingualText;
  /** Indicative collection pattern — confirm with the Cleanliness Service. */
  schedule: BilingualText;
}

export const recyclingStreams: BilingualText[] = [
  { el: 'Μπλε κάδος: χαρτί, πλαστικό, μέταλλο, γυαλί', en: 'Blue bin: paper, plastic, metal, glass' },
  { el: 'Καφέ κάδος: οργανικά / βιοαπόβλητα (όπου υπάρχει)', en: 'Brown bin: organic / bio-waste (where available)' },
  { el: 'Πράσινος κάδος: σύμμεικτα οικιακά απορρίμματα', en: 'Green bin: mixed household waste' },
];

/** Indicative — the exact per-area weekday schedule is set seasonally by the
 *  Cleanliness Service and should be confirmed there. */
export const wasteAreas: WasteArea[] = [
  { id: 'town', area: { el: 'Χώρα Λευκάδας', en: 'Lefkada Town' }, schedule: { el: 'Σύμμεικτα: καθημερινά (θερινή περίοδος) · Ανακύκλωση: 2–3 φορές/εβδομάδα', en: 'Mixed: daily (summer) · Recycling: 2–3×/week' } },
  { id: 'ellomenos', area: { el: 'Νυδρί & Ελλομένου', en: 'Nydri & Ellomenos' }, schedule: { el: 'Σύμμεικτα: εναλλάξ ημέρες · Ανακύκλωση: εβδομαδιαία', en: 'Mixed: alternate days · Recycling: weekly' } },
  { id: 'apollonia', area: { el: 'Βασιλική & Απολλωνίων', en: 'Vasiliki & Apollonioi' }, schedule: { el: 'Σύμμεικτα: εναλλάξ ημέρες · Ανακύκλωση: εβδομαδιαία', en: 'Mixed: alternate days · Recycling: weekly' } },
  { id: 'mountain', area: { el: 'Ορεινά χωριά (Σφακιώτες/Καρυά)', en: 'Mountain villages (Sfakiotes/Karya)' }, schedule: { el: 'Σύμμεικτα: 2–3 φορές/εβδομάδα', en: 'Mixed: 2–3×/week' } },
];

/** Bulky-waste & branches drop-off points (per municipal-unit). */
export const bulkyWasteNote: BilingualText = {
  el: 'Ογκώδη (έπιπλα, στρώματα) και κλαδέματα: κατόπιν συνεννόησης με την Υπηρεσία Καθαριότητας ή στα οριζόμενα σημεία προσωρινής εναπόθεσης στις ενότητες Λευκάδας, Απολλωνίων και Ελλομένου.',
  en: 'Bulky waste (furniture, mattresses) and branches: by arrangement with the Cleanliness Service, or at the designated temporary drop-off points in the Lefkada, Apollonioi and Ellomenos units.',
};

// ── Civil-protection & emergency numbers ─────────────────────────────────────
export interface EmergencyNumber {
  id: string;
  label: BilingualText;
  number: string;
}

export const emergencyNumbers: EmergencyNumber[] = [
  { id: 'eu', label: { el: 'Ευρωπαϊκός Αριθμός Έκτακτης Ανάγκης', en: 'European Emergency Number' }, number: '112' },
  { id: 'municipal', label: { el: 'Δήμος — Γραμμή Έκτακτης Ανάγκης', en: 'Municipality — Emergency Line' }, number: '967' },
  { id: 'police', label: { el: 'Αστυνομία', en: 'Police' }, number: '100' },
  { id: 'fire', label: { el: 'Πυροσβεστική', en: 'Fire Service' }, number: '199' },
  { id: 'ekab', label: { el: 'ΕΚΑΒ (Ασθενοφόρο)', en: 'EKAB (Ambulance)' }, number: '166' },
  { id: 'coastguard', label: { el: 'Λιμενικό', en: 'Coast Guard' }, number: '108' },
  { id: 'civil-protection', label: { el: 'Πολιτική Προστασία Δήμου', en: 'Municipal Civil Protection' }, number: '+302645360660' },
];
