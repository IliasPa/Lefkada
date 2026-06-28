import type { BilingualText } from './news';

export type EventCategory =
  | 'Festival'
  | 'Music'
  | 'Theatre'
  | 'Sports'
  | 'Religious'
  | 'Food'
  | 'Art';

export interface CultureEvent {
  id: string;
  title: BilingualText;
  /** Start date, ISO yyyy-mm-dd. */
  date: string;
  /** Optional multi-day end date, ISO yyyy-mm-dd. */
  endDate?: string;
  /** Human time, e.g. "21:00". */
  time?: string;
  location: BilingualText;
  description: BilingualText;
  category: EventCategory;
  /** Official programme PDF, if one exists. */
  pdfUrl?: string;
  /** [lat, lng] for the shared Lefkada map. Omit for island-wide events. */
  coords?: [number, number];
}

/** Banner image per category (relevant visual for each event). */
export const EVENT_IMAGES: Record<EventCategory, string> = {
  Festival: '/events/festival.png',
  Music: '/events/music.png',
  Theatre: '/events/theatre.png',
  Sports: '/events/sports.png',
  Religious: '/events/religious.png',
  Food: '/events/food.png',
  Art: '/events/art.png',
};

export const EVENT_CATEGORIES_ORDER: EventCategory[] = [
  'Festival', 'Music', 'Theatre', 'Sports', 'Religious', 'Food', 'Art',
];

export const EVENT_ACCENT: Record<EventCategory, string> = {
  Festival: '#D64836',
  Music: '#6D44C8',
  Theatre: '#A61E34',
  Sports: '#1C96A0',
  Religious: '#C4963C',
  Food: '#E4802C',
  Art: '#BE3478',
};

