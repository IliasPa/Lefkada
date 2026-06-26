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

  { id: 'es-eterodimotes', group: 'registry', title: { el: 'Ειδικοί Εκλογικοί Κατάλογοι Ετεροδημοτών', en: 'Special electoral rolls (out-of-municipality voters)' }, url: 'https://aitiseis-eterodimotes.ypes.gov.gr/login' },
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
export type InfoIcon = 'grocery' | 'community' | 'port';

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
    title: { el: 'Κοινωνικό Παντοπωλείο & ΔΕΠΟΚΑΛ', en: 'Social Grocery & ΔΕΠΟΚΑΛ' },
    description: {
      el: 'Στήριξη ευάλωτων νοικοκυριών με τρόφιμα και είδη πρώτης ανάγκης, μέσω της κοινωφελούς επιχείρησης του Δήμου (ΔΕΠΟΚΑΛ). Η αίτηση γίνεται στην Κοινωνική Υπηρεσία του Δήμου.',
      en: 'Support for vulnerable households with food and basic goods, run by the Municipality’s public-benefit enterprise (ΔΕΠΟΚΑΛ). Apply at the Municipality’s Social Service.',
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
];

// ── NSRF / ΕΣΠΑ co-funded projects ───────────────────────────────────────────
export const nsrfProjects = {
  title: { el: 'Έργα ΕΣΠΑ / Ταμείου Ανάκαμψης', en: 'NSRF / Recovery-Fund Projects' } as BilingualText,
  description: {
    el: 'Συγχρηματοδοτούμενα έργα και προγράμματα του Δήμου (ΕΣΠΑ 2021–2027, Ταμείο Ανάκαμψης, GReco Islands, Interreg). Συμπληρώστε και το ερωτηματολόγιο του Δήμου για τα έργα και τις προτεραιότητες.',
    en: 'The Municipality’s co-funded projects and programmes (NSRF 2021–2027, Recovery Fund, GReco Islands, Interreg). You can also fill in the Municipality’s questionnaire on the projects and priorities.',
  } as BilingualText,
  /** Citizen questionnaire (replaces the broken erga-espa link). */
  questionnaireUrl: 'https://docs.google.com/forms/d/1eewjb9ecvVs08z928s4Br1xfzGj9mpm76kNLfVkHt3M/viewform',
};

export interface NsrfDoc { label: BilingualText; url: string; }
export interface NsrfProgramme {
  id: string;
  title: BilingualText;
  description: BilingualText;
  docs: NsrfDoc[];
  /** Optional dedicated portal (for programmes without single documents). */
  url?: string;
}

