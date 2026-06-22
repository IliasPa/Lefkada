export interface BilingualText {
  el: string;
  en: string;
}

export type NewsCategory = 'Infrastructure' | 'Tourism' | 'Events' | 'Council' | 'Environment' | 'Culture';

/** A news outlet / reporter that published the item. */
export interface Reporter {
  id: string;
  name: string;
  /** The reporter's website — opened by the reporter social button. */
  url: string;
}

export const reporters: Reporter[] = [
  { id: 'lefkada-press', name: 'Lefkada Press', url: 'https://www.lefkadapress.gr/' },
  { id: 'ionian-news',   name: 'Ionian News',   url: 'https://aftodioikisi.gr/' },
  { id: 'dimos',         name: 'Δήμος Λευκάδας', url: 'https://www.lefkada.gov.gr/' },
];

export interface NewsItem {
  id: string;
  title: BilingualText;
  description: BilingualText;
  timestamp: BilingualText;
  accentColor: string;
  category: NewsCategory;
  /** Id of the reporter (see `reporters`) that published this item. */
  reporterId: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

export const newsData: NewsItem[] = [
  {
    id: '1',
    title: {
      el: 'Αρχίζουν οι Εργασίες Ανακαίνισης της Γέφυρας Λευκάδας',
      en: 'Lefkada Bridge Renovation Project Begins',
    },
    description: {
      el: 'Ξεκίνησε επίσημα η πολυαναμενόμενη ανακαίνιση της πλωτής γέφυρας που συνδέει τη Λευκάδα με την ηπειρωτική Ελλάδα. Οι αρχές αναμένουν ολοκλήρωση σε 8 μήνες.',
      en: 'The long-awaited renovation of the floating bridge connecting Lefkada to the mainland has officially started. Authorities expect the project to be completed within 8 months.',
    },
    timestamp: { el: 'Πριν 2 ώρες', en: '2 hours ago' },
    accentColor: '#4A90D9',
    category: 'Infrastructure',
    reporterId: 'dimos',
    socialLinks: {
      instagram: 'https://www.instagram.com/explore/tags/lefkada/',
      facebook: 'https://www.facebook.com/DimosLefkadas/',
      twitter: 'https://x.com/search?q=lefkada+bridge',
    },
  },
  {
    id: '2',
    title: {
      el: 'Νέα Τουριστικά Ρεκόρ το Καλοκαίρι',
      en: 'Summer Tourism Season Sets New Records',
    },
    description: {
      el: 'Η Λευκάδα υποδέχθηκε πάνω από 500.000 επισκέπτες φέτος το καλοκαίρι, αύξηση 15% σε σχέση με πέρυσι. Το Πόρτο Κατσίκι ανακηρύχθηκε η #1 παραλία στην Ελλάδα για το 2025.',
      en: 'Lefkada welcomed over 500,000 visitors this summer season, marking a 15% increase. Porto Katsiki beach ranked #1 in Greece for 2025.',
    },
    timestamp: { el: 'Πριν 5 ώρες', en: '5 hours ago' },
    accentColor: '#27AE60',
    category: 'Tourism',
    reporterId: 'lefkada-press',
    socialLinks: {
      instagram: 'https://www.instagram.com/explore/tags/lefkada/',
      facebook: 'https://www.facebook.com/DimosLefkadas/',
    },
  },
  {
    id: '3',
    title: {
      el: 'Ανακοινώθηκε το Φεστιβάλ Θάλασσας για τον Αύγουστο',
      en: 'Local Festival of the Sea Announced for August',
    },
    description: {
      el: 'Το ετήσιο Φεστιβάλ Θάλασσας θα πραγματοποιηθεί στις 15 Αυγούστου στο λιμάνι του Νυδριού. Παραδοσιακές βαρκάδες, ζωντανή μουσική και φρέσκα θαλασσινά.',
      en: 'The annual Festival of the Sea will take place on August 15th at Nidri harbor. Traditional boat races, live music, and fresh seafood will headline the event.',
    },
    timestamp: { el: 'Χθες', en: 'Yesterday' },
    accentColor: '#E67E22',
    category: 'Events',
    reporterId: 'ionian-news',
    socialLinks: {
      instagram: 'https://www.instagram.com/explore/tags/lefkadafestival/',
      facebook: 'https://www.facebook.com/DimosLefkadas/',
      twitter: 'https://x.com/search?q=lefkada+festival',
    },
  },
  {
    id: '4',
    title: {
      el: 'Νέες Ποδηλατικές Διαδρομές στη Δυτική Ακτή',
      en: 'New Cycling Paths Open Along West Coast',
    },
    description: {
      el: 'Εγκαινιάστηκε ποδηλατική διαδρομή 12 χλμ. κατά μήκος της δυτικής ακτής, που συνδέει τον Άγιο Νικήτα με την παραλία Καθίσματα.',
      en: 'A 12km coastal cycling path has been inaugurated along the west coast, connecting Agios Nikitas to Kathisma beach for cyclists and joggers.',
    },
    timestamp: { el: 'Πριν 2 μέρες', en: '2 days ago' },
    accentColor: '#9B59B6',
    category: 'Infrastructure',
    reporterId: 'lefkada-press',
    socialLinks: {
      facebook: 'https://www.facebook.com/DimosLefkadas/',
      twitter: 'https://x.com/search?q=lefkada+cycling',
    },
  },
  {
    id: '5',
    title: {
      el: 'Το Δημοτικό Συμβούλιο Εγκρίνει Σχέδιο Πράσινης Ενέργειας',
      en: 'Municipal Council Approves Green Energy Plan',
    },
    description: {
      el: 'Το Δημοτικό Συμβούλιο Λευκάδος ψήφισε υπέρ ενός ολοκληρωμένου σχεδίου μετάβασης σε ΑΠΕ, με στόχο 80% ανανεώσιμη ενέργεια έως το 2030.',
      en: 'The Lefkada Municipal Council voted in favor of a comprehensive green energy transition plan, targeting 80% renewable energy use by 2030.',
    },
    timestamp: { el: 'Πριν 3 μέρες', en: '3 days ago' },
    accentColor: '#1ABC9C',
    category: 'Council',
    reporterId: 'dimos',
    socialLinks: {
      instagram: 'https://www.instagram.com/explore/tags/lefkadagreen/',
      facebook: 'https://www.facebook.com/DimosLefkadas/',
      twitter: 'https://x.com/search?q=lefkada+green+energy',
    },
  },
  {
    id: '6',
    title: {
      el: 'Ανοίγει Ξανά Αρχαιολογικός Χώρος κοντά στα Μεγανήσι',
      en: 'Archaeological Site Near Meganisi Reopens',
    },
    description: {
      el: 'Μετά από δύο χρόνια αποκατάστασης, οι αρχαίες ερείπιες κοντά στα Μεγανήσι ανοίγουν ξανά για το κοινό, με ξεναγήσεις τα Σαββατοκύριακα.',
      en: 'After two years of restoration, the ancient ruins near Meganisi island are once again open to the public, offering guided tours on weekends.',
    },
    timestamp: { el: 'Πριν 4 μέρες', en: '4 days ago' },
    accentColor: '#E74C3C',
    category: 'Culture',
    reporterId: 'ionian-news',
    socialLinks: {
      instagram: 'https://www.instagram.com/explore/tags/lefkadaancient/',
    },
  },
  {
    id: '7',
    title: {
      el: 'Εγκρίθηκε η Επέκταση του Αεροδρομίου Ακτίου',
      en: 'Lefkada Airport Expansion Approved',
    },
    description: {
      el: 'Δόθηκε κυβερνητική έγκριση για επέκταση του αεροδρομίου Ακτίου, που εξυπηρετεί τη Λευκάδα, με νέο τερματικό σταθμό και επιπλέον χωρητικότητα.',
      en: 'Government approval has been granted for expanding Aktion Airport, which serves Lefkada, with a new terminal wing and additional runway capacity.',
    },
    timestamp: { el: 'Πριν 5 μέρες', en: '5 days ago' },
    accentColor: '#3498DB',
    category: 'Infrastructure',
    reporterId: 'dimos',
    socialLinks: {
      facebook: 'https://www.facebook.com/DimosLefkadas/',
      twitter: 'https://x.com/search?q=lefkada+airport',
    },
  },
];
