import type { BilingualText } from './news';

export interface Community {
  name: BilingualText;
  description: BilingualText;
}

export interface MunicipalUnit {
  id: string;
  name: BilingualText;
  seat: BilingualText;
  /** Whether it is a separate island community. */
  island?: boolean;
  communities: Community[];
}

export interface TwinCity {
  id: string;
  city: BilingualText;
  country: BilingualText;
  flag: string;
  year: number;
  reason: BilingualText;
  /** ISO yyyy-mm-dd date of the twinning. */
  twinningDate: string;
  /** Municipal Council decision reference (number/date). */
  decision: string;
  /** Mayor's office that signed the twinning. */
  mayor: BilingualText;
}

export type AccessMode = 'road' | 'bus' | 'ferry' | 'air';

export interface AccessRoute {
  id: string;
  mode: AccessMode;
  title: BilingualText;
  body: BilingualText;
  url?: string;
  urlLabel?: BilingualText;
}

const c = (
  elN: string,
  enN: string,
  elD: string,
  enD: string,
): Community => ({ name: { el: elN, en: enN }, description: { el: elD, en: enD } });

// ── Municipal units & communities (Kallikratis subdivisions) ─────────────────
export const municipalUnits: MunicipalUnit[] = [
  {
    id: 'lefkada',
    name: { el: 'Λευκάδα', en: 'Lefkada' },
    seat: { el: 'Λευκάδα (Χώρα)', en: 'Lefkada (Town)' },
    communities: [
      c('Λευκάδα', 'Lefkada', 'Η πρωτεύουσα και το λιμάνι του νησιού, με τα χαρακτηριστικά αντισεισμικά σπίτια, τη μαρίνα και τη λιμνοθάλασσα.', 'The island’s capital and port, with its distinctive earthquake-proof houses, marina and lagoon.'),
      c('Άγιος Νικήτας', 'Agios Nikitas', 'Γραφικό παραθαλάσσιο ψαροχώρι με πεζόδρομο, ταβέρνες και κοντινές παραλίες.', 'A picturesque seaside fishing village with a pedestrian lane, tavernas and nearby beaches.'),
      c('Αλέξανδρος', 'Alexandros', 'Μικρό ορεινό χωριό στις πλαγιές πάνω από τη δυτική ακτή.', 'A small mountain village on the slopes above the west coast.'),
      c('Απόλπαινα', 'Apolpaina', 'Παραδοσιακό χωριό κοντά στη Χώρα, στους πρόποδες της Φανερωμένης.', 'A traditional village near the town, at the foot of Faneromeni.'),
      c('Καλαμίτσι', 'Kalamitsi', 'Ορεινό χωριό με θέα στο Ιόνιο, πάνω από τις δυτικές παραλίες.', 'A mountain village overlooking the Ionian, above the western beaches.'),
      c('Καρυώτες', 'Kariotes', 'Παραλιακό χωριό δίπλα στη λιμνοθάλασσα, με αλυκές και ψαροτάβερνες.', 'A coastal village by the lagoon, with salt pans and fish tavernas.'),
      c('Κατούνα', 'Katouna', 'Χωριό στις πλαγιές πάνω από τη Χώρα, με θέα στον κόλπο.', 'A village on the slopes above the town, with views over the bay.'),
      c('Τσουκαλάδες', 'Tsoukalades', 'Χωριό στον δρόμο προς τις δυτικές παραλίες (Πευκούλια, Κάθισμα).', 'A village on the road to the west-coast beaches (Pefkoulia, Kathisma).'),
    ],
  },
  {
    id: 'apollonioi',
    name: { el: 'Απολλωνίων', en: 'Apollonioi' },
    seat: { el: 'Βασιλική', en: 'Vasiliki' },
    communities: [
      c('Βασιλική', 'Vasiliki', 'Κωμόπολη και κόλπος παγκοσμίως φημισμένος για windsurfing και ιστιοπλοΐα.', 'A small town and bay world-famous for windsurfing and sailing.'),
      c('Άγιος Ηλίας', 'Agios Ilias', 'Το ψηλότερο χωριό της Λευκάδας, με παραδοσιακή κτηνοτροφική κληρονομιά.', 'The highest village of Lefkada, with a traditional pastoral heritage.'),
      c('Άγιος Πέτρος', 'Agios Petros', 'Μεγάλο χωριό της νότιας Λευκάδας, στην εύφορη πεδιάδα.', 'A large village of southern Lefkada, in the fertile plain.'),
      c('Αθάνι', 'Athani', 'Ορεινό χωριό κοντά στις διάσημες παραλίες Πόρτο Κατσίκι και Εγκρεμνοί.', 'A mountain village near the famous Porto Katsiki and Egremni beaches.'),
      c('Χορτάτα', 'Chortata', 'Παραδοσιακό ορεινό χωριό στη νοτιοδυτική Λευκάδα.', 'A traditional mountain village in south-western Lefkada.'),
      c('Δράγανο', 'Dragano', 'Μικρό χωριό κοντά στη δυτική ακτή.', 'A small village near the west coast.'),
      c('Εύγηρος', 'Evgiros', 'Χωριό της νότιας Λευκάδας, πάνω από τον κόλπο της Βασιλικής.', 'A village of southern Lefkada, above the bay of Vasiliki.'),
      c('Κομηλιό', 'Komili', 'Ορεινό χωριό στο δρόμο προς το ακρωτήριο Λευκάτα.', 'A mountain village on the way to Cape Lefkatas.'),
      c('Κονταραίνα', 'Kontaraina', 'Μικρό γραφικό χωριό της ενδοχώρας.', 'A small picturesque inland village.'),
      c('Μαραντοχώρι', 'Marantochori', 'Χωριό της νότιας πεδιάδας, κοντά στην παραλία Αμμούσω.', 'A village of the southern plain, near Ammousa beach.'),
      c('Νικολής', 'Nikolis', 'Μικρός οικισμός της νότιας Λευκάδας.', 'A small settlement of southern Lefkada.'),
      c('Σύβρος', 'Syvros', 'Χωριό στην ενδοχώρα, γνωστό για το σπήλαιο της Καρούχας.', 'An inland village, known for the Karoucha cave.'),
      c('Βουρνικάς', 'Vournika', 'Μικρό ορεινό χωριό κοντά στον Σύβρο.', 'A small mountain village near Syvros.'),
    ],
  },
  {
    id: 'ellomenos',
    name: { el: 'Ελλομένου', en: 'Ellomenos' },
    seat: { el: 'Νυδρί', en: 'Nydri' },
    communities: [
      c('Νυδρί', 'Nydri', 'Ο μεγαλύτερος τουριστικός προορισμός του νησιού, απέναντι από τα πράσινα νησάκια του Μεγανησίου.', 'The island’s largest tourist resort, opposite the green islets off Meganisi.'),
      c('Βλυχό', 'Vlycho', 'Παραθαλάσσιο χωριό σε κλειστό, ασφαλή όρμο, κέντρο ιστιοπλοΐας.', 'A seaside village on an enclosed, safe bay — a sailing hub.'),
      c('Πόρος', 'Poros', 'Χωριό πάνω από την παραλία Μικρός Γιαλός, στη νοτιοανατολική ακτή.', 'A village above Mikros Gialos beach, on the south-east coast.'),
      c('Κατωχώρι', 'Katochori', 'Μικρό χωριό κοντά στο Βλυχό.', 'A small village near Vlycho.'),
      c('Νεοχώρι', 'Neochori', 'Ήσυχο χωριό της ενδοχώρας.', 'A quiet inland village.'),
      c('Φτερνό', 'Fterno', 'Ορεινό χωριό με θέα στον κόλπο του Νυδριού.', 'A hillside village overlooking the bay of Nydri.'),
      c('Χαραδιάτικα', 'Charadiatika', 'Χωριό της ενδοχώρας, κοντά στο μονοπάτι των καταρρακτών Δημοσάρι.', 'An inland village, near the Dimosari waterfalls trail.'),
      c('Πλατύστομα', 'Platystoma', 'Μικρός οικισμός στις πλαγιές πάνω από το Νυδρί.', 'A small settlement on the slopes above Nydri.'),
      c('Βαυκερή', 'Vafkeri', 'Ορεινό χωριό, αφετηρία πεζοπορικών διαδρομών.', 'A mountain village and a starting point for hiking trails.'),
    ],
  },
  {
    id: 'karya',
    name: { el: 'Καρυάς', en: 'Karya' },
    seat: { el: 'Καρυά', en: 'Karya' },
    communities: [
      c('Καρυά', 'Karya', 'Το πιο φημισμένο ορεινό χωριό, με το παραδοσιακό «καρσάνικο» κέντημα και τη μεγάλη πλατάνινη πλατεία.', 'The most famous mountain village, with its traditional "Karsaniko" embroidery and grand plane-tree square.'),
      c('Εγκλουβή', 'Egklouvi', 'Ένα από τα ψηλότερα χωριά, φημισμένο για τις περίφημες φακές του.', 'One of the highest villages, famed for its prized lentils.'),
      c('Πηγαδησάνοι', 'Pigadisanoi', 'Μικρός ορεινός οικισμός κοντά στην Καρυά.', 'A small mountain settlement near Karya.'),
    ],
  },
  {
    id: 'sfakiotes',
    name: { el: 'Σφακιωτών', en: 'Sfakiotes' },
    seat: { el: 'Λαζαράτα', en: 'Lazarata' },
    communities: [
      c('Λαζαράτα', 'Lazarata', 'Το κεντρικό χωριό των Σφακιωτών, σε μια καταπράσινη ορεινή κοιλάδα.', 'The central village of Sfakiotes, in a green mountain valley.'),
      c('Ασπρογερακάτα', 'Asprogerakata', 'Παραδοσιακό χωριό της ορεινής περιοχής των Σφακιωτών.', 'A traditional village of the Sfakiotes highlands.'),
      c('Δρυμώνας', 'Drymonas', 'Χωριό κοντά σε καταρράκτη και νερόμυλους.', 'A village near a waterfall and old watermills.'),
      c('Εξάνθεια', 'Exanthia', 'Το «μπαλκόνι» της Λευκάδας, φημισμένο για τα ηλιοβασιλέματά του πάνω από το Ιόνιο.', 'The "balcony" of Lefkada, famed for its sunsets over the Ionian.'),
      c('Κάβαλος', 'Kavallos', 'Χωριό με το Λαογραφικό Μουσείο Καβάλου.', 'A village home to the Kavalos Folklore Museum.'),
      c('Πινακοχώρι', 'Pinakochori', 'Μικρός οικισμός των Σφακιωτών.', 'A small settlement of Sfakiotes.'),
      c('Σπανοχώρι', 'Spanochori', 'Παραδοσιακό χωριό της ορεινής ενότητας.', 'A traditional village of the mountain unit.'),
    ],
  },
  {
    id: 'kalamos',
    name: { el: 'Καλάμου', en: 'Kalamos' },
    seat: { el: 'Κάλαμος', en: 'Kalamos' },
    island: true,
    communities: [
      c('Κάλαμος', 'Kalamos', 'Καταπράσινο νησί με αμφιθεατρικό χωριό-λιμάνι, απέναντι από τον Μύτικα.', 'A green island with an amphitheatrical port-village, opposite Mytikas.'),
      c('Επίσκοπος', 'Episkopos', 'Μικρός παραθαλάσσιος οικισμός του Καλάμου.', 'A small seaside settlement of Kalamos.'),
    ],
  },
  {
    id: 'kastos',
    name: { el: 'Καστού', en: 'Kastos' },
    seat: { el: 'Καστός', en: 'Kastos' },
    island: true,
    communities: [
      c('Καστός', 'Kastos', 'Το μικρότερο κατοικημένο νησί του Ιονίου, χωρίς αυτοκίνητα, με ελαιώνες και ήσυχους όρμους.', 'The smallest inhabited Ionian island — car-free, with olive groves and quiet coves.'),
    ],
  },
];

