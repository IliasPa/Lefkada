import type { BilingualText } from './news';

export interface MunicipalUnit {
  id: string;
  name: BilingualText;
  seat: BilingualText;
  /** Whether it is a separate island community. */
  island?: boolean;
  communities: BilingualText[];
}

export interface TwinCity {
  id: string;
  city: BilingualText;
  country: BilingualText;
  flag: string;
  year: number;
  reason: BilingualText;
}

export type AccessMode = 'road' | 'bus' | 'ferry' | 'air';

export interface AccessRoute {
  id: string;
  mode: AccessMode;
  title: BilingualText;
  body: BilingualText;
  /** When this info card was last reviewed (ISO yyyy-mm-dd). */
  updated?: string;
  /** Valid-until date for seasonal schedules (ISO yyyy-mm-dd). */
  validUntil?: string;
  url?: string;
  urlLabel?: BilingualText;
}

// ── Municipal units & communities (Kallikratis subdivisions) ─────────────────
export const municipalUnits: MunicipalUnit[] = [
  {
    id: 'lefkada',
    name: { el: 'Λευκάδα', en: 'Lefkada' },
    seat: { el: 'Λευκάδα (Χώρα)', en: 'Lefkada (Town)' },
    communities: [
      { el: 'Λευκάδα', en: 'Lefkada' },
      { el: 'Άγιος Νικήτας', en: 'Agios Nikitas' },
      { el: 'Αλέξανδρος', en: 'Alexandros' },
      { el: 'Απόλπαινα', en: 'Apolpaina' },
      { el: 'Καλαμίτσι', en: 'Kalamitsi' },
      { el: 'Καρυώτες', en: 'Kariotes' },
      { el: 'Κατούνα', en: 'Katouna' },
      { el: 'Τσουκαλάδες', en: 'Tsoukalades' },
    ],
  },
  {
    id: 'apollonioi',
    name: { el: 'Απολλωνίων', en: 'Apollonioi' },
    seat: { el: 'Βασιλική', en: 'Vasiliki' },
    communities: [
      { el: 'Βασιλική', en: 'Vasiliki' },
      { el: 'Άγιος Ηλίας', en: 'Agios Ilias' },
      { el: 'Άγιος Πέτρος', en: 'Agios Petros' },
      { el: 'Αθάνι', en: 'Athani' },
      { el: 'Χορτάτα', en: 'Chortata' },
      { el: 'Δράγανο', en: 'Dragano' },
      { el: 'Εύγηρος', en: 'Evgiros' },
      { el: 'Κομηλιό', en: 'Komili' },
      { el: 'Κονταραίνα', en: 'Kontaraina' },
      { el: 'Μαραντοχώρι', en: 'Marantochori' },
      { el: 'Νικολής', en: 'Nikolis' },
      { el: 'Σύβρος', en: 'Syvros' },
      { el: 'Βουρνικάς', en: 'Vournika' },
    ],
  },
  {
    id: 'ellomenos',
    name: { el: 'Ελλομένου', en: 'Ellomenos' },
    seat: { el: 'Νυδρί', en: 'Nydri' },
    communities: [
      { el: 'Νυδρί', en: 'Nydri' },
      { el: 'Βλυχό', en: 'Vlycho' },
      { el: 'Πόρος', en: 'Poros' },
      { el: 'Κατωχώρι', en: 'Katochori' },
      { el: 'Νεοχώρι', en: 'Neochori' },
      { el: 'Φτερνό', en: 'Fterno' },
      { el: 'Χαραδιάτικα', en: 'Charadiatika' },
      { el: 'Πλατύστομα', en: 'Platystoma' },
      { el: 'Βαυκερή', en: 'Vafkeri' },
    ],
  },
  {
    id: 'karya',
    name: { el: 'Καρυάς', en: 'Karya' },
    seat: { el: 'Καρυά', en: 'Karya' },
    communities: [
      { el: 'Καρυά', en: 'Karya' },
      { el: 'Εγκλουβή', en: 'Egklouvi' },
      { el: 'Πηγαδησάνοι', en: 'Pigadisanoi' },
    ],
  },
  {
    id: 'sfakiotes',
    name: { el: 'Σφακιωτών', en: 'Sfakiotes' },
    seat: { el: 'Λαζαράτα', en: 'Lazarata' },
    communities: [
      { el: 'Λαζαράτα', en: 'Lazarata' },
      { el: 'Ασπρογερακάτα', en: 'Asprogerakata' },
      { el: 'Δρυμώνας', en: 'Drymonas' },
      { el: 'Εξάνθεια', en: 'Exanthia' },
      { el: 'Κάβαλος', en: 'Kavallos' },
      { el: 'Πινακοχώρι', en: 'Pinakochori' },
      { el: 'Σπανοχώρι', en: 'Spanochori' },
    ],
  },
  {
    id: 'kalamos',
    name: { el: 'Καλάμου', en: 'Kalamos' },
    seat: { el: 'Κάλαμος', en: 'Kalamos' },
    island: true,
    communities: [{ el: 'Κάλαμος', en: 'Kalamos' }, { el: 'Επίσκοπος', en: 'Episkopos' }],
  },
  {
    id: 'kastos',
    name: { el: 'Καστού', en: 'Kastos' },
    seat: { el: 'Καστός', en: 'Kastos' },
    island: true,
    communities: [{ el: 'Καστός', en: 'Kastos' }],
  },
];