export const nsrfProgrammes: NsrfProgramme[] = [
  {
    id: 'ionia-2014-2020',
    title: { el: 'Π.Ε.Π. «Ιόνια Νησιά 2014-2020»', en: 'ROP “Ionian Islands 2014-2020”' },
    description: { el: 'Ολοκληρωμένα και εν εξελίξει έργα του Δήμου στο Περιφερειακό Επιχειρησιακό Πρόγραμμα της προηγούμενης περιόδου.', en: 'Completed and ongoing municipal projects under the previous Regional Operational Programme.' },
    docs: [
      { label: { el: 'Δελτίο έργου: Agkyrovolio toyristikon skafon vasilikis 1', en: 'Δελτίο έργου: Agkyrovolio toyristikon skafon vasilikis 1' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/09/agkyrovolio-toyristikon-skafon-vasilikis-1-1.pdf' },
      { label: { el: 'Δελτίο έργου: Apoperatosi dimotikoy theatroy leykadasdocx', en: 'Δελτίο έργου: Apoperatosi dimotikoy theatroy leykadasdocx' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/09/apoperatosi-dimotikoy-theatroy-leykadasdocx-1.pdf' },
      { label: { el: 'Δελτίο έργου: Draseis gia tin diacheirisi vioapovliton kai anakyklosimon astikon apovliton ston dimo leykadas', en: 'Δελτίο έργου: Draseis gia tin diacheirisi vioapovliton kai anakyklosimon astikon apovliton ston dimo leykadas' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/09/draseis-gia-tin-diacheirisi-vioapovliton-kai-anakyklosimon-astikon-apovliton-ston-dimo-leykadas.pdf' },
      { label: { el: 'Δελτίο έργου: Mopak meganisioy', en: 'Δελτίο έργου: Mopak meganisioy' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/09/titlos-ergoy-mopak-meganisioy.pdf' },
      { label: { el: 'Δελτίο έργου: Trisdiastatos', en: 'Δελτίο έργου: Trisdiastatos' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/09/titlos-ergoy-trisdiastatos.pdf' },
      { label: { el: 'Δελτίο έργου: Anaplasi leykadas', en: 'Δελτίο έργου: Anaplasi leykadas' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/09/titlos-ergoy-anaplasi-leykadas-1.pdf' },
      { label: { el: 'Δελτίο έργου: Kataskeyi nosokomeioy leykadas', en: 'Δελτίο έργου: Kataskeyi nosokomeioy leykadas' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/09/titlos-ergoy-kataskeyi-nosokomeioy-leykadas.pdf' },
      { label: { el: 'Δελτίο έργου: Posimo meganisioy', en: 'Δελτίο έργου: Posimo meganisioy' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/09/titlos-ergoy-posimo-meganisioy-1.pdf' },
      { label: { el: 'Δελτίο έργου: Provoli istorik diadr meganisioy', en: 'Δελτίο έργου: Provoli istorik diadr meganisioy' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/09/titlos-ergoy-provoli-istorik-diadr-meganisioy.pdf' },
      { label: { el: 'Δελτίο έργου: Prostasia klirono meganisioy', en: 'Δελτίο έργου: Prostasia klirono meganisioy' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/09/titlos-ergoy-prostasia-klirono-meganisioy-1.pdf' },
      { label: { el: 'Δελτίο έργου: Ichthyotrofeio', en: 'Δελτίο έργου: Ichthyotrofeio' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/06/ichthyotrofeio.pdf' },
      { label: { el: 'Δελτίο έργου: Posimo', en: 'Δελτίο έργου: Posimo' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/06/titlos-ergoy-posimo-_1_.pdf' },
      { label: { el: 'Δελτίο έργου: Zampelion', en: 'Δελτίο έργου: Zampelion' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/06/titlos-ergoy-zampelion.pdf' },
      { label: { el: 'Δελτίο έργου: Antikatasta ag', en: 'Δελτίο έργου: Antikatasta ag' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/06/titlos-ergoy-antikatasta-ag.pdf' },
      { label: { el: 'Δελτίο έργου: Ypothal kalamo kasto', en: 'Δελτίο έργου: Ypothal kalamo kasto' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/06/titlos-ergoy-ypothal-kalamo-kasto.pdf' },
    ],
  },
  {
    id: 'ymeperaa',
    title: { el: 'Ε.Π. Υποδομές Μεταφορών, Περιβάλλον & Αειφόρος Ανάπτυξη (ΥΜΕΠΕΡΑΑ)', en: 'OP Transport Infrastructure, Environment & Sustainable Development (YMEPERAA)' },
    description: { el: 'Έργα υποδομών και περιβάλλοντος του Δήμου στο τομεακό πρόγραμμα ΥΜΕΠΕΡΑΑ.', en: 'Municipal infrastructure and environment projects under the YMEPERAA sectoral programme.' },
    docs: [
      { label: { el: 'Δελτίο έργου: Mopak leykadas', en: 'Δελτίο έργου: Mopak leykadas' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2021/06/titlos-ergoy-mopak-leykadas.docx' },
      { label: { el: 'Δελτίο έργου: Pk energeiako', en: 'Δελτίο έργου: Pk energeiako' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2025/10/pk-energeiako-1.docx' },
    ],
  },
  {
    id: 'interreg-gr-it',
    title: { el: 'Διασυνοριακό Πρόγραμμα Ελλάδα–Ιταλία 2021-2027 (Interreg VI-A)', en: 'Greece–Italy Cross-border Programme 2021-2027 (Interreg VI-A)' },
    description: { el: 'Διασυνοριακή συνεργασία στο πλαίσιο του Interreg VI-A Ελλάδα–Ιταλία 2021-2027.', en: 'Cross-border cooperation under Interreg VI-A Greece–Italy 2021-2027.' },
    docs: [
      { label: { el: 'Interreg VI-A Greece -Italy 2021/2027', en: 'Interreg VI-A Greece -Italy 2021/2027' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2025/12/project-description-ecotown_pb4-1.docx' },
    ],
  },
  {
    id: 'greco-islands',
    title: { el: 'GReco Islands — Τοπικά Σχέδια Δράσης (ΕΣΠΑ 2021-2027)', en: 'GReco Islands — Local Action Plans (NSRF 2021-2027)' },
    description: { el: 'Εκπόνηση Τοπικών Σχεδίων Δράσης για την πράσινη μετάβαση των νησιών, στο πλαίσιο της πρωτοβουλίας GReco Islands.', en: 'Local Action Plans for the green transition of the islands, under the GReco Islands initiative.' },
    docs: [
      { label: { el: 'Ανακοίνωση – Ενημέρωση', en: 'Ανακοίνωση – Ενημέρωση' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2026/04/anakoinosi-1.pdf' },
      { label: { el: 'Τοπικό Σχέδιο Δράσης GReco Islands για τον Κάλαμο', en: 'Τοπικό Σχέδιο Δράσης GReco Islands για τον Κάλαμο' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2025/12/topiko-schedio-drasis-greco-islands-gia-ton-kalamo.docx' },
      { label: { el: '1η Πρόσκληση Τεχνική & Θεσμική Διαβούλευση GRecoIsland', en: '1η Πρόσκληση Τεχνική & Θεσμική Διαβούλευση GRecoIsland' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2025/12/prosklisi-31-12-2025-gia-grecoislands.pdf' },
    ],
  },
  {
    id: 'ionia-2021-2027',
    title: { el: 'Ε.Π. «Ιόνια Νησιά 2021-2027»', en: 'OP “Ionian Islands 2021-2027”' },
    description: { el: 'Έργα του Δήμου στο νέο Περιφερειακό Επιχειρησιακό Πρόγραμμα Ιονίων Νήσων.', en: 'Municipal projects under the new Ionian Islands Regional Operational Programme.' },
    docs: [
      { label: { el: 'Επιχειρησιακό Πρόγραμμα “Ιόνια Νησιά 2021-2027”', en: 'Επιχειρησιακό Πρόγραμμα “Ιόνια Νησιά 2021-2027”' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2026/03/2apoperatosi-1.docx' },
      { label: { el: 'Ολοκλήρωση έργου / Project completion', en: 'Ολοκλήρωση έργου / Project completion' }, url: 'https://lefkada.gov.gr/wp-content/uploads/2026/03/2apoperatosi-1.docx' },
    ],
  },
  {
    id: 'sbaa',
    title: { el: 'Στρατηγική Βιώσιμης Αστικής Ανάπτυξης (ΒΑΑ)', en: 'Sustainable Urban Development Strategy (SUDS)' },
    description: { el: 'Ολοκληρωμένη χωρική επένδυση για την αναβάθμιση της Χώρας της Λευκάδας. Δείτε την αφιερωμένη πύλη της στρατηγικής.', en: 'An integrated territorial investment to upgrade Lefkada town. See the strategy’s dedicated portal.' },
    docs: [],
    url: 'https://lefkada.gov.gr/sbaa/',
  },
  {
    id: 'tameio-anakampsis',
    title: { el: 'Ταμείο Ανάκαμψης & Ανθεκτικότητας', en: 'Recovery & Resilience Fund' },
    description: { el: 'Έργα και δράσεις του Δήμου που χρηματοδοτούνται από το Εθνικό Σχέδιο Ανάκαμψης «Ελλάδα 2.0».', en: 'Municipal projects and actions funded by the national Recovery Plan “Greece 2.0”.' },
    docs: [],
    url: 'https://lefkada.gov.gr/en/tameio-anacampsia/',
  },
];

// ── Whistleblowing (Law 4990/2022, transposing EU Directive 2019/1937) ───────
export const whistleblowing = {
  title: { el: 'Αναφορές Παρατυπιών (Whistleblowing)', en: 'Whistleblowing Channel' } as BilingualText,
  description: {
    el: 'Εμπιστευτικό κανάλι αναφοράς παραβιάσεων δικαίου, σύμφωνα με τον Ν. 4990/2022 (ενσωμάτωση της Οδηγίας (ΕΕ) 2019/1937), μέσω της πλατφόρμας του Υπευθύνου Παραλαβής & Παρακολούθησης Αναφορών (Υ.Π.Π.Α.) του Δήμου.',
    en: 'A confidential channel for reporting breaches of law under Greek Law 4990/2022 (transposing EU Directive 2019/1937), via the platform of the Municipality’s designated Reports Officer (Y.P.P.A.).',
  } as BilingualText,
  urlEl: 'https://pbplatform.crowdapps.net/yppa-lefkada/',
  urlEn: 'https://pbplatform.crowdapps.net/yppa-lefkada-en/',
};

/** Cleanliness Department phone (bulky-waste & branches collection). */
export const bulkyWastePhone = '+302645360580';

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


// ── Personal Data Protection Policy (GDPR) — lefkada.gov.gr/politiki-prostasias-prosopikon-dedomenon ──
export const privacyPolicy = {
  title: { el: 'Πολιτική Προστασίας Προσωπικών Δεδομένων', en: 'Personal Data Protection Policy' } as BilingualText,
  el: [
    'Η προστασία των δεδομένων προσωπικού χαρακτήρα, αποτελεί βασικό μέλημα του Δήμου Λευκάδας. Στο πλαίσιο του Γενικού Κανονισμού Προστασίας των Δεδομένων (ΕΕ) 2016/679 (ΓΚΠΔ), που τέθηκε σε ισχύ από την 25/05/2018, όπως τροποποιήθηκε και ισχύει μέχρι σήμερα, με το παρόν κείμενο παρέχεται χρήσιμη ενημέρωση για την επεξεργασία των δεδομένων προσωπικού χαρακτήρα και τα δικαιώματα των υποκειμένων της επεξεργασίας, σύμφωνα με το άρθρο 13 του παραπάνω Κανονισμού.',
    'Σύμφωνα με τον παραπάνω Κανονισμό, στο άρθρο 4 αναφέρεται ότι νοούνται ως:',
    '« δεδομένα προσωπικού χαρακτήρα »: κάθε πληροφορία που αφορά ταυτοποιημένο ή ταυτοποιήσιμο φυσικό πρόσωπο («υποκείμενο των δεδομένων»)· το ταυτοποιήσιμο φυσικό πρόσωπο είναι εκείνο του οποίου η ταυτότητα μπορεί να εξακριβωθεί, άμεσα ή έμμεσα, ιδίως μέσω αναφοράς σε αναγνωριστικό στοιχείο ταυτότητας, όπως όνομα, σε αριθμό ταυτότητας, σε δεδομένα θέσης, σε επιγραμμικό αναγνωριστικό ταυτότητας ή σε έναν ή περισσότερους παράγοντες που προσιδιάζουν στη σωματική, φυσιολογική, γενετική, ψυχολογική, οικονομική, πολιτιστική ή κοινωνική ταυτότητα του εν λόγω φυσικού προσώπου, ενώ',
    '«επεξεργασία» : κάθε πράξη ή σειρά πράξεων που πραγματοποιείται με ή χωρίς τη χρήση αυτοματοποιημένων μέσων, σε δεδομένα προσωπικού χαρακτήρα ή σε σύνολα δεδομένων προσωπικού χαρακτήρα, όπως η συλλογή, η καταχώριση, η οργάνωση, η διάρθρωση, η αποθήκευση, η προσαρμογή ή η μεταβολή, η ανάκτηση, η αναζήτηση πληροφοριών, η χρήση, η κοινολόγηση με διαβίβαση, η διάδοση ή κάθε άλλη μορφή διάθεσης, η συσχέτιση ή ο συνδυασμός, ο περιορισμός, η διαγραφή ή η καταστροφή',
    'Η προστασία αφορά όλα τα δεδομένα προσωπικού χαρακτήρα, που έχουν περιέλθει ή θα περιέλθουν σε γνώση των Υπηρεσιών του Δήμου Λευκάδας και των Νομικών Προσώπων του Δήμου, στο πλαίσιο της νόμιμης λειτουργίας του και της συνεργασίας του με πολίτες και φορείς του δημοσίου ή ιδιωτικού τομέα.',
    'Η Πολιτική Ασφάλειας και Προστασίας Δεδομένων καθορίζει τη δέσμευση της Δημοτικής Αρχής και τη συνολική προσέγγιση του Δήμου και των ΝΠΔΔ αυτού αναφορικά με την ασφάλεια των πληροφοριακών συστημάτων και δικτύων και την προστασία προσωπικών δεδομένων.',
    'Η Πολιτική Ασφάλειας και προστασίας Προσωπικών Δεδομένων έχει καθολική ισχύ και εφαρμόζεται σε κάθε είδους επεξεργασία όλων των ειδών των προσωπικών δεδομένων που διατηρεί ο Δήμος Λευκάδας και τα ΝΠΔΔ, ανεξάρτητα από τον τρόπο συλλογής των δεδομένων.',
    'Τα προσωπικά δεδομένα χρησιμοποιούνται μόνον υπό τους ακόλουθους όρους και δεν πρέπει να χρησιμοποιούνται για σκοπούς άλλους από εκείνους για τους οποίους συλλέχθηκαν αρχικά. Η χρήση των συλλεγόμενων δεδομένων για άλλους σκοπούς, επιτρέπεται μόνο εάν πληρούνται οι προϋποθέσεις αποδεκτής χρήσης.',
    'Τα προσωπικά δεδομένα μπορούν να χρησιμοποιηθούν εάν μια ή περισσότερες από τις ακόλουθες προϋποθέσεις πληρούνται:',
    'Η ισχύουσα νομοθεσία σαφώς επιτρέπει τη συλλογή και επεξεργασία των προσωπικών δεδομένων για το συγκεκριμένο σκοπό.',
    'η επεξεργασία είναι απαραίτητη για τη συμμόρφωση με έννομη υποχρέωση του υπευθύνου επεξεργασίας',
    'η επεξεργασία είναι απαραίτητη για την εκπλήρωση καθήκοντος που εκτελείται προς το δημόσιο συμφέρον ή κατά την άσκηση δημόσιας εξουσίας που έχει ανατεθεί στον υπεύθυνο επεξεργασία',
    'το υποκείμενο των δεδομένων έχει συναινέσει στην επεξεργασία των δεδομένων προσωπικού χαρακτήρα του για έναν ή περισσότερους συγκεκριμένους σκοπούς',
    'Είναι απαραίτητη η χρήση των δεδομένων με τον τρόπο αυτό, ώστε ο Δήμος ή/και τα ΝΠΔΔ να εκπληρώσει τις συμβατικές υποχρεώσεις της προς το υποκείμενο των δεδομένων',
    'Είναι απαραίτητη η χρήση των δεδομένων για τη διασφάλιση ζωτικών συμφερόντων του υποκειμένου των δεδομένων.',
    'Ο Δήμος Λευκάδας και τα ΝΠΔΔ αυτού λαμβάνουν ιδιαίτερη πρόνοια για την προστασία ειδικών κατηγοριών δεδομένων προσωπικού χαρακτήρα των πολιτών / δημοτών / προσωπικού.',
    'Στο πλαίσιο αυτό, απαγορεύεται η επεξεργασία δεδομένων προσωπικού χαρακτήρα που αποκαλύπτουν:',
    'τη φυλετική ή εθνοτική καταγωγή του υποκειμένου των δεδομένων',
    'τα πολιτικά φρονήματα του υποκειμένου των δεδομένων',
    'τις θρησκευτικές ή φιλοσοφικές πεποιθήσεις ή τη συμμετοχή σε συνδικαλιστική οργάνωση του υποκειμένου των δεδομένων',
    'γενετικά και βιομετρικά δεδομένα του υποκειμένου των δεδομένων ,',
    'δεδομένα που αφορούν την υγεία του υποκειμένου των δεδομένων',
    'δεδομένα που αφορούν τη σεξουαλική ζωή φυσικού προσώπου ή τον γενετήσιο προσανατολισμό του υποκειμένου των δεδομένων',
    'Εξαίρεση στα ανωτέρω αποτελεί η ικανοποίηση μίας ή περισσότερων συνθηκών που περιγράφονται στην παρ. 2 του άρθρου 9 του Γενικού Κανονισμού για την Προστασία Προσωπικών δεδομένων. Επίσης, προβλέπεται η υιοθέτηση μέτρων ψευδωνυμοποίησης ή κρυπτογράφησης δεδομένων προσωπικού χαρακτήρα και δη, για την περίπτωση ευαίσθητων δεδομένων.',
    'Ο υπεύθυνος επεξεργασίας πρέπει πάντα να είναι σε θέση να αποδείξει ότι το υποκείμενο των δεδομένων συγκατατέθηκε για την επεξεργασία των δεδομένων του προσωπικού χαρακτήρα. Προς την κατεύθυνση αυτή:',
    'Η συγκατάθεση έχει δοθεί ρητά, οικειοθελώς και κατόπιν ενημέρωσης του υποκειμένου, με τρόπο τέτοιο ώστε το υποκείμενο των δεδομένων να γνωρίζει τον σκοπό της συγκατάθεσης.',
    'Εάν η συγκατάθεση του υποκειμένου των δεδομένων παρέχεται στο πλαίσιο γραπτής δήλωσης η οποία αφορά και άλλα θέματα, το αίτημα για συγκατάθεση υποβάλλεται κατά τρόπο ώστε να είναι σαφώς διακριτό από τα άλλα θέματα, σε κατανοητή και εύκολα προσβάσιμη μορφή, χρησιμοποιώντας σαφή και απλή διατύπωση.',
    'Το υποκείμενο των δεδομένων έχει δικαίωμα να ανακαλέσει τη συγκατάθεσή του ανά πάσα στιγμή. Η ανάκληση της συγκατάθεσης δεν θίγει τη νομιμότητα της επεξεργασίας που βασίστηκε στη συγκατάθεση προ της ανάκλησής της.',
    'Σε όλες τις προσκλήσεις / προκηρύξεις επιμέρους Δράσεων / Προγραμμάτων που υλοποιεί ο Δήμος, περιλαμβάνεται τυποποιημένο υπόδειγμα παροχής συγκατάθεσης και συναίνεσης του υποκειμένου των δεδομένων',
    'Σε όλες τις αιτήσεις των υποκειμένων των δεδομένων προς το Δήμο ή/και τα ΝΠΔΔ αυτού, περιλαμβάνεται τυποποιημένο υπόδειγμα παροχής συγκατάθεσης και συναίνεσης του υποκειμένου των δεδομένων',
    'Κατά τη λήψη των δεδομένων προσωπικού χαρακτήρα και εφόσον τα δεδομένα συλλέγονται από το υποκείμενο των δεδομένων, ο υπεύθυνος επεξεργασίας θα παρέχει αυτοβούλως συγκεκριμένες πληροφορίες προς τα υποκείμενα των δεδομένων, σε πλήρη συμμόρφωση με τις απαιτήσεις του άρθρου 13 του Γενικού Κανονισμού για την Προστασία Δεδομένων.',
    'Στην κατεύθυνση αυτή:',
    'Έχει καταρτιστεί και χρησιμοποιείται τυποποιημένο υπόδειγμα προσκλήσεων / προκηρύξεων σε όλες τις νέες δράσεις / προγράμματα / διεργασίες που υλοποιούν ο Δήμος ή/και τα ΝΠΔΔ αυτού, με τις αναγκαίες πληροφορίες για την επεξεργασία των προσωπικών δεδομένων των πολιτών',
    'Έχει καταρτιστεί και έχει αναρτηθεί στην ιστοσελίδα του Δήμου Λευκάδας δήλωση προστασίας προσωπικών δεδομένων',
    'Παράλληλα, ο Δήμος Λευκάδας και τα ΝΠΔΔ αυτού, είναι υποχρεωμένα και θα ανταποκρίνονται εντός συγκεκριμένου χρονικού διαστήματος που δεν μπορεί να υπερβαίνει τον ένα (1) μήνα (υπό συγκεκριμένες προϋποθέσεις το εν λόγω διάστημα μπορεί να διαμορφώνεται σε τρεις (3) μήνες) και θα παρέχει σαφείς και ολοκληρωμένες απαντήσεις σε αιτήματα που υποβάλλονται από τα υποκείμενα των δεδομένων.',
    'Σε αυτή την κατεύθυνση, ο Δήμος και τα ΝΠΔΔ έχουν αναπτύξει, κοινοποιήσει μεταξύ των άμεσα εμπλεκόμενων και εφαρμόζουν ειδική διαδικασία «Ανταπόκρισης σε αιτήματα φυσικών προσώπων» με υπεύθυνο τον Υπεύθυνο Προστασίας Δεδομένων.',
    'Σε πλήρη ευθυγράμμιση με το άρθρο 28 του Γενικού Κανονισμού για την Προστασία Δεδομένων, ο Δήμος Λευκάδας και τα ΝΠΔΔ αυτού θα χρησιμοποιούν και θα αναθέτουν την επεξεργασία δεδομένων μόνο σε όσους εκτελούντες την επεξεργασία (εξωτερικοί συνεργάτες, προμηθευτές κλπ.) μπορούν να παρέχουν επαρκείς διαβεβαιώσεις ότι πληρούν τις απαιτήσεις του Κανονισμού.',
    'Προς την κατεύθυνση αυτή, ο Δήμος και τα ΝΠΔΔ αυτού έχουν προβεί στις κάτωθι ενέργειες:',
    'Έχουν καταρτίσει και θα ενσωματώνουν σε κάθε προκήρυξη / πρόσκληση σύναψης δημόσιας σύμβασης εφόσον το αντικείμενο σχετίζεται με επεξεργασία προσωπικών δεδομένων, σχετική απαίτηση / πρόβλεψη',
    'Έχουν καταρτίσει υπόδειγμα συμβάσεων με εξωτερικούς συνεργάτες / προμηθευτές, με ειδική αναφορά στην υποχρέωση εκ μέρους τους για τη διασφάλιση της εχεμύθειας, εμπιστευτικότητας και πλήρους συμμόρφωσης με τις απαιτήσεις του Γενικού Κανονισμού Προστασίας Προσωπικών Δεδομένων.',
    'Τα δεδομένα προσωπικού χαρακτήρα διαβιβάζονται μόνον εφόσον ο αποδέκτης των δεδομένων αναλαμβάνει την ευθύνη για τα δεδομένα που λαμβάνει ή όταν ο αποδέκτης χρησιμοποιεί τα δεδομένα αποκλειστικά σύμφωνα με τις οδηγίες και τις απαιτήσεις του αποστολέα.',
    'Η διαβίβαση προσωπικών δεδομένων από το Δήμο ή/και τα ΝΠΔΔ αυτού σε μέρη που έχουν την έδρα τους σε τρίτη χώρα ή σε διεθνή οργανισμό, πραγματοποιείται υπό την αίρεση πως τηρούνται πλήρως οι προϋποθέσεις που ρητά ορίζονται στο άρθρο 45 του Γενικού Κανονισμού για την Προστασία Προσωπικών Δεδομένων.',
    'Σε αυτή την περίπτωση, ο υπεύθυνος επεξεργασίας λαμβάνει όλα τα κατάλληλα μέτρα για να διασφαλιστεί ότι τα δεδομένα διαβιβάζονται κατάλληλα.',
    'Τα υποκείμενα των δεδομένων έχουν μία σειρά από δικαιώματα, τα οποία μπορεί να εξασκήσουν δικαίωμα',
    'Το υποκείμενο των δεδομένων έχει το δικαίωμα να λαμβάνει από τον υπεύθυνο επεξεργασίας επιβεβαίωση για το κατά πόσον ή όχι τα δεδομένα προσωπικού χαρακτήρα που το αφορούν υφίστανται επεξεργασία και, εάν συμβαίνει τούτο, το δικαίωμα πρόσβασης στα δεδομένα προσωπικού χαρακτήρα και στο σύνολο των πληροφοριών που ορίζονται στο άρθρο 15 του Γενικού Κανονισμού Προστασίας Προσωπικών δεδομένων.',
    'Το υποκείμενο των δεδομένων έχει το δικαίωμα να απαιτήσει από τον υπεύθυνο επεξεργασίας χωρίς αδικαιολόγητη καθυστέρηση τη διόρθωση ανακριβών δεδομένων προσωπικού χαρακτήρα που το αφορούν. Έχοντας υπόψη τους σκοπούς της επεξεργασίας, το υποκείμενο των δεδομένων έχει το δικαίωμα να απαιτήσει τη συμπλήρωση ελλιπών δεδομένων προσωπικού χαρακτήρα, μεταξύ άλλων μέσω συμπληρωματικής δήλωσης.',
    'Το υποκείμενο των δεδομένων έχει το δικαίωμα να ζητήσει από τον υπεύθυνο επεξεργασίας τη διαγραφή δεδομένων προσωπικού χαρακτήρα που το αφορούν χωρίς αδικαιολόγητη καθυστέρηση και ο υπεύθυνος επεξεργασίας υποχρεούται να διαγράψει δεδομένα προσωπικού χαρακτήρα χωρίς αδικαιολόγητη καθυστέρηση, εάν ισχύει ένας από τους λόγους που μνημονεύονται στο άρθρο 17 του Γενικού Κανονισμού για την Προστασία Προσωπικών Δεδομένων.',
    'Το υποκείμενο των δεδομένων δικαιούται να εξασφαλίζει από τον υπεύθυνο επεξεργασίας τον περιορισμό της επεξεργασίας των δεδομένων, όταν ικανοποιείται κάποιο από τα κριτήρια που μνημονεύονται στο άρθρο 18 του Γενικού Κανονισμού για την Προστασία Προσωπικών Δεδομένων',
    'Το υποκείμενο των δεδομένων έχει το δικαίωμα να λαμβάνει τα δεδομένα προσωπικού χαρακτήρα που το αφορούν, και τα οποία έχει παράσχει σε υπεύθυνο επεξεργασίας, σε δομημένο, κοινώς χρησιμοποιούμενο και αναγνώσιμο από μηχανήματα μορφότυπο, καθώς και το δικαίωμα να διαβιβάζει τα εν λόγω δεδομένα σε άλλον υπεύθυνο επεξεργασίας χωρίς αντίρρηση από τον υπεύθυνο επεξεργασίας στον οποίο παρασχέθηκαν τα δεδομένα προσωπικού χαρακτήρα, όταν ικανοποιείται κάποιο από τα κριτήρια που μνημονεύονται στο άρθρο 20 του Γενικού Κανονισμού για την Προστασία Προσωπικών Δεδομένων.',
    'Το υποκείμενο των δεδομένων δικαιούται να αντιτάσσεται, ανά πάσα στιγμή και για λόγους που σχετίζονται με την ιδιαίτερη κατάστασή του, στην επεξεργασία δεδομένων προσωπικού χαρακτήρα που το αφορούν, περιλαμβανομένης της κατάρτισης προφίλ.',
    'Ο υπεύθυνος επεξεργασίας δεν υποβάλλει πλέον τα δεδομένα προσωπικού χαρακτήρα σε επεξεργασία, εκτός εάν ο υπεύθυνος επεξεργασίας καταδείξει επιτακτικούς και νόμιμους λόγους για την επεξεργασία οι οποίοι υπερισχύουν των συμφερόντων, των δικαιωμάτων και των ελευθεριών του υποκειμένου των δεδομένων ή για τη θεμελίωση, άσκηση ή υποστήριξη νομικών αξιώσεων.',
    'Το υποκείμενο των δεδομένων έχει το δικαίωμα να μην υπόκειται σε απόφαση που λαμβάνεται αποκλειστικά βάσει αυτοματοποιημένης επεξεργασίας (εκτός αν ικανοποιούνται οι εξαιρέσεις του άρθρου 22 του Γενικού Κανονισμού Προστασίας Προσωπικών Δεδομένων), συμπεριλαμβανομένης της κατάρτισης προφίλ, η οποία παράγει έννομα αποτελέσματα που το αφορούν ή το επηρεάζει σημαντικά με παρόμοιο τρόπο.',
    'Ο υπεύθυνος επεξεργασίας ανακοινώνει κάθε διόρθωση ή διαγραφή δεδομένων προσωπικού χαρακτήρα ή περιορισμό της επεξεργασίας των δεδομένων σε κάθε αποδέκτη στον οποίο γνωστοποιήθηκαν τα δεδομένα προσωπικού χαρακτήρα, εκτός εάν αυτό αποδεικνύεται ανέφικτο ή εάν συνεπάγεται δυσανάλογη προσπάθεια. Ο υπεύθυνος επεξεργασίας ενημερώνει το υποκείμενο των δεδομένων σχετικά με τους εν λόγω αποδέκτες, εφόσον αυτό ζητηθεί από το υποκείμενο των δεδομένων.',
    'Κάθε αίτημα αναφορικά με τα προσωπικά δεδομένα και την άσκηση των δικαιωμάτων σας πρέπει να απευθύνεται εγγράφως προς το Δήμο Ηρακλείου και την Υπεύθυνη Προστασίας Δεδομένων (DPO).',
    'Υπεύθυνος Προστασίας Δεδομένων για το Δήμο Λευκάδας:',
    'Γκογκάκης Κωνσταντίνος, ΠΕ Δημοτικός Αστυνομικός',
    'Στοιχεία Επικοινωνίας:',
    'Διεύθυνση : Διοικητήριο Λευκάδας, 311 00 Λευκάδα',
    'Τηλέφωνο : 2645360603',
    'e-mail : dpo@lefkada.gov.gr',
    'Έχετε το δικαίωμα να προσφύγετε στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα για ζητήματα που αφορούν την επεξεργασία προσωπικών σας δεδομένων. Για την αρμοδιότητα της Αρχής και τον τρόπο υποβολής καταγγελίας, μπορείτε να επισκεφθείτε την ιστοσελίδα της ( www.dpa.gr ®ΠΟΛΙΤΕΣ®Τα δικαιώματά μου στο πλαίσιο του ΓΚΠΔ®Υποβολή καταγγελίας), όπου υπάρχουν αναλυτικές πληροφορίες.',
    'Οι ανωτέρω όροι καθώς και οποιαδήποτε τροποποίηση τους, διέπονται και συμπληρώνονται από το ελληνικό δίκαιο, το δίκαιο της Ευρωπαϊκής Ένωσης και τις σχετικές διεθνείς συνθήκες. Οποιαδήποτε διάταξη των ανωτέρω όρων καταστεί αντίθετη προς το νόμο, παύει αυτοδικαίως να ισχύει και αφαιρείται από το παρόν, χωρίς σε καμία περίπτωση να θίγεται η ισχύς των λοιπών όρων.',
  ],
  en: [
    'Security and data protection policy of the Municipality of Lefkada',
    'The protection of personal data is a key concern of the Municipality of Lefkada. In the context of the General Data Protection Regulation (EU) 2016/679 (GDPR), which entered into force on 25/05/2018, as amended and in force until today, this document provides useful information on the processing of personal data and the rights of the data subjects of the processing, in accordance with Article 13 of the above Regulation.',
    'According to the above Regulation, Article 4 states that the following definitions shall apply:',
    '« data personal nature »any information relating to an identified or identifiable natural person («data subject»); an identifiable natural person is one whose identity can be established, directly or indirectly, in particular by reference to an identifier such as a name, an identification number, location data, an online identifier or one or more factors specific to the physical, physiological, genetic, psychological, economic, cultural or social identity of that natural person, while',
    '«processing» : any operation or set of operations which is performed, whether or not by automated means, on personal data or on sets of personal data, such as collection, recording, organisation, structuring, storage, adaptation or alteration, retrieval, consultation, use, disclosure by transmission, dissemination or otherwise making available, alignment or combination, restriction, erasure or destruction',
    'The protection concerns all personal data that have come or will come to the knowledge of the services of the Municipality of Lefkada and the Municipality\'s legal entities, in the context of its legal operation and its cooperation with citizens and public or private sector entities.',
    'The Data Security and Protection Policy defines the commitment of the Municipal Authority and the overall approach of the Municipality and its NPAs regarding the security of information systems and networks and the protection of personal data.',
    'The Personal Data Security and Protection Policy has universal validity and applies to all types of processing of all types of personal data held by the Municipality of Lefkada and the NPOs, regardless of the way the data is collected.',
    'Personal data is used only under the following conditions and must not be used for purposes other than those for which it was originally collected. The use of the collected data for other purposes is only permitted if the conditions of acceptable use are met.',
    'Personal data may be used if one or more of the following conditions are met:',
    'Current legislation clearly allows the collection and processing of personal data for this purpose.',
    'processing is necessary for compliance with a legal obligation of the controller;',
    'processing is necessary for the performance of a task carried out in the public interest or in the exercise of official authority vested in the controller;',
    'the data subject has consented to the processing of his or her personal data for one or more specific purposes;',
    'It is necessary to use the data in this way in order for the Municipality and/or the NPAs to fulfil its contractual obligations towards the data subject.',
    'It is necessary to use the data to safeguard the vital interests of the data subject.',
    'The Municipality of Lefkada and its NPAs take special care for the protection of special categories of personal data of citizens / citizens / staff.',
    'In this context, the processing of personal data that they disclose is prohibited:',
    'the racial or ethnic origin of the data subject',
    'the political opinions of the data subject',
    'the data subject\'s religious or philosophical beliefs or trade union membership;',
    'genetic and biometric data of the data subject ,',
    'data concerning the health of the data subject',
    'data concerning the sexual life of a natural person or the sexual orientation of the data subject;',
    'An exception to the above is the satisfaction of one or more of the conditions described in par. 2 of Article 9 of the General Data Protection Regulation. The adoption of measures for the pseudonymisation or encryption of personal data, in particular in the case of sensitive data, is also provided for.',
    'The controller must always be able to demonstrate that the data subject has consented to the processing of his or her personal data. To this end:',
    'The consent has been given explicitly, voluntarily and after informing the data subject, in such a way that the data subject is aware of the purpose of the consent.',
    'Where the data subject\'s consent is given in the context of a written statement which also concerns other subjects, the request for consent shall be made in a way that is clearly distinguishable from the other subjects, in an intelligible and easily accessible form, using clear and simple wording.',
    'The data subject has the right to withdraw his or her consent at any time. The withdrawal of consent shall not affect the lawfulness of the processing based on consent prior to its withdrawal.',
    'In all calls / notices of individual Actions / Programmes implemented by the Municipality, a standardised template for the consent of the data subject is included.',
    'In all data subjects\' requests to the Municipality and/or its NDAs, a standard template for the data subject\'s consent and assent is included.',
    'When receiving the personal data and where the data are collected from the data subject, the controller will voluntarily provide specific information to the data subjects, in full compliance with the requirements of Article 13 of the General Data Protection Regulation.',
    'In this direction:',
    'A standardised template of invitations / notices has been prepared and is used in all new actions / programmes / processes implemented by the Municipality and/or its NPAs, with the necessary information for the processing of citizens\' personal data.',
    'A personal data protection statement has been prepared and posted on the website of the Municipality of Lefkada',
    'At the same time, the Municipality of Lefkada and its NPAs are obliged to respond within a specific period of time that may not exceed one (1) month (under certain conditions this period may be extended to three (3) months) and will provide clear and comprehensive responses to requests submitted by data subjects.',
    'In this direction, the Municipality and the NPAs have developed, communicated among those directly involved and implement a specific procedure «Responding to requests from individuals» with the Data Protection Officer in charge.',
    'In full alignment with Article 28 of the General Data Protection Regulation, the Municipality of Lefkada and its NPOs will use and outsource data processing only to those processors (external partners, suppliers, etc.) who can provide sufficient assurances that they meet the requirements of the Regulation.',
    'In this direction, the Municipality and its NPAs have taken the following actions:',
    'Have prepared and will include in each procurement notice/call for tender, where the subject matter relates to the processing of personal data, a relevant requirement/provision',
    'They have drawn up model contracts with external partners/suppliers, with specific reference to their obligation to ensure confidentiality, secrecy and full compliance with the requirements of the General Data Protection Regulation.',
    'Personal data shall only be transferred if the recipient of the data assumes responsibility for the data received or if the recipient uses the data exclusively in accordance with the instructions and requirements of the sender.',
    'The transfer of personal data from the Municipality and/or its NPOs to parties based in a third country or an international organisation is subject to full compliance with the conditions expressly set out in Article 45 of the General Regulation for the Protection of Personal Data.',
    'In this case, the controller shall take all appropriate measures to ensure that the data are transferred appropriately.',
    'Data subjects have a number of rights, which may include the right to exercise',
    'The data subject shall have the right to obtain from the controller confirmation as to whether or not personal data concerning him or her are being processed and, if so, the right of access to the personal data and to all the information set out in Article 15 of the General Data Protection Regulation.',
    'The data subject shall have the right to obtain from the controller without undue delay the rectification of inaccurate personal data concerning him or her. Having regard to the purposes of the processing, the data subject shall have the right to require the completion of incomplete personal data, including by means of a supplementary declaration.',
    'The data subject shall have the right to request the controller to erase personal data concerning him or her without undue delay and the controller shall be obliged to erase personal data without undue delay if one of the grounds referred to in Article 17 of the General Data Protection Regulation applies.',
    'The data subject shall be entitled to obtain from the controller the restriction of the processing of data where one of the criteria mentioned in Article 18 of the General Data Protection Regulation is met.',
    'The data subject shall have the right to receive personal data concerning him or her which he or she has provided to a controller in a structured, commonly used and machine-readable format, and the right to transmit those data to another controller without objection from the controller to whom the personal data were provided, where one of the criteria referred to in Article 20 of the General Data Protection Regulation is met.',
    'The data subject shall have the right to object, at any time and on grounds relating to his or her particular situation, to the processing of personal data concerning him or her, including profiling.',
    'The controller shall no longer process personal data unless the controller demonstrates compelling legitimate grounds for the processing which override the interests, rights and freedoms of the data subject or for establishing, exercising or supporting legal claims.',
    'The data subject has the right not to be subject to a decision taken solely on the basis of automated processing (unless the exceptions in Article 22 of the General Data Protection Regulation are met), including profiling, which produces legal effects concerning him or her or significantly affects him or her in a similar way.',
    'The controller shall communicate any rectification or erasure of personal data or restriction of processing of data to each recipient to whom the personal data have been disclosed, unless this proves impracticable or involves a disproportionate effort. The controller shall inform the data subject about those recipients, if requested by the data subject.',
    'Any request regarding personal data and the exercise of your rights must be addressed in writing to the Municipality of Heraklion and the Data Protection Officer (DPO).',
    'Data Protection Officer for the Municipality of Lefkada:',
    'Konstantinos Gogakis, MA Municipal Police Officer',
    'Contact Details:',
    'Address : Lefkada Administration Building, 311 00 Lefkada',
    'Phone : 2645360603',
    'e-mail : dpo@lefkada.gov.gr',
    'You have the right to appeal to the Data Protection Authority on issues relating to the processing of your personal data. For the Authority\'s competence and how to lodge a complaint, you can visit its website ( www.dpa.gr ®CUSTOMERS®My rights under the GDPR®Submitting a complaint), where detailed information is available.',
    'The above terms and any modification thereof are governed and supplemented by Greek law, the law of the European Union and the relevant international treaties. Any provision of the above terms that is contrary to the law, shall automatically cease to apply and shall be removed from the present, without in any way affecting the validity of the other terms.',
  ],
};
