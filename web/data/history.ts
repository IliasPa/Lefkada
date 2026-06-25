import type { BilingualText } from './news';

export type HistoryKind = 'History' | 'Religion';

export interface HistoryEntry {
  id: string;
  kind: HistoryKind;
  title: BilingualText;
  /** A few short paragraphs of plain-language reference text. */
  body: BilingualText;
  /** Optional external link for further reading. */
  url?: string;
}

export const HISTORY_ACCENT: Record<HistoryKind, string> = {
  History: '#B45309',
  Religion: '#C4963C',
};

/** Historical & religious references, adapted from the Municipality's
 *  "Presentation of the Municipality" section. */
export const historyData: HistoryEntry[] = [
  // ── History ──
  {
    id: 'ancient-lefkas',
    kind: 'History',
    title: { el: 'Αρχαία Λευκάδα', en: 'Ancient Lefkas' },
    body: {
      el: 'Η Λευκάδα κατοικείται από την προϊστορική εποχή. Τον 7ο αι. π.Χ. οι Κορίνθιοι ίδρυσαν αποικία και άνοιξαν διώρυγα που χώρισε το νησί από την ηπειρωτική ακτή. Ο Γερμανός αρχαιολόγος Βίλχελμ Ντέρπφελντ υποστήριξε ότι η Λευκάδα ήταν η ομηρική Ιθάκη και διεξήγαγε εκτεταμένες ανασκαφές.',
      en: 'Lefkada has been inhabited since prehistoric times. In the 7th c. BC the Corinthians founded a colony and dug a canal that separated the island from the mainland coast. The German archaeologist Wilhelm Dörpfeld argued that Lefkada was Homer’s Ithaca and carried out extensive excavations here.',
    },
  },
  {
    id: 'santa-maura',
    kind: 'History',
    title: { el: 'Φράγκοι, Βενετοί & το Κάστρο Αγίας Μαύρας', en: 'Franks, Venetians & Santa Maura Castle' },
    body: {
      el: 'Από τον 14ο αιώνα η Λευκάδα πέρασε διαδοχικά σε Φράγκους, Βενετούς και Οθωμανούς. Το Κάστρο της Αγίας Μαύρας (Santa Maura), στην είσοδο του νησιού, έδωσε για αιώνες το ιταλικό όνομα της Λευκάδας. Η Χώρα χτίστηκε με αντισεισμικά ξύλινα σπίτια και τη χαρακτηριστική λαμαρίνα.',
      en: 'From the 14th century Lefkada passed in turn to Franks, Venetians and Ottomans. The Castle of Santa Maura, at the island’s entrance, gave Lefkada its Italian name for centuries. The town was built with earthquake-resistant timber houses clad in sheet metal.',
    },
  },
  {
    id: 'cape-lefkata',
    kind: 'History',
    title: { el: 'Ακρωτήρι Λευκάτα & το «Άλμα της Σαπφώς»', en: 'Cape Lefkatas & "Sappho’s Leap"' },
    body: {
      el: 'Στο νότιο άκρο του νησιού, ο λευκός βράχος του Ακρωτηρίου Λευκάτα έδωσε στη Λευκάδα το όνομά της. Εκεί βρισκόταν ναός του Απόλλωνα, και ο μύθος θέλει την ποιήτρια Σαπφώ να πέφτει από τον γκρεμό — το θρυλικό «Άλμα της Λευκάδας».',
      en: 'At the island’s southern tip, the white cliff of Cape Lefkatas gave Lefkada its name. A temple of Apollo once stood here, and legend has the poet Sappho leaping from the cliff — the fabled "Lefkadian Leap".',
    },
  },
  {
    id: 'union-greece',
    kind: 'History',
    title: { el: 'Επτάνησα & Ένωση με την Ελλάδα', en: 'Ionian Islands & Union with Greece' },
    body: {
      el: 'Ως ένα από τα Επτάνησα, η Λευκάδα γνώρισε τη βρετανική προστασία (1815–1864) και ενώθηκε με την Ελλάδα το 1864. Η περίοδος αυτή άφησε ισχυρή πολιτιστική και μουσική παράδοση, με τις φιλαρμονικές και τις καντάδες.',
      en: 'As one of the Ionian Islands, Lefkada lived under British protection (1815–1864) and united with Greece in 1864. The era left a strong cultural and musical tradition of philharmonic bands and serenades (kantades).',
    },
  },
  {
    id: 'letters',
    kind: 'History',
    title: { el: 'Γράμματα & Τέχνες', en: 'Letters & Arts' },
    body: {
      el: 'Η Λευκάδα γέννησε σπουδαίες μορφές: τον εθνικό ποιητή Αριστοτέλη Βαλαωρίτη, τον ποιητή Άγγελο Σικελιανό, τον ιστορικό Νίκο Σβορώνο και τον ζωγράφο Θεόδωρο Στάμο. Ο Λευκάδιος Χερν, γεννημένος στη Λευκάδα, έγινε εθνικός συγγραφέας της Ιαπωνίας.',
      en: 'Lefkada produced major figures: the national poet Aristotelis Valaoritis, the poet Angelos Sikelianos, the historian Nikos Svoronos and the painter Theodoros Stamos. Lafcadio Hearn, born in Lefkada, became a national author of Japan.',
    },
  },

  // ── Religion ──
  {
    id: 'faneromeni',
    kind: 'Religion',
    title: { el: 'Μονή Παναγίας Φανερωμένης', en: 'Monastery of Panagia Faneromeni' },
    body: {
      el: 'Πάνω από τη Χώρα, η Μονή της Φανερωμένης είναι το θρησκευτικό κέντρο και η πολιούχος του νησιού. Ιδρύθηκε κατά την παράδοση στους πρώτους χριστιανικούς αιώνες, με πανοραμική θέα στη λιμνοθάλασσα και μικρό εκκλησιαστικό μουσείο.',
      en: 'Above the town, the Monastery of Faneromeni is the island’s religious heart and patron. Tradition dates its foundation to the early Christian centuries; it offers panoramic views over the lagoon and a small ecclesiastical museum.',
    },
  },
  {
    id: 'ionian-churches',
    kind: 'Religion',
    title: { el: 'Επτανησιακές Εκκλησίες & Καμπαναριά', en: 'Ionian Churches & Bell Towers' },
    body: {
      el: 'Οι εκκλησίες της Χώρας — Άγιος Σπυρίδων, Παντοκράτορας, Άγιος Μηνάς — συνδυάζουν τη βυζαντινή παράδοση με την επτανησιακή τέχνη, με ξυλόγλυπτα τέμπλα και χαμηλά, αντισεισμικά μεταλλικά καμπαναριά.',
      en: 'The town’s churches — Agios Spyridon, Pantokrator, Agios Minas — blend Byzantine tradition with Ionian art, featuring carved wooden iconostases and low, earthquake-safe metal bell towers.',
    },
  },
  {
    id: 'panigyria',
    kind: 'Religion',
    title: { el: 'Πανηγύρια & Λαϊκή Λατρεία', en: 'Festivals & Popular Devotion' },
    body: {
      el: 'Τα θρησκευτικά πανηγύρια σφραγίζουν το καλοκαίρι σε κάθε χωριό, με λειτουργίες, λιτανείες, παραδοσιακό φαγητό και γλέντι. Η γιορτή της Φανερωμένης και τα πανηγύρια στα ορεινά χωριά παραμένουν ζωντανά σημεία αναφοράς της κοινότητας.',
      en: 'Religious festivals (panigyria) mark the summer in every village, with liturgies, processions, traditional food and dancing. The feast of Faneromeni and the mountain-village festivals remain living reference points of community life.',
    },
  },
];