export const eventsData: CultureEvent[] = [
  // ── Past (visible only in the calendar) ──
  {
    id: 'carnival-2026',
    coords: [38.8328, 20.7075],
    title: { el: 'Καρναβάλι Λευκάδας', en: 'Lefkada Carnival' },
    date: '2026-02-15',
    time: '11:00',
    location: { el: 'Κέντρο Λευκάδας', en: 'Lefkada Town Centre' },
    description: {
      el: 'Η μεγάλη καρναβαλική παρέλαση με άρματα, χορευτικά συγκροτήματα και μουσική στους δρόμους της πόλης.',
      en: 'The grand carnival parade with floats, dance troupes and music through the streets of the town.',
    },
    category: 'Festival',
  },
  {
    id: 'easter-2026',
    title: { el: 'Μεγάλη Εβδομάδα & Πάσχα', en: 'Holy Week & Easter' },
    date: '2026-04-12',
    location: { el: 'Σε όλο το νησί', en: 'Island-wide' },
    description: {
      el: 'Λιτανείες του Επιταφίου, η Ανάσταση και τα τοπικά πασχαλινά έθιμα σε χωριά και την πόλη.',
      en: 'Epitaph processions, the Resurrection service and local Easter customs across the villages and town.',
    },
    category: 'Religious',
  },
  {
    id: 'mayday-2026',
    coords: [38.8330, 20.7080],
    title: { el: 'Πρωτομαγιά — Γιορτή Λουλουδιών', en: 'May Day Flower Festival' },
    date: '2026-05-01',
    time: '10:00',
    location: { el: 'Πλατεία Αγ. Σπυρίδωνος', en: 'Agios Spyridon Square' },
    description: {
      el: 'Στεφάνια από λουλούδια, μουσική και ανοιξιάτικες δραστηριότητες για όλη την οικογένεια.',
      en: 'Flower wreaths, music and springtime activities for the whole family.',
    },
    category: 'Art',
  },
  {
    id: 'karya-folk-2026',
    coords: [38.7500, 20.6327],
    title: { el: 'Λαϊκή Βραδιά Καρυάς', en: 'Karya Folk Night' },
    date: '2026-06-20',
    time: '21:00',
    location: { el: 'Πλατεία Καρυάς', en: 'Karya Village Square' },
    description: {
      el: 'Παραδοσιακή μουσική και χοροί στο ορεινό χωριό της Καρυάς, με τοπικά εδέσματα.',
      en: 'Traditional music and dancing in the mountain village of Karya, with local food.',
    },
    category: 'Music',
  },

  // ── Upcoming (visible in both the list and the calendar) ──
  {
    id: 'vassiliki-windsurf-2026',
    coords: [38.6275, 20.6075],
    title: { el: 'Vassiliki Windsurf Open', en: 'Vassiliki Windsurf Open' },
    date: '2026-07-18',
    endDate: '2026-07-20',
    time: '09:00',
    location: { el: 'Κόλπος Βασιλικής', en: 'Vassiliki Bay' },
    description: {
      el: 'Διεθνής αγώνας windsurf στον φημισμένο για τους ανέμους κόλπο της Βασιλικής.',
      en: 'International windsurfing competition in Vassiliki bay, famous for its afternoon winds.',
    },
    category: 'Sports',
  },
  {
    id: 'speech-arts-2026',
    coords: [38.8325, 20.7070],
    title: { el: 'Γιορτές Λόγου & Τέχνης', en: 'Festival of Speech & Arts' },
    date: '2026-08-01',
    endDate: '2026-08-25',
    location: { el: 'Λευκάδα (Πόλη)', en: 'Lefkada Town' },
    description: {
      el: 'Ο θεσμός-στολίδι της Λευκάδας: θέατρο, λογοτεχνία, εικαστικά και μουσικές βραδιές για σχεδόν έναν μήνα.',
      en: "Lefkada's flagship cultural institution: theatre, literature, visual arts and music evenings across almost a month.",
    },
    category: 'Theatre',
    pdfUrl: '/docs/event-programme.pdf',
  },
  {
    id: 'sardine-2026',
    coords: [38.8189, 20.6990],
    title: { el: 'Γιορτή Σαρδέλας', en: 'Sardine Festival' },
    date: '2026-08-08',
    time: '20:00',
    location: { el: 'Καλλιγόνι', en: 'Kalligoni' },
    description: {
      el: 'Φρέσκια ψημένη σαρδέλα, τοπικό κρασί και ζωντανή μουσική δίπλα στη θάλασσα.',
      en: 'Freshly grilled sardines, local wine and live music by the sea.',
    },
    category: 'Food',
  },
  {
    id: 'faneromeni-2026',
    coords: [38.8281, 20.6961],
    title: { el: 'Πανήγυρη Παναγίας Φανερωμένης', en: 'Faneromeni Monastery Feast' },
    date: '2026-08-15',
    location: { el: 'Μονή Φανερωμένης', en: 'Faneromeni Monastery' },
    description: {
      el: 'Η μεγάλη θρησκευτική γιορτή της Κοίμησης της Θεοτόκου στο ιστορικό μοναστήρι πάνω από την πόλη.',
      en: 'The major feast of the Dormition of the Virgin at the historic monastery above the town.',
    },
    category: 'Religious',
  },
  {
    id: 'nydri-sea-2026',
    coords: [38.7036, 20.7106],
    title: { el: 'Φεστιβάλ Θάλασσας Νυδρίου', en: 'Nydri Festival of the Sea' },
    date: '2026-08-15',
    time: '19:00',
    location: { el: 'Λιμάνι Νυδρίου', en: 'Nidri Harbour' },
    description: {
      el: 'Παραδοσιακές βαρκάδες, ζωντανή μουσική και φρέσκα θαλασσινά στο λιμάνι του Νυδρίου.',
      en: 'Traditional boat races, live music and fresh seafood at Nidri harbour.',
    },
    category: 'Festival',
  },
  {
    id: 'folklore-2026',
    coords: [38.8353, 20.7043],
    title: { el: 'Διεθνές Φεστιβάλ Φολκλόρ', en: 'International Folklore Festival' },
    date: '2026-08-20',
    endDate: '2026-08-26',
    time: '21:00',
    location: { el: 'Λευκάδα (Πόλη)', en: 'Lefkada Town' },
    description: {
      el: 'Χορευτικά συγκροτήματα από όλο τον κόσμο παρουσιάζουν παραδοσιακούς χορούς — ο διασημότερος θεσμός του νησιού από το 1962.',
      en: "Dance ensembles from around the world perform traditional dances — the island's most famous institution since 1962.",
    },
    category: 'Festival',
    pdfUrl: '/docs/event-programme.pdf',
  },
  {
    id: 'christmas-2026',
    coords: [38.8329, 20.7078],
    title: { el: 'Χριστουγεννιάτικο Χωριό', en: 'Lefkada Christmas Village' },
    date: '2026-12-20',
    endDate: '2027-01-03',
    location: { el: 'Κεντρική Πλατεία', en: 'Central Square' },
    description: {
      el: 'Φωταγωγήσεις, παζάρι, εργαστήρια για παιδιά και εορταστικές εκδηλώσεις στην καρδιά της πόλης.',
      en: 'Lights, a festive market, kids workshops and holiday happenings in the heart of the town.',
    },
    category: 'Art',
  },
];