// ── Twinned (sister) cities ──────────────────────────────────────────────────
export const twinCities: TwinCity[] = [
  {
    id: 'straznice',
    city: { el: 'Στράζνιτσε', en: 'Strážnice' },
    country: { el: 'Τσεχία', en: 'Czech Republic' },
    flag: '🇨🇿',
    year: 1988,
    reason: {
      el: 'Κοινή παράδοση φεστιβάλ φολκλόρ.',
      en: 'A shared tradition of folklore festivals.',
    },
  },
  {
    id: 'paralimni',
    city: { el: 'Παραλίμνι', en: 'Paralimni' },
    country: { el: 'Κύπρος', en: 'Cyprus' },
    flag: '🇨🇾',
    year: 1989,
    reason: {
      el: 'Και οι δύο πόλεις έχουν λιμνοθάλασσα.',
      en: 'Both towns have a lagoon.',
    },
  },
  {
    id: 'shinjuku',
    city: { el: 'Σιντζούκου', en: 'Shinjuku' },
    country: { el: 'Ιαπωνία', en: 'Japan' },
    flag: '🇯🇵',
    year: 1989,
    reason: {
      el: 'Δεσμός μέσω του Λευκάδιου Χερν και του Ιστορικού του Κέντρου.',
      en: 'A bond through Lafcadio Hearn and his Historical Center.',
    },
  },
  {
    id: 'nahariya',
    city: { el: 'Ναχαριά', en: 'Nahariya' },
    country: { el: 'Ισραήλ', en: 'Israel' },
    flag: '🇮🇱',
    year: 1992,
    reason: { el: 'Κοινή αγάπη για τον χορό.', en: 'A shared love of dance.' },
  },
  {
    id: 'ploiesti',
    city: { el: 'Πλοϊέστι', en: 'Ploiești' },
    country: { el: 'Ρουμανία', en: 'Romania' },
    flag: '🇷🇴',
    year: 1998,
    reason: {
      el: 'Δεσμός μέσω της φημισμένης φιλαρμονικής της.',
      en: 'A bond through its renowned philharmonic orchestra.',
    },
  },
  {
    id: 'leucate',
    city: { el: 'Λεκάτ', en: 'Leucate' },
    country: { el: 'Γαλλία', en: 'France' },
    flag: '🇫🇷',
    year: 2001,
    reason: { el: 'Πολιτιστική συνεργασία.', en: 'Cultural cooperation.' },
  },
  {
    id: 'primorskyi',
    city: { el: 'Primorskyi (Οδησσός)', en: 'Primorskyi (Odessa)' },
    country: { el: 'Ουκρανία', en: 'Ukraine' },
    flag: '🇺🇦',
    year: 2010,
    reason: { el: 'Πολιτιστική συνεργασία.', en: 'Cultural cooperation.' },
  },
  {
    id: 'zhoushan',
    city: { el: 'Ζοουσάν', en: 'Zhoushan' },
    country: { el: 'Κίνα', en: 'China' },
    flag: '🇨🇳',
    year: 2015,
    reason: { el: 'Δεσμός νησιωτικών πόλεων.', en: 'A bond between island cities.' },
  },
];

