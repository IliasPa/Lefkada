import type { BilingualText } from './news';

export type PlaceCategory =
  | 'Beach'
  | 'Village'
  | 'Trail'
  | 'Museum'
  | 'CulturalSpace'
  | 'Library'
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
  'Library',
  'Church',
];

export const PLACE_IMAGES: Record<PlaceCategory, string> = {
  Beach: '/backgrounds/lefkada-3-cove.png',
  Village: '/backgrounds/lefkada-1-ionian.png',
  Trail: '/events/sports.png',
  Museum: '/events/art.png',
  CulturalSpace: '/events/theatre.png',
  Library: '/events/art.png',
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
  Library: '#2563EB',
  Church: '#C4963C',
  Castle: '#B45309',
  Landmark: '#E4802C',
};

export const placesData: Place[] = [
  // ── Beaches ──
  {
    id: 'porto-katsiki',
    name: { el: 'Πόρτο Κατσίκι', en: 'Porto Katsiki' },
    category: 'Beach',
    coords: [38.6009, 20.5505],
    description: {
      el: 'Η πιο διάσημη παραλία της Λευκάδας, με τον επιβλητικό λευκό βράχο και τα τιρκουάζ νερά στη δυτική ακτή.',
      en: "Lefkada's most famous beach — a dramatic white cliff over turquoise water on the west coast.",
    },
  },
  {
    id: 'egremni',
    name: { el: 'Εγκρεμνοί', en: 'Egremni' },
    category: 'Beach',
    coords: [38.6362, 20.5584],
    description: {
      el: 'Εκτεταμένη παραλία με βότσαλο και κρυστάλλινα νερά, κάτω από απόκρημνους βράχους.',
      en: 'A long pebble beach with crystal water beneath steep cliffs.',
    },
  },
  {
    id: 'kathisma',
    name: { el: 'Κάθισμα', en: 'Kathisma' },
    category: 'Beach',
    coords: [38.7762, 20.6001],
    description: {
      el: 'Οργανωμένη αμμώδης παραλία, δημοφιλής για ηλιοβασίλεμα και θαλάσσια σπορ.',
      en: 'An organised sandy beach, popular for sunsets and watersports.',
    },
  },
  {
    id: 'kalamitsi',
    name: { el: 'Καλαμίτσι', en: 'Kalamitsi' },
    category: 'Beach',
    coords: [38.7571, 20.6042],
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
    coords: [38.7852, 20.6172],
    description: {
      el: 'Γραφικό παραθαλάσσιο χωριό-ψαροχώρι με πεζόδρομο και ταβέρνες.',
      en: 'A picturesque seaside fishing village with a pedestrian lane and tavernas.',
    },
  },
  {
    id: 'karya',
    name: { el: 'Καρυά', en: 'Karya' },
    category: 'Village',
    coords: [38.7500, 20.6327],
    description: {
      el: 'Ορεινό χωριό φημισμένο για το παραδοσιακό κέντημα «καρσάνικο» και τη μεγάλη πλατεία του.',
      en: "A mountain village famed for its traditional 'Karsaniko' embroidery and its grand plane-tree square.",
    },
  },
  {
    id: 'englouvi',
    name: { el: 'Έγκλουβη', en: 'Englouvi' },
    category: 'Village',
    coords: [38.7235, 20.6303],
    description: {
      el: 'Ένα από τα ψηλότερα χωριά, γνωστό για τις περίφημες φακές του.',
      en: 'One of the highest villages, known for its prized lentils.',
    },
  },
  {
    id: 'sivota',
    name: { el: 'Σύβοτα', en: 'Sivota' },
    category: 'Village',
    coords: [38.6220, 20.6837],
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
    coords: [38.8345, 20.7095],
    description: {
      el: 'Φράγκικο κάστρο του 14ου αιώνα στην είσοδο της Λευκάδας, που φύλαγε το πέρασμα προς το νησί.',
      en: 'A 14th-century Frankish castle at the entrance of Lefkada, guarding the crossing to the island.',
    },
  },
  {
    id: 'entrance-bridge',
    name: { el: 'Είσοδος Λευκάδας & Πλωτή Γέφυρα', en: 'Entrance of Lefkada & Floating Bridge' },
    category: 'Landmark',
    coords: [38.8398, 20.7090],
    description: {
      el: 'Η πλωτή γέφυρα και η διώρυγα που συνδέουν τη Λευκάδα με την ηπειρωτική Ελλάδα — το εμβληματικό «κατώφλι» του νησιού.',
      en: "The floating bridge and canal connecting Lefkada to the mainland — the island's iconic threshold.",
    },
  },
  {
    id: 'ancient-lefkada',
    name: { el: 'Αρχαία Λευκάδα', en: 'Ancient Lefkada' },
    category: 'Landmark',
    coords: [38.8170, 20.7010],
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
    coords: [38.7170, 20.7220],
    description: {
      el: 'Δροσερό μονοπάτι μέσα από φαράγγι που καταλήγει στους καταρράκτες πάνω από το Νυδρί.',
      en: 'A cool gorge trail leading to the waterfalls above Nidri.',
    },
  },
  {
    id: 'stavrota-trail',
    name: { el: 'Μονοπάτι Σταυρωτά', en: 'Stavrota Trail' },
    category: 'Trail',
    coords: [38.6790, 20.6280],
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
    coords: [38.8350, 20.7040],
    description: {
      el: 'Ευρήματα από την προϊστορία έως τους ρωμαϊκούς χρόνους, με έμφαση στις ανασκαφές του Ντέρπφελντ.',
      en: 'Finds from prehistory to Roman times, highlighting the Dörpfeld excavations.',
    },
  },
  {
    id: 'phonograph-museum',
    name: { el: 'Μουσείο Φωνογράφων', en: 'Phonograph Museum' },
    category: 'Museum',
    coords: [38.8320, 20.7080],
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
    coords: [38.8336, 20.7052],
    description: {
      el: 'Αφιερωμένο στον Λευκάδιο Χερν, τον σπουδαίο συγγραφέα με καταγωγή από τη Λευκάδα που έγινε εθνικός ποιητής της Ιαπωνίας.',
      en: 'Dedicated to Lafcadio Hearn, the Lefkada-born writer who became a national author of Japan.',
    },
    url: 'https://lefkasculturalcenter.gr/en/lafcadio-hearn-history-center/',
  },
  {
    id: 'cc-gallery',
    name: { el: 'Δημοτική Πινακοθήκη', en: 'Municipal Art Gallery' },
    category: 'CulturalSpace',
    coords: [38.8332, 20.7048],
    description: {
      el: 'Συλλογή έργων ζωγραφικής και η αίθουσα τέχνης «Θ. Στάμος» του Πνευματικού Κέντρου.',
      en: "A painting collection and the 'Th. Stamos' art hall of the Cultural Center.",
    },
    url: 'https://lefkasculturalcenter.gr/venue/lefkadiaki-dimotiki-pinakothiki/',
  },
  {
    id: 'cc-theatre',
    name: { el: 'Ανοιχτό Θέατρο Λευκάδας', en: 'Open-Air Theatre of Lefkada' },
    category: 'CulturalSpace',
    coords: [38.8340, 20.7045],
    description: {
      el: 'Υπαίθριο θέατρο δίπλα στο Πνευματικό Κέντρο, σκηνή του Διεθνούς Φεστιβάλ Φολκλόρ.',
      en: 'An open-air theatre next to the Cultural Center, home stage of the International Folklore Festival.',
    },
    url: 'https://lefkasculturalcenter.gr/en/venue/open-lefkada-theatre/',
  },
  {
    id: 'cc-takis-efstathiou',
    name: { el: 'Αίθουσα «Τάκης Ευσταθίου»', en: '"Takis Efstathiou" Hall' },
    category: 'CulturalSpace',
    coords: [38.8334, 20.7050],
    description: {
      el: 'Αίθουσα εκθέσεων και εκδηλώσεων του Πνευματικού Κέντρου, αφιερωμένη στον δωρητή Τάκη Ευσταθίου.',
      en: 'An exhibition and events hall of the Cultural Center, named after the benefactor Takis Efstathiou.',
    },
    url: 'https://lefkasculturalcenter.gr/ethousa-taki-efstathiou/',
  },
  {
    id: 'cc-conference-hall',
    name: { el: 'Αίθουσα Συνεδρίων', en: 'Conference Hall' },
    category: 'CulturalSpace',
    coords: [38.8338, 20.7047],
    description: {
      el: 'Η κεντρική αίθουσα συνεδρίων του Πνευματικού Κέντρου, για ομιλίες, ημερίδες και προβολές.',
      en: 'The main conference hall of the Cultural Center, hosting talks, symposia and screenings.',
    },
    url: 'https://lefkasculturalcenter.gr/venue/ethousa-synedrion/',
  },
  {
    id: 'cc-foyer',
    name: { el: 'Φουαγιέ', en: 'Foyer' },
    category: 'CulturalSpace',
    coords: [38.8337, 20.7049],
    description: {
      el: 'Ο χώρος υποδοχής του Πνευματικού Κέντρου, που φιλοξενεί μικρές εκθέσεις και εκδηλώσεις.',
      en: 'The reception space of the Cultural Center, hosting small exhibitions and events.',
    },
    url: 'https://lefkasculturalcenter.gr/venue/fouagie/',
  },
  {
    id: 'cc-stamos-hall',
    name: { el: 'Αίθουσα Τέχνης «Θεόδωρος Στάμος»', en: '"Theodoros Stamos" Art Hall' },
    category: 'CulturalSpace',
    coords: [38.8331, 20.7046],
    description: {
      el: 'Αίθουσα τέχνης αφιερωμένη στον λευκάδιο ζωγράφο Θεόδωρο Στάμο, σημαντικό εκπρόσωπο του αφηρημένου εξπρεσιονισμού.',
      en: 'An art hall dedicated to Lefkadian-descended painter Theodoros Stamos, a key abstract-expressionist figure.',
    },
    url: 'https://lefkasculturalcenter.gr/venue/ethousa-technis-theodorou-stamos/',
  },
  {
    id: 'cc-ex-libris',
    name: { el: 'Έκθεση Ex Libris', en: 'Ex Libris Exhibition' },
    category: 'CulturalSpace',
    coords: [38.8333, 20.7053],
    description: {
      el: 'Μόνιμη έκθεση χαρακτικών «Ex Libris» (βιβλιόσημα) από καλλιτέχνες απ’ όλο τον κόσμο.',
      en: 'A permanent "Ex Libris" (bookplate) print exhibition with works by artists from around the world.',
    },
    url: 'https://lefkasculturalcenter.gr/ekthesi-ex-libris/',
  },

  // ── Museums ──
  {
    id: 'museum-kavalos-folklore',
    name: { el: 'Λαογραφικό Μουσείο Καβάλου', en: 'Folklore Museum of Kavalos' },
    category: 'Museum',
    coords: [38.7958, 20.6720],
    description: {
      el: 'Λαογραφική συλλογή στο χωριό Κάβαλος, με αντικείμενα της αγροτικής και οικιακής ζωής της Λευκάδας.',
      en: 'A folklore collection in the village of Kavalos, with objects from Lefkada’s rural and domestic life.',
    },
    url: 'https://lefkasculturalcenter.gr/laografiko-mousio-kavalou/',
  },
  {
    id: 'museum-dff-memorabilia',
    name: { el: 'Μουσείο Ενθυμημάτων Δ.Φ.Φ.', en: 'I.F.F. Memorabilia Museum' },
    category: 'Museum',
    coords: [38.8335, 20.7044],
    description: {
      el: 'Μουσείο ενθυμημάτων του Διεθνούς Φεστιβάλ Φολκλόρ Λευκάδας, με δώρα και κειμήλια από συμμετέχουσες αποστολές.',
      en: 'Memorabilia museum of Lefkada’s International Folklore Festival, with gifts and keepsakes from visiting delegations.',
    },
    url: 'https://lefkasculturalcenter.gr/mousio-enthymimaton-dff/',
  },

  // ── Libraries ──
  {
    id: 'cc-library',
    name: { el: 'Χαραμόγλειος Βιβλιοθήκη', en: 'Charamoglios Library' },
    category: 'Library',
    coords: [38.8330, 20.7058],
    description: {
      el: 'Ιστορική βιβλιοθήκη με ειδική λευκαδίτικη συλλογή και σπάνιες εκδόσεις.',
      en: 'A historic library with a special Lefkadian collection and rare editions.',
    },
    url: 'https://lefkasculturalcenter.gr/',
  },
  {
    id: 'cc-svoronos-library',
    name: { el: 'Βιβλιοθήκη Νίκου Σβορώνου', en: 'Nikos Svoronos Library' },
    category: 'Library',
    coords: [38.8336, 20.7051],
    description: {
      el: 'Βιβλιοθήκη αφιερωμένη στον λευκάδιο ιστορικό Νίκο Σβορώνο, με ιστορικές και επιστημονικές εκδόσεις.',
      en: 'A library dedicated to the Lefkadian historian Nikos Svoronos, holding historical and scholarly editions.',
    },
    url: 'https://lefkasculturalcenter.gr/vivliothiki-nikou-svoronou/',
  },

  // ── Churches ──
  {
    id: 'faneromeni',
    name: { el: 'Μονή Παναγίας Φανερωμένης', en: 'Faneromeni Monastery' },
    category: 'Church',
    coords: [38.8290, 20.6960],
    description: {
      el: 'Το σημαντικότερο μοναστήρι του νησιού, πάνω από τη Χώρα, με πανοραμική θέα στη λιμνοθάλασσα.',
      en: "The island's most important monastery, above the town, with panoramic views over the lagoon.",
    },
  },
  {
    id: 'agios-spyridon',
    name: { el: 'Άγιος Σπυρίδων', en: 'Church of Agios Spyridon' },
    category: 'Church',
    coords: [38.8318, 20.7082],
    description: {
      el: 'Εκκλησία του 17ου αιώνα στην κεντρική πλατεία της Χώρας, με ξυλόγλυπτο τέμπλο.',
      en: 'A 17th-century church on the main square of the old town, with a carved wooden iconostasis.',
    },
  },
  {
    id: 'pantokratoras',
    name: { el: 'Ναός Παντοκράτορα', en: 'Church of Pantokrator' },
    category: 'Church',
    coords: [38.8324, 20.7064],
    description: {
      el: 'Ιστορικός ναός όπου αναπαύεται ο εθνικός ποιητής Αριστοτέλης Βαλαωρίτης.',
      en: 'A historic church where the national poet Aristotelis Valaoritis is buried.',
    },
  },
];
