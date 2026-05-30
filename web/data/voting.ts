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
];
