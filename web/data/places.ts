import type { BilingualText } from './news';

export type PlaceCategory =
  | 'Beach'
  | 'Village'
  | 'Trail'
  | 'Museum'
  | 'CulturalSpace'
  | 'Church'
  | 'Castle'
  | 'Landmark';

export interface Place {
  id: string;
  name: BilingualText;
  category: PlaceCategory;
  /** [lat, lng] — approximate, for the shared map. */
  coords: [number, number];
  description: BilingualText;
  /** External link (e.g. the Cultural Center page for a venue). */
  url?: string;
}

/** Categories shown in the Culture tab "Cultural spaces" subtab. */
export const CULTURAL_PLACE_CATEGORIES: PlaceCategory[] = [
  'CulturalSpace',
  'Museum',
  'Church',
];

export const PLACE_IMAGES: Record<PlaceCategory, string> = {
  Beach: '/backgrounds/lefkada-3-cove.png',
  Village: '/backgrounds/lefkada-1-ionian.png',
  Trail: '/events/sports.png',
  Museum: '/events/art.png',
  CulturalSpace: '/events/theatre.png',
  Church: '/events/religious.png',
  Castle: '/events/festival.png',
  Landmark: '/backgrounds/lefkada-2-sunset.png',
};

export const PLACE_ACCENT: Record<PlaceCategory, string> = {
  Beach: '#0EA5E9',
  Village: '#16A34A',
  Trail: '#65A30D',
  Museum: '#9333EA',
  CulturalSpace: '#A61E34',
  Church: '#C4963C',
  Castle: '#B45309',
  Landmark: '#E4802C',
};

const CC = 'https://lefkasculturalcenter.gr/';

