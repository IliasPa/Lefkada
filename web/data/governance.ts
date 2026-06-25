import type { BilingualText } from './news';

export type GovType = 'Decision' | 'Tender' | 'Announcement' | 'Meeting';

export interface GovItem {
  id: string;
  type: GovType;
  title: BilingualText;
  /** Plain-language summary; the PDF stays the source of truth. */
  summary: BilingualText;
  /** Publication date (or meeting date), ISO yyyy-mm-dd. */
  date: string;
  pdfUrl?: string;

  // Tender-specific
  deadline?: string;        // ISO — drives the countdown
  jobId?: string;           // links to a posting in the Jobs tab

  // Meeting-specific
  time?: string;
  youtubeId?: string;       // recorded session
  agendaPdf?: string;
  minutesPdf?: string;
}

export const GOV_ACCENT: Record<GovType, string> = {
  Decision: '#0D5EAF',
  Tender: '#E4802C',
  Announcement: '#6D44C8',
  Meeting: '#16A34A',
};

export const GOV_TYPES: GovType[] = ['Decision', 'Tender', 'Announcement', 'Meeting'];

export const governanceData: GovItem[] = [
  // ── Decisions ──
  {
    id: 'dec-budget-2026',
    type: 'Decision',
    title: {
      el: 'Έγκριση Προϋπολογισμού Δήμου 2026',
      en: 'Approval of the 2026 Municipal Budget',
    },
    summary: {
      el: 'Το Δημοτικό Συμβούλιο ενέκρινε τον προϋπολογισμό του 2026, με έμφαση σε υποδομές, καθαριότητα και πράσινη ενέργεια.',
      en: 'The Council approved the 2026 budget, prioritising infrastructure, cleaning services and green energy.',
    },
    date: '2026-06-10',
    pdfUrl: '/docs/poll-bridge-2025.pdf',
  },
  {
    id: 'dec-cycling-lighting',
    type: 'Decision',
    title: {
      el: 'Φωτισμός Παραλιακής Ποδηλατικής Διαδρομής',
      en: 'Lighting of the Coastal Cycling Path',
    },
    summary: {
      el: 'Εγκρίθηκε η τοποθέτηση φωτισμού LED σε όλο το μήκος της παραλιακής ποδηλατικής διαδρομής 12 χλμ.',
      en: 'Approved LED lighting along the full 12 km of the coastal cycling path.',
    },
    date: '2026-05-20',
    pdfUrl: '/docs/poll-bridge-2025.pdf',
  },

  // ── Tenders ──
  {
    id: 'tender-lifeguards',
    type: 'Tender',
    title: {
      el: 'Διαγωνισμός Ναυαγοσωστικής Κάλυψης Παραλιών',
      en: 'Tender for Beach Lifeguard Services',
    },
    summary: {
      el: 'Πρόσκληση για ναυαγοσωστική κάλυψη των πολυσύχναστων παραλιών για τη θερινή περίοδο. Δημιουργεί εποχικές θέσεις εργασίας.',
      en: 'Call for lifeguard coverage of busy beaches for the summer season. Creates seasonal job openings.',
    },
    date: '2026-06-18',
    deadline: '2026-07-05',
    pdfUrl: '/docs/event-programme.pdf',
    jobId: 'gov-lifeguard',
  },
  {
    id: 'tender-school-renovation',
    type: 'Tender',
    title: {
      el: 'Διαγωνισμός Ανακαίνισης Δημοτικού Σχολείου',
      en: 'Tender for Primary School Renovation',
    },
    summary: {
      el: 'Έργο ενεργειακής αναβάθμισης και ανακαίνισης σχολικού κτηρίου στη Χώρα.',
      en: 'Energy-upgrade and renovation works for a school building in the town.',
    },
    date: '2026-06-12',
    deadline: '2026-07-22',
    pdfUrl: '/docs/event-programme.pdf',
  },

  // ── Announcements ──
  {
    id: 'ann-tax-deadline',
    type: 'Announcement',
    title: {
      el: 'Παράταση Πληρωμής Δημοτικών Τελών',
      en: 'Municipal Fees Payment Deadline Extended',
    },
    summary: {
      el: 'Η προθεσμία πληρωμής των δημοτικών τελών παρατείνεται έως το τέλος Ιουλίου, χωρίς προσαυξήσεις.',
      en: 'The deadline for paying municipal fees is extended to the end of July, with no surcharges.',
    },
    date: '2026-06-20',
  },
  {
    id: 'ann-recycling',
    type: 'Announcement',
    title: {
      el: 'Νέο Πρόγραμμα Ανακύκλωσης Τεσσάρων Ρευμάτων',
      en: 'New Four-Stream Recycling Programme',
    },
    summary: {
      el: 'Ξεκινά σταδιακά το πρόγραμμα ανακύκλωσης χαρτιού, γυαλιού, πλαστικού και οργανικών, αρχής γενομένης από τη Χώρα.',
      en: 'A paper/glass/plastic/organics recycling programme rolls out gradually, starting from the town.',
    },
    date: '2026-06-15',
    pdfUrl: '/docs/poll-bridge-2025.pdf',
  },

  // ── Meetings (their own thread, not in the cultural calendar) ──
  {
    id: 'meeting-2026-07',
    type: 'Meeting',
    title: {
      el: 'Συνεδρίαση Δημοτικού Συμβουλίου — Ιούλιος',
      en: 'Municipal Council Session — July',
    },
    summary: {
      el: 'Τακτική συνεδρίαση: προϋπολογισμός, τουριστική προβολή, αιτήματα τοπικών κοινοτήτων.',
      en: 'Regular session: budget, tourism promotion, requests from local communities.',
    },
    date: '2026-07-02',
    time: '18:00',
    agendaPdf: '/docs/event-programme.pdf',
  },
  {
    id: 'meeting-2026-06',
    type: 'Meeting',
    title: {
      el: 'Συνεδρίαση Δημοτικού Συμβουλίου — Ιούνιος',
      en: 'Municipal Council Session — June',
    },
    summary: {
      el: 'Εγκρίθηκε ο προϋπολογισμός 2026 και το σχέδιο φωτισμού της ποδηλατικής διαδρομής. Διαθέσιμη η βιντεοσκόπηση και τα πρακτικά.',
      en: 'Approved the 2026 budget and the cycling-path lighting plan. Recording and minutes available.',
    },
    date: '2026-06-04',
    time: '18:00',
    youtubeId: 'aqz-KE-bpKQ',
    minutesPdf: '/docs/poll-bridge-2025.pdf',
  },

  // ── Real council-session invitations (category "Δημοτικό Συμβούλιο") ──
  {
    id: 'ds-2026-03-02',
    type: 'Meeting',
    title: {
      el: 'Πρόσκληση σε τακτική συνεδρίαση Δημοτικού Συμβουλίου',
      en: 'Invitation to a regular Municipal Council session',
    },
    summary: {
      el: 'Τακτική δημόσια συνεδρίαση του Δημοτικού Συμβουλίου Λευκάδας, με τα θέματα της ημερήσιας διάταξης.',
      en: 'Regular public session of the Lefkada Municipal Council, with the items on the agenda.',
    },
    date: '2026-03-02',
  },
  {
    id: 'ds-2026-02-26',
    type: 'Meeting',
    title: {
      el: 'Ειδική Συνεδρίαση Λογοδοσίας της Δημοτικής Αρχής',
      en: 'Special Accountability Session of the Municipal Authority',
    },
    summary: {
      el: 'Ειδική συνεδρίαση λογοδοσίας της δημοτικής αρχής για το διμηνιαίο διάστημα, ανοιχτή σε ερωτήσεις πολιτών.',
      en: 'Special accountability session of the municipal authority for the two-month period, open to citizen questions.',
    },
    date: '2026-02-26',
  },
  {
    id: 'ds-2026-02-20',
    type: 'Meeting',
    title: {
      el: 'Δημόσια, ειδική, δια ζώσης συνεδρίαση Δημοτικού Συμβουλίου',
      en: 'Public special in-person Municipal Council session',
    },
    summary: {
      el: 'Δημόσια ειδική δια ζώσης συνεδρίαση του Δημοτικού Συμβουλίου.',
      en: 'A public special in-person session of the Municipal Council.',
    },
    date: '2026-02-20',
  },
];
