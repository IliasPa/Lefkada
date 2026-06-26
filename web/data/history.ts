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


// ── Full official historical reference text (lefkada.gov.gr/istorikes-anafores). ──
export interface HistoricalReference { image: string; title: BilingualText; paragraphs: BilingualText[]; }
export const historicalReferences: HistoricalReference = {
  image: 'https://lefkada.gov.gr/wp-content/uploads/2021/10/dimos-leykadas-kastro-agias-mayras.jpg',
  title: { el: 'Ιστορικές Αναφορές', en: 'Historical References' },
  paragraphs: [
  { el: 'Το κάστρο της Αγίας Μαύρας , που δεσπόζει στην είσοδο του νησιού είναι ένα από τα πιο επιβλητικά μεσαιωνικά κτίσματα στην Ελλάδα και αποτελεί πρότυπο οχυρωματικής τέχνης εκείνης της εποχής. Χτίστηκε γύρω στα 1300 από τον Φράγκο ηγεμόνα Ιωάννη Ορσίνι, όταν πήρε τη Λευκάδα ως προίκα για το γάμο του με την κόρη του Δεσπότη της Ηπείρου Νικηφόρου του Α’.', en: 'The castle of Agia Maura , which dominates the entrance of the island, is one of the most imposing medieval buildings in Greece and is a model of fortification art of that era. It was built around 1300 by the Frankish ruler John Orsini, when he took Lefkada as a dowry for his marriage to the daughter of the Despot of Epirus, Nikiforos I.' },
  { el: 'Το κάστρο προστάτευε την πρωτεύουσα του νησιού και αποτελούσε τη σημαντικότερη αμυντική του θωράκιση απέναντι τους πειρατές και τους άλλους εχθρούς, από την πρώτη δεκαετία του 14ου αιώνα ως το 1684. Το 1479 κατελήφθη από τους Τούρκους που έχτισαν μια μεγάλη τοξωτή γέφυρα, με 360 καμάρες, που διέσχιζε τη λιμνοθάλασσα από την παραλία έως τη θέση Καλκάνη, στηρίζοντας τους σωλήνες ενός υδραγωγείου που έφερνε νερό στο κάστρο. Το έργο αυτό, που χαρακτήριζε ολόκληρη την περιοχή, καταστράφηκε από τους σεισμούς. Κάποια ίχνη του σώζονται σήμερα μέσα στη λιμνοθάλασσα.', en: 'The castle protected the capital of the island and was its most important defensive shield against pirates and other enemies from the first decade of the 14th century until 1684. In 1479 it was occupied by the Turks, who built a large arched bridge with 360 arches that crossed the lagoon from the beach to the Kalkani site, supporting the pipes of an aqueduct that brought water to the castle. This project, which characterised the entire area, was destroyed by the earthquakes. Some traces of it are still preserved today in the lagoon.' },
  { el: 'Σήμερα γίνονται από το Υπουργείο Πολιτισμού και Τουρισμού έργα αποκατάστασης και ανάδειξης του εσωτερικού του χώρου. Επί τουρκοκρατίας στη Λευκάδα, στον εσωτερικό χώρο του φρουρίου, βρίσκονταν η πόλη της Αγίας Μαύρας που ήταν πρωτεύουσα του νησιού της Λευκάδας.', en: 'Today, the Ministry of Culture and Tourism is carrying out restoration and enhancement works of the interior of the site. During the Turkish occupation in Lefkada, in the inner area of the fortress, there was the town of Agia Maura, which was the capital of the island of Lefkada.' },
  { el: 'Νήρικος: Δύο χιλιόμετρα έξω και ανατολικά από την πόλη, περνώντας μέσα από τον ελαιώνα, ο επισκέπτης φτάνει στο Καλλιγόνι. Η περιοχή έχει κηρυχθεί ως αρχαιολογικός χώρος – αφού εδώ βρισκόταν η αρχαία πόλη της Λευκάδας, που ονομαζόταν Νήρικος – και εκτείνεται στις περιοχές Τσεχλιμπούς, Καλλιγονίου, Καρυωτών, Λυγιάς, του Δήμου Λευκάδας.', en: 'Nericus: Two kilometers outside and east of the town, passing through the olive grove, the visitor reaches Kalligoni. The area has been declared an archaeological site - since this is where the ancient city of Lefkada, called Nirikos, was located - and extends to the areas of Tsechlimpos, Kalligoni, Karyotes, Lygia, of the Municipality of Lefkada.' },
  { el: 'Ο αρχαιολογικός αυτός χώρος περιλαμβάνει τα ερείπια του περιτειχισμένου οικισμού της Αρχαίας Λευκάδας, που χρονολογούνται από τα αρχαϊκά έως τα Ρωμαϊκά χρόνια, τα δύο νεκροταφεία της αρχαίας πόλης που εντοπίστηκαν στην ίδια περιοχή, μεμονωμένα μνημεία και διάσπαρτα οικοδομικά λείψανα όπως τάφους, αγροικίες και λιμενικές εγκαταστάσεις που αποτελούν – σύμφωνα με τις σχετικές αποφάσεις – αναπόσπαστο τμήμα του προστατευμένου μνημειακού συνόλου της αρχαίας πόλης που εγκαταλείφθηκε γύρω στα 1300, ενώ στη συνέχεια οι συνεχείς σεισμοί σκόρπισαν τα ίχνη της.', en: 'This archaeological site includes the ruins of the walled settlement of Ancient Lefkada, dating from Archaic to Roman times, the two cemeteries of the ancient city that were found in the same area, individual monuments and scattered building remains such as tombs, farmhouses and port facilities which, according to the relevant decisions, form an integral part of the protected monumental complex of the ancient city, which was abandoned around 1300 and subsequently scattered by the continuous earthquakes.' },
  { el: 'Η Νήρικος είναι η μακροβιότερη πρωτεύουσα του νησιού της Λευκάδας μέχρι και το 1300 μ.Χ. Έχει διανύσει μια αξιόλογη ιστορική πορεία. Από τα βάθη της αρχαιότητας ως «Νήρικος» αργότερα επί Κορινθίων ως «Νήρικος – Λευκάς» και επιβίωσε ως την ύστερη βυζαντινή εποχή με την ονομασία «Κάστρο».', en: 'Nirikos is the longest living capital of the island of Lefkada until 1300 AD. It has gone through a remarkable historical course. From the depths of antiquity as «Nirikos» later under the Corinthians as «Nirikos - Lefkas» and survived until the late Byzantine era under the name «Kastro».' },
  { el: 'Η ιστορία της διακόπτεται από τους Φράγκους οι οποίοι μεταφέρουν την πρωτεύουσα του νησιού μέσα στο φρούριο της Αγίας Μαύρας το οποίο ανεγείρουν οι ίδιοι, ενώ το 1684 οι Ενετοί ορίζουν ως πρωτεύουσα μια νέα θέση, αυτή, στην οποία βρίσκεται ΣΗΜΕΡΑ και όπου τότε ονομαζόταν Αμαξική.', en: 'Its history was interrupted by the Franks who moved the capital of the island to the fortress of Agia Mavra which they built themselves, while in 1684 the Venetians designated a new location as the capital, the one where it is today and where it was then called Amaxiki.' },
  ],
};