// ── Twinned (sister) cities — full registry incl. decision & signing mayor ───
export const twinCities: TwinCity[] = [
  {
    id: 'emmaboda',
    city: { el: 'Έμμαμποντα', en: 'Emmaboda' },
    country: { el: 'Σουηδία', en: 'Sweden' },
    flag: '🇸🇪',
    year: 1985,
    reason: { el: 'Η πρώτη αδελφοποίηση της Λευκάδας — πολιτιστική συνεργασία.', en: 'Lefkada’s first twinning — cultural cooperation.' },
    twinningDate: '1985-08-18',
    decision: '22 / 4-2-1985',
    mayor: { el: 'Σπύρος Μαργέλης', en: 'Spyros Margelis' },
  },
  {
    id: 'straznice',
    city: { el: 'Στράζνιτσε', en: 'Strážnice' },
    country: { el: 'Τσεχία', en: 'Czech Republic' },
    flag: '🇨🇿',
    year: 1988,
    reason: { el: 'Κοινή παράδοση φεστιβάλ φολκλόρ.', en: 'A shared tradition of folklore festivals.' },
    twinningDate: '1988-06-15',
    decision: '27 / 9-2-1987',
    mayor: { el: 'Σπύρος Μαργέλης', en: 'Spyros Margelis' },
  },
  {
    id: 'paralimni',
    city: { el: 'Παραλίμνι', en: 'Paralimni' },
    country: { el: 'Κύπρος', en: 'Cyprus' },
    flag: '🇨🇾',
    year: 1989,
    reason: { el: 'Και οι δύο πόλεις έχουν λιμνοθάλασσα.', en: 'Both towns have a lagoon.' },
    twinningDate: '1989-08-20',
    decision: '47 / 6-3-1989',
    mayor: { el: 'Σπύρος Μαργέλης', en: 'Spyros Margelis' },
  },
  {
    id: 'shinjuku',
    city: { el: 'Σιντζούκου', en: 'Shinjuku' },
    country: { el: 'Ιαπωνία', en: 'Japan' },
    flag: '🇯🇵',
    year: 1989,
    reason: { el: 'Δεσμός μέσω του Λευκάδιου Χερν και του Ιστορικού του Κέντρου.', en: 'A bond through Lafcadio Hearn and his Historical Center.' },
    twinningDate: '1989-10-12',
    decision: '86 / 13-5-1985',
    mayor: { el: 'Σπύρος Μαργέλης', en: 'Spyros Margelis' },
  },
  {
    id: 'nahariya',
    city: { el: 'Ναχαριά', en: 'Nahariya' },
    country: { el: 'Ισραήλ', en: 'Israel' },
    flag: '🇮🇱',
    year: 1992,
    reason: { el: 'Κοινή αγάπη για τον χορό.', en: 'A shared love of dance.' },
    twinningDate: '1992-08-16',
    decision: '19 / 20-1-1992',
    mayor: { el: 'Σπύρος Μαργέλης', en: 'Spyros Margelis' },
  },
  {
    id: 'ploiesti',
    city: { el: 'Πλοϊέστι', en: 'Ploiești' },
    country: { el: 'Ρουμανία', en: 'Romania' },
    flag: '🇷🇴',
    year: 1998,
    reason: { el: 'Δεσμός μέσω της φημισμένης φιλαρμονικής της.', en: 'A bond through its renowned philharmonic orchestra.' },
    twinningDate: '1998-04-28',
    decision: '110 / 28-7-1997',
    mayor: { el: 'Κώστας Σταματέλος', en: 'Costas Stamatelos' },
  },
  {
    id: 'leucate',
    city: { el: 'Λεκάτ', en: 'Leucate' },
    country: { el: 'Γαλλία', en: 'France' },
    flag: '🇫🇷',
    year: 2001,
    reason: { el: 'Πολιτιστική συνεργασία.', en: 'Cultural cooperation.' },
    twinningDate: '2001-09-22',
    decision: '232 / 4-12-2000',
    mayor: { el: 'Παναγιώτης Χαρδής', en: 'Panagiotis Hardy' },
  },
  {
    id: 'primorskyi',
    city: { el: 'Primorskyi (Οδησσός)', en: 'Primorskyi (Odessa)' },
    country: { el: 'Ουκρανία', en: 'Ukraine' },
    flag: '🇺🇦',
    year: 2010,
    reason: { el: 'Δεσμός νησιωτικών/λιμενικών πόλεων.', en: 'A bond between island/port cities.' },
    twinningDate: '2010-09-04',
    decision: '2 / 3-2-2010',
    mayor: { el: 'Βασίλειος Φέτσης', en: 'Vasilios Fetsis' },
  },
  {
    id: 'zhoushan',
    city: { el: 'Ζοουσάν', en: 'Zhoushan' },
    country: { el: 'Κίνα', en: 'China' },
    flag: '🇨🇳',
    year: 2015,
    reason: { el: 'Δεσμός νησιωτικών πόλεων.', en: 'A bond between island cities.' },
    twinningDate: '2015-06-14',
    decision: '12 / 19-1-2015',
    mayor: { el: 'Κωνσταντίνος Δρακονταειδής', en: 'Konstantinos Drakontaidis' },
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
      el: 'Πλησιέστερο αεροδρόμιο: Ακτίου «Πρέβεζα» (ΠΒΧ), ≈ 20 χλμ / 30 λεπτά από τη Χώρα της Λευκάδας.',
      en: 'Nearest airport: Aktio "Preveza" (PVK), ≈ 20 km / 30 min from Lefkada town.',
    },
  },
  {
    id: 'bus',
    mode: 'bus',
    title: { el: 'Λεωφορείο (ΚΤΕΛ)', en: 'By Bus (KTEL)' },
    body: {
      el: 'Το ΚΤΕΛ Λευκάδας συνδέει τη Λευκάδα με Αθήνα, Πάτρα, Θεσσαλονίκη και Πρέβεζα. Δείτε τα ισχύοντα δρομολόγια στον επίσημο ιστότοπο.',
      en: 'KTEL Lefkadas connects Lefkada with Athens, Patra, Thessaloniki and Preveza. Check current timetables on the operator’s site.',
    },
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
  },
];