export const placesData: Place[] = [
  // ── Beaches ──
  {
    id: 'porto-katsiki',
    name: { el: 'Πόρτο Κατσίκι', en: 'Porto Katsiki' },
    category: 'Beach',
    coords: [38.6553, 20.5560],
    description: {
      el: 'Η πιο διάσημη παραλία της Λευκάδας, με τον επιβλητικό λευκό βράχο και τα τιρκουάζ νερά στη δυτική ακτή.',
      en: "Lefkada's most famous beach — a dramatic white cliff over turquoise water on the west coast.",
    },
  },
  {
    id: 'egremni',
    name: { el: 'Εγκρεμνοί', en: 'Egremni' },
    category: 'Beach',
    coords: [38.6711, 20.5611],
    description: {
      el: 'Εκτεταμένη παραλία με βότσαλο και κρυστάλλινα νερά, κάτω από απόκρημνους βράχους.',
      en: 'A long pebble beach with crystal water beneath steep cliffs.',
    },
  },
  {
    id: 'kathisma',
    name: { el: 'Κάθισμα', en: 'Kathisma' },
    category: 'Beach',
    coords: [38.7339, 20.5731],
    description: {
      el: 'Οργανωμένη αμμώδης παραλία, δημοφιλής για ηλιοβασίλεμα και θαλάσσια σπορ.',
      en: 'An organised sandy beach, popular for sunsets and watersports.',
    },
  },
  {
    id: 'kalamitsi',
    name: { el: 'Καλαμίτσι', en: 'Kalamitsi' },
    category: 'Beach',
    coords: [38.7556, 20.5905],
    description: {
      el: 'Ήσυχη παραλία κάτω από το γραφικό ομώνυμο χωριό.',
      en: 'A quiet beach below the picturesque village of the same name.',
    },
  },

  // ── Villages ──
  {
    id: 'agios-nikitas',
    name: { el: 'Άγιος Νικήτας', en: 'Agios Nikitas' },
    category: 'Village',
    coords: [38.7773, 20.6024],
    description: {
      el: 'Γραφικό παραθαλάσσιο χωριό-ψαροχώρι με πεζόδρομο και ταβέρνες.',
      en: 'A picturesque seaside fishing village with a pedestrian lane and tavernas.',
    },
  },
  {
    id: 'karya',
    name: { el: 'Καρυά', en: 'Karya' },
    category: 'Village',
    coords: [38.7361, 20.6500],
    description: {
      el: 'Ορεινό χωριό φημισμένο για το παραδοσιακό κέντημα «καρσάνικο» και τη μεγάλη πλατεία του.',
      en: "A mountain village famed for its traditional 'Karsaniko' embroidery and its grand plane-tree square.",
    },
  },
  {
    id: 'englouvi',
    name: { el: 'Έγκλουβη', en: 'Englouvi' },
    category: 'Village',
    coords: [38.7064, 20.6431],
    description: {
      el: 'Ένα από τα ψηλότερα χωριά, γνωστό για τις περίφημες φακές του.',
      en: 'One of the highest villages, known for its prized lentils.',
    },
  },
  {
    id: 'sivota',
    name: { el: 'Σύβοτα', en: 'Sivota' },
    category: 'Village',
    coords: [38.6628, 20.6797],
    description: {
      el: 'Φιόρδ-όρμος με ιστιοπλοϊκά και ψαροταβέρνες στη νότια ακτή.',
      en: 'A fjord-like bay with sailing boats and fish tavernas on the south coast.',
    },
  },

  // ── Castle & landmarks ──
  {
    id: 'castle-agia-mavra',
    name: { el: 'Κάστρο Αγίας Μαύρας', en: 'Castle of Agia Mavra' },
    category: 'Castle',
    coords: [38.8378, 20.7148],
    description: {
      el: 'Φράγκικο κάστρο του 14ου αιώνα στην είσοδο της Λευκάδας, που φύλαγε το πέρασμα προς το νησί.',
      en: 'A 14th-century Frankish castle at the entrance of Lefkada, guarding the crossing to the island.',
    },
  },
  {
    id: 'entrance-bridge',
    name: { el: 'Είσοδος Λευκάδας & Πλωτή Γέφυρα', en: 'Entrance of Lefkada & Floating Bridge' },
    category: 'Landmark',
    coords: [38.8419, 20.7106],
    description: {
      el: 'Η πλωτή γέφυρα και η διώρυγα που συνδέουν τη Λευκάδα με την ηπειρωτική Ελλάδα — το εμβληματικό «κατώφλι» του νησιού.',
      en: "The floating bridge and canal connecting Lefkada to the mainland — the island's iconic threshold.",
    },
  },
  {
    id: 'ancient-lefkada',
    name: { el: 'Αρχαία Λευκάδα', en: 'Ancient Lefkada' },
    category: 'Landmark',
    coords: [38.8167, 20.7050],
    description: {
      el: 'Τα ερείπια της αρχαίας πόλης με τείχη, θέατρο και νεκρόπολη, νότια της σημερινής Χώρας.',
      en: 'Ruins of the ancient city — walls, a theatre and a necropolis — south of the modern town.',
    },
  },

  // ── Trails ──
  {
    id: 'dimosari-falls',
    name: { el: 'Καταρράκτες Δημοσάρι (Νυδρί)', en: 'Dimosari Waterfalls (Nidri)' },
    category: 'Trail',
    coords: [38.7178, 20.7250],
    description: {
      el: 'Δροσερό μονοπάτι μέσα από φαράγγι που καταλήγει στους καταρράκτες πάνω από το Νυδρί.',
      en: 'A cool gorge trail leading to the waterfalls above Nidri.',
    },
  },
  {
    id: 'stavrota-trail',
    name: { el: 'Μονοπάτι Σταυρωτά', en: 'Stavrota Trail' },
    category: 'Trail',
    coords: [38.7000, 20.6500],
    description: {
      el: 'Ορεινή διαδρομή προς την ψηλότερη κορυφή της Λευκάδας (1.182 μ.) με θέα σε όλο το νησί.',
      en: "A mountain route to Lefkada's highest peak (1,182 m) with island-wide views.",
    },
  },

  // ── Museums ──
  {
    id: 'archaeological-museum',
    name: { el: 'Αρχαιολογικό Μουσείο Λευκάδας', en: 'Archaeological Museum of Lefkada' },
    category: 'Museum',
    coords: [38.8345, 20.7028],
    description: {
      el: 'Ευρήματα από την προϊστορία έως τους ρωμαϊκούς χρόνους, με έμφαση στις ανασκαφές του Ντέρπφελντ.',
      en: 'Finds from prehistory to Roman times, highlighting the Dörpfeld excavations.',
    },
  },
  {
    id: 'phonograph-museum',
    name: { el: 'Μουσείο Φωνογράφων', en: 'Phonograph Museum' },
    category: 'Museum',
    coords: [38.8331, 20.7079],
    description: {
      el: 'Ιδιωτική συλλογή με παλιά γραμμόφωνα, δίσκους και αντικείμενα λαϊκής τέχνης στη Χώρα.',
      en: 'A private collection of old gramophones, records and folk objects in the old town.',
    },
  },

  // ── Cultural spaces (Cultural Center) ──
  {
    id: 'cc-hearn',
    name: { el: 'Ιστορικό Κέντρο Λευκάδιου Χερν', en: 'Lafcadio Hearn Historical Center' },
    category: 'CulturalSpace',
    coords: [38.8348, 20.7062],
    description: {
      el: 'Αφιερωμένο στον Λευκάδιο Χερν, τον σπουδαίο συγγραφέα με καταγωγή από τη Λευκάδα που έγινε εθνικός ποιητής της Ιαπωνίας.',
      en: 'Dedicated to Lafcadio Hearn, the Lefkada-born writer who became a national author of Japan.',
    },
    url: CC,
  },
  {
    id: 'cc-gallery',
    name: { el: 'Δημοτική Πινακοθήκη', en: 'Municipal Art Gallery' },
    category: 'CulturalSpace',
    coords: [38.8341, 20.7068],
    description: {
      el: 'Συλλογή έργων ζωγραφικής και η αίθουσα τέχνης «Θ. Στάμος» του Πνευματικού Κέντρου.',
      en: "A painting collection and the 'Th. Stamos' art hall of the Cultural Center.",
    },
    url: CC,
  },
  {
    id: 'cc-theatre',
    name: { el: 'Ανοιχτό Θέατρο Λευκάδας', en: 'Open-Air Theatre of Lefkada' },
    category: 'CulturalSpace',
    coords: [38.8352, 20.7058],
    description: {
      el: 'Υπαίθριο θέατρο δίπλα στο Πνευματικό Κέντρο, σκηνή του Διεθνούς Φεστιβάλ Φολκλόρ.',
      en: 'An open-air theatre next to the Cultural Center, home stage of the International Folklore Festival.',
    },
    url: CC,
  },
  {
    id: 'cc-library',
    name: { el: 'Χαραμόγλειος Βιβλιοθήκη', en: 'Charamoglios Library' },
    category: 'CulturalSpace',
    coords: [38.8339, 20.7073],
    description: {
      el: 'Ιστορική βιβλιοθήκη με ειδική λευκαδίτικη συλλογή και σπάνιες εκδόσεις.',
      en: 'A historic library with a special Lefkadian collection and rare editions.',
    },
    url: CC,
  },

  // ── Churches ──
  {
    id: 'faneromeni',
    name: { el: 'Μονή Παναγίας Φανερωμένης', en: 'Faneromeni Monastery' },
    category: 'Church',
    coords: [38.8281, 20.6961],
    description: {
      el: 'Το σημαντικότερο μοναστήρι του νησιού, πάνω από τη Χώρα, με πανοραμική θέα στη λιμνοθάλασσα.',
      en: "The island's most important monastery, above the town, with panoramic views over the lagoon.",
    },
  },
  {
    id: 'agios-spyridon',
    name: { el: 'Άγιος Σπυρίδων', en: 'Church of Agios Spyridon' },
    category: 'Church',
    coords: [38.8327, 20.7081],
    description: {
      el: 'Εκκλησία του 17ου αιώνα στην κεντρική πλατεία της Χώρας, με ξυλόγλυπτο τέμπλο.',
      en: 'A 17th-century church on the main square of the old town, with a carved wooden iconostasis.',
    },
  },
  {
    id: 'pantokratoras',
    name: { el: 'Ναός Παντοκράτορα', en: 'Church of Pantokrator' },
    category: 'Church',
    coords: [38.8336, 20.7066],
    description: {
      el: 'Ιστορικός ναός όπου αναπαύεται ο εθνικός ποιητής Αριστοτέλης Βαλαωρίτης.',
      en: 'A historic church where the national poet Aristotelis Valaoritis is buried.',
    },
  },
];