// ── How to reach Lefkada ─────────────────────────────────────────────────────
export const accessRoutes: AccessRoute[] = [
  {
    id: 'road',
    mode: 'road',
    title: { el: 'Οδικώς & Πλωτή Γέφυρα', en: 'By Road & Floating Bridge' },
    body: {
      el: 'Η Λευκάδα είναι το μόνο νησί του Ιονίου που συνδέεται με την ηπειρωτική Ελλάδα με αυτοκίνητο, μέσω της πλωτής γέφυρας στη διώρυγα. Από Αθήνα ≈ 380 χλμ μέσω Ρίου-Αντιρρίου ή Ακτίου.',
      en: 'Lefkada is the only Ionian island reachable by car from the mainland, via the floating bridge across the canal. From Athens ≈ 380 km via Rio–Antirrio or Aktio.',
    },
  },
  {
    id: 'air',
    mode: 'air',
    title: { el: 'Αεροπορικώς', en: 'By Air' },
    body: {
      el: 'Πλησιέστερο αεροδρόμιο: Ακτίου «Άραξος/Πρέβεζα» (ΠΒΧ), ≈ 20 χλμ / 30 λεπτά από τη Χώρα της Λευκάδας.',
      en: 'Nearest airport: Aktio "Preveza" (PVK), ≈ 20 km / 30 min from Lefkada town.',
    },
  },
  {
    id: 'bus',
    mode: 'bus',
    title: { el: 'Λεωφορείο (ΚΤΕΛ)', en: 'By Bus (KTEL)' },
    body: {
      el: 'Το ΚΤΕΛ Λευκάδας συνδέει καθημερινά τη Λευκάδα με Αθήνα, Πάτρα, Θεσσαλονίκη και Πρέβεζα. Δείτε τα ισχύοντα δρομολόγια στον επίσημο ιστότοπο.',
      en: 'KTEL Lefkadas connects Lefkada daily with Athens, Patra, Thessaloniki and Preveza. Check current timetables on the operator’s site.',
    },
    updated: '2026-06-20',
    url: 'https://www.ktel-lefkadas.gr/',
    urlLabel: { el: 'Δρομολόγια ΚΤΕΛ', en: 'KTEL timetables' },
  },
  {
    id: 'ferry-islands',
    mode: 'ferry',
    title: { el: 'Πλοία προς Κάλαμο & Καστό', en: 'Ferries to Kalamos & Kastos' },
    body: {
      el: 'Τα νησιά Κάλαμος και Καστός εξυπηρετούνται με τακτικό καραβάκι από τον Μύτικα (ηπειρωτική ακτή). Θερινές γραμμές συνδέουν επίσης Νυδρί/Βασιλική με Μεγανήσι, Κεφαλονιά και Ιθάκη.',
      en: 'The islands of Kalamos and Kastos are served by a regular boat from Mytikas (mainland coast). Summer lines also link Nydri/Vasiliki with Meganisi, Kefalonia and Ithaca.',
    },
    updated: '2026-06-20',
    validUntil: '2026-09-30',
  },
];
