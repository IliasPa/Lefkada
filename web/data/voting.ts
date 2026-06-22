import type { BilingualText } from './news';

export interface PollOption {
  id: string;
  text: BilingualText;
}

export interface Poll {
  id: string;
  title: BilingualText;
  options: PollOption[];
  explanations: { short: BilingualText; medium: BilingualText; full: BilingualText };
  seedVotes: Record<string, number>;
  /** ISO date string — when the poll closes. Drives the countdown / "ended" label. */
  endDate: string;
  /** YouTube video id shown between the poll info and the ballot. */
  youtubeId?: string;
  /** URL of the official PDF document for this poll. */
  pdfUrl?: string;
}

export const pollsData: Poll[] = [
  {
    id: 'poll_bridge_2025',
    title: {
      el: 'Πρέπει η Λευκάδα να κατασκευάσει μόνιμη οδική γέφυρα;',
      en: 'Should Lefkada build a permanent road bridge?',
    },
    options: [
      {
        id: 'a',
        text: {
          el: 'Ναι – μόνιμη γέφυρα απαραίτητη για την ανάπτυξη',
          en: 'Yes – a permanent bridge is necessary for development',
        },
      },
      {
        id: 'b',
        text: {
          el: 'Όχι – η υπάρχουσα πλωτή γέφυρα επαρκεί',
          en: 'No – the floating bridge is sufficient',
        },
      },
      {
        id: 'c',
        text: {
          el: 'Αναποφάσιστος/η – χρειάζομαι περισσότερες πληροφορίες',
          en: 'Undecided – need more information',
        },
      },
      {
        id: 'd',
        text: {
          el: 'Ναι, αλλά μόνο με ευρωπαϊκή χρηματοδότηση',
          en: 'Yes, but only if funded by the EU',
        },
      },
    ],
    seedVotes: { a: 342, b: 178, c: 89, d: 267 },
    endDate: '2026-06-24T20:00:00',
    youtubeId: 'aqz-KE-bpKQ',
    pdfUrl: '/docs/poll-bridge-2025.pdf',
    explanations: {
      short: {
        el: 'Η Λευκάδα συζητά αν πρέπει να αντικαταστήσει την εμβληματική πλωτή γέφυρα με μία μόνιμη. Αυτό θα μείωνε τις καθυστερήσεις αλλά θα άλλαζε την ταυτότητα του νησιού.',
        en: 'Lefkada is debating whether to replace its iconic floating bridge with a permanent one. This would reduce delays but would alter the island\'s identity.',
      },
      medium: {
        el: `**Το ζήτημα**

Η Λευκάδα είναι τεχνικά χερσόνησος και διαχωρίζεται από την ηπειρωτική Ελλάδα από ένα στενό κανάλι. Το ερώτημα είναι αν πρέπει να αντικαταστήσει την πλωτή γέφυρα με μια μόνιμη κατασκευή.

**Γιατί σημαίνει**

Μια μόνιμη γέφυρα θα μείωνε τις καθυστερήσεις και θα στήριζε την οικονομική ανάπτυξη, αλλά θα άλλαζε μόνιμα το τοπίο και την ταυτότητα της Λευκάδας, καθώς η πλωτή γέφυρα είναι σημαντικό τουριστικό και πολιτιστικό σύμβολο.

**Συμπέρασμα**

Αυτή η απόφαση απαιτεί ισορροπία ανάμεσα στην οικονομική ανάπτυξη και τη διατήρηση της πολιτιστικής κληρονομιάς.`,
        en: `**The Issue**

Lefkada is technically a peninsula separated from mainland Greece by a narrow canal. The question is whether to replace the floating bridge with a permanent structure.

**Why It Matters**

A permanent bridge would reduce delays and support economic development, but would permanently alter the landscape and Lefkada's identity, since the floating bridge is an important tourist and cultural symbol.

**Conclusion**

This decision requires balancing economic development with preservation of cultural heritage.`,
      },
      full: {
        el: `**Σχετικά με αυτή την Ψηφοφορία**

Το ερώτημα για την κατασκευή μόνιμης οδικής γέφυρας που θα αντικαταστήσει την εμβληματική πλωτή γέφυρα της Λευκάδας συζητείται εδώ και δεκαετίες.

**Ιστορικό**

Η Λευκάδα, σε αντίθεση με τα περισσότερα ελληνικά νησιά, είναι τεχνικά χερσόνησος που χωρίζεται από την ηπειρωτική Ελλάδα από ένα στενό κανάλι που έσκαψαν οι αρχαίοι Κορίνθιοι γύρω στο 640 π.Χ. Αυτό σημαίνει ότι μια μόνιμη οδική σύνδεση είναι τεχνικά εφικτή.

**Επιχειρήματα υπέρ**

- Μείωση καθυστερήσεων από ανοίγματα της πλωτής γέφυρας για θαλάσσια κυκλοφορία
- Στήριξη οικονομικής ανάπτυξης και τουρισμού
- Βελτίωση πρόσβασης έκτακτων υπηρεσιών
- Μείωση κόστους συντήρησης μακροπρόθεσμα

**Επιχειρήματα κατά**

- Η πλωτή γέφυρα αποτελεί μέρος της ταυτότητας και τουριστικής έλξης της Λευκάδας
- Μόνιμη κατασκευή θα άλλαζε το τοπίο μόνιμα
- Περιβαλλοντικές επιπτώσεις στο οικοσύστημα της λιμνοθάλασσας
- Απαιτείται ευρωπαϊκή χρηματοδότηση λόγω του υψηλού κόστους`,
        en: `**About This Vote**

The question of whether Lefkada should replace its iconic floating bridge with a permanent road bridge has been debated for decades.

**Background**

Lefkada, unlike most Greek islands, is technically a peninsula separated from the mainland by a narrow canal dug by the ancient Corinthians around 640 BC. This unique geography means that a permanent road connection is technically feasible.

**Arguments For a Permanent Bridge**

- Reduce travel delays caused by bridge openings for marine traffic
- Support economic development and tourism
- Improve emergency services access
- Reduce maintenance costs over the long term

**Arguments Against**

- The floating bridge is part of Lefkada's identity and tourist attraction
- A permanent structure would alter the landscape permanently
- Environmental impact risks to the lagoon ecosystem
- EU funding would be required given the substantial cost`,
      },
    },
  },

  // ── Older / closed polls (shown via "Show older votings") ──────────────────
  {
    id: 'poll_marina_2026',
    title: {
      el: 'Να επεκταθεί η μαρίνα του Νυδριού;',
      en: 'Should the Nidri marina be expanded?',
    },
    options: [
      { id: 'a', text: { el: 'Ναι – περισσότερες θέσεις ελλιμενισμού', en: 'Yes – more berths are needed' } },
      { id: 'b', text: { el: 'Όχι – προτεραιότητα στο περιβάλλον', en: 'No – prioritise the environment' } },
      { id: 'c', text: { el: 'Μόνο με μελέτη περιβαλλοντικών επιπτώσεων', en: 'Only with an environmental impact study' } },
    ],
    seedVotes: { a: 421, b: 233, c: 388 },
    endDate: '2026-05-10T20:00:00',
    youtubeId: 'aqz-KE-bpKQ',
    pdfUrl: '/docs/poll-bridge-2025.pdf',
    explanations: {
      short: {
        el: 'Η ψηφοφορία αφορούσε την επέκταση της μαρίνας του Νυδριού για περισσότερα σκάφη, σε ισορροπία με την προστασία του κόλπου.',
        en: 'This vote concerned expanding the Nidri marina to host more boats, balanced against protecting the bay.',
      },
      medium: {
        el: 'Η επέκταση της μαρίνας θα αύξανε τα έσοδα από τον θαλάσσιο τουρισμό, αλλά εγείρει ερωτήματα για την πίεση στο οικοσύστημα του κόλπου.',
        en: 'Expanding the marina would boost marine-tourism revenue but raises concerns about pressure on the bay ecosystem.',
      },
      full: {
        el: '**Σχετικά**\n\nΗ μαρίνα του Νυδριού λειτουργεί στα όριά της τους καλοκαιρινούς μήνες. Η ψηφοφορία εξέτασε αν η επέκταση είναι βιώσιμη.',
        en: '**About**\n\nThe Nidri marina operates at capacity during the summer. This vote examined whether expansion is sustainable.',
      },
    },
  },
  {
    id: 'poll_recycling_2026',
    title: {
      el: 'Να εφαρμοστεί υποχρεωτική ανακύκλωση τεσσάρων ρευμάτων;',
      en: 'Should mandatory four-stream recycling be introduced?',
    },
    options: [
      { id: 'a', text: { el: 'Ναι – άμεσα σε όλο τον δήμο', en: 'Yes – municipality-wide immediately' } },
      { id: 'b', text: { el: 'Σταδιακά, ξεκινώντας από τη Χώρα', en: 'Gradually, starting from Lefkada town' } },
      { id: 'c', text: { el: 'Όχι – το υπάρχον σύστημα επαρκεί', en: 'No – the current system is sufficient' } },
    ],
    seedVotes: { a: 612, b: 344, c: 121 },
    endDate: '2026-04-01T18:00:00',
    pdfUrl: '/docs/poll-bridge-2025.pdf',
    explanations: {
      short: {
        el: 'Η ψηφοφορία αφορούσε την εισαγωγή υποχρεωτικής ανακύκλωσης τεσσάρων ρευμάτων στον Δήμο Λευκάδος.',
        en: 'This vote concerned introducing mandatory four-stream recycling across the Municipality of Lefkada.',
      },
      medium: {
        el: 'Η υποχρεωτική ανακύκλωση θα μείωνε τα απορρίμματα στις χωματερές, αλλά απαιτεί επένδυση σε κάδους και ενημέρωση των πολιτών.',
        en: 'Mandatory recycling would cut landfill waste but requires investment in bins and citizen education.',
      },
      full: {
        el: '**Σχετικά**\n\nΟ Δήμος εξέτασε την καθιέρωση τεσσάρων ξεχωριστών ρευμάτων ανακύκλωσης για χαρτί, γυαλί, πλαστικό και οργανικά.',
        en: '**About**\n\nThe Municipality considered establishing four separate recycling streams for paper, glass, plastic and organics.',
      },
    },
  },
];
