import type { BilingualText } from './news';

export interface CouncilPerson {
  id: string;
  name: BilingualText;
  role: BilingualText;
  /** Short note / responsibilities, shown in-app (no external link). */
  bio?: BilingualText;
  email?: string;
  phone?: string;
  /** Link to this person's published Curriculum Vitae (document), if any. */
  cv?: string;
  /** Link to this person's asset declaration / πόθεν έσχες (document), if any. */
  assetUrl?: string;
}

export interface CommitteeMembers {
  president?: string;
  regular: string[];
  alternate: string[];
}

export interface Committee {
  id: string;
  name: BilingualText;
  description: BilingualText;
  /** Elected members (where published) — shown in the committee detail sheet. */
  members?: CommitteeMembers;
}

export interface CouncilTerm {
  id: string;
  /** Year the term took office — used as the tab label. */
  startYear: number;
  /** ISO yyyy-mm-dd the council took office, if known. */
  startDate?: string;
  endYear?: number;
  mayor: CouncilPerson;
  secretaryGeneral?: CouncilPerson;
  deputyMayors: CouncilPerson[];
  /** Εντεταλμένοι Σύμβουλοι — councillors delegated specific portfolios. */
  delegatedCouncillors?: CouncilPerson[];
  committees: Committee[];
  /** Επιχειρησιακό Πρόγραμμα — strategic (A') & operational (B') planning documents for the term. */
  planning?: { period: string; strategic: string; operational: string };
  /** Shown when a past term's full composition isn't recorded in-app yet. */
  note?: BilingualText;
}

const DEPUTY = { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' };
const DELEGATED = { el: 'Εντεταλμένος Σύμβουλος', en: 'Delegated Councillor' };

const CURRENT_COMMITTEES: Committee[] = [
  {
    id: 'municipal',
    name: { el: 'Δημοτική Επιτροπή', en: 'Municipal Committee' },
    description: {
      el: 'Το κύριο συλλογικό όργανο που αποφασίζει για οικονομικά θέματα, προμήθειες, διαγωνισμούς, πολεοδομία και ποιότητα ζωής. Από το 2024 ενοποιεί τις αρμοδιότητες της Οικονομικής Επιτροπής και της Επιτροπής Ποιότητας Ζωής.',
      en: 'The main collective body deciding on finances, procurement, tenders, planning and quality of life. Since 2024 it merges the duties of the former Finance and Quality-of-Life committees.',
    },
    members: {
      president: 'Δρ. Ξενοφών Βεργίνης (Δήμαρχος)',
      regular: [
        'Αρματάς Γεράσιμος', 'Βεργίνης Σπυρίδων', 'Καραγιάννης Αθανάσιος',
        'Κωνσταντινίδη Σεβαστή', 'Καλός Χαράλαμπος', 'Δρακονταειδής Κωνσταντίνος',
      ],
      alternate: [
        'Μαργέλη Μαρία', 'Σολδάτος Γεώργιος', 'Κάτσενου Θεοδώρα',
        'Σκληρός Φίλιππος', 'Λύγδας Σπυρίδων', 'Σέρβος Κωνσταντίνος',
      ],
    },
  },
  {
    id: 'executive',
    name: { el: 'Εκτελεστική Επιτροπή', en: 'Executive Committee' },
    description: {
      el: 'Συντονιστικό όργανο της δημοτικής αρχής, αποτελούμενο από τον Δήμαρχο και τους Αντιδημάρχους· παρακολουθεί την εφαρμογή της δημοτικής πολιτικής.',
      en: 'The coordinating body of the municipal authority — the Mayor and Deputy Mayors — overseeing the implementation of municipal policy.',
    },
  },
  {
    id: 'consultation',
    name: { el: 'Δημοτική Επιτροπή Διαβούλευσης', en: 'Municipal Consultation Committee' },
    description: {
      el: 'Γνωμοδοτικό όργανο με εκπροσώπους φορέων και πολιτών, για τον προϋπολογισμό, τα τεχνικά προγράμματα και τοπικά ζητήματα.',
      en: 'An advisory body with representatives of local bodies and citizens, on the budget, technical programmes and local issues.',
    },
  },
  {
    id: 'tourism',
    name: { el: 'Επιτροπή Τουριστικής Ανάπτυξης & Προβολής', en: 'Tourism Development & Promotion Committee' },
    description: {
      el: 'Επιτροπή για τον σχεδιασμό και την προβολή του τουριστικού προϊόντος της Λευκάδας.',
      en: 'A committee for planning and promoting Lefkada’s tourism.',
    },
  },
  {
    id: 'finance',
    name: { el: 'Οικονομική Επιτροπή', en: 'Finance Committee' },
    description: {
      el: 'Αποφάσιζε για οικονομικά θέματα, προμήθειες και διαγωνισμούς του Δήμου (έως την ενοποίηση του 2024 στη Δημοτική Επιτροπή).',
      en: 'Decided on the municipality’s finances, procurement and tenders (until the 2024 merger into the Municipal Committee).',
    },
  },
  {
    id: 'quality-of-life',
    name: { el: 'Επιτροπή Ποιότητας Ζωής', en: 'Quality-of-Life Committee' },
    description: {
      el: 'Αρμόδια για θέματα πολεοδομίας, περιβάλλοντος, αδειοδοτήσεων και ποιότητας ζωής (έως την ενοποίηση του 2024).',
      en: 'Responsible for planning, environment, permits and quality of life (until the 2024 merger).',
    },
  },
];

/** Council terms, newest first. The current term is fully populated; past terms
 *  list the mayor + take-office date (a full historical roster isn't recorded
 *  in-app yet). */
export const councilTerms: CouncilTerm[] = [
  {
    id: 'term-2024',
    startYear: 2024,
    startDate: '2024-01-01',
    planning: { period: '2024–2028', strategic: 'https://lefkada.gov.gr/wp-content/uploads/2025/08/epd-leykadas-2024-2028-pdf.pdf', operational: 'https://lefkada.gov.gr/wp-content/uploads/2025/08/epicheirisiako-programma-v-fasi.rar' },
    endYear: 2028,
    mayor: {
      id: 'mayor-verginis',
      name: { el: 'Δρ. Ξενοφών Βεργίνης', en: 'Dr. Xenophon Verginis' },
      role: { el: 'Δήμαρχος Λευκάδας', en: 'Mayor of Lefkada' },
      bio: {
        el: 'Δήμαρχος Λευκάδας για τη θητεία 2024–2028. Προΐσταται των υπηρεσιών του Δήμου και εκπροσωπεί τον Δήμο.',
        en: 'Mayor of Lefkada for the 2024–2028 term. Heads the municipal services and represents the Municipality.',
      },
      cv: 'https://lefkada.gov.gr/municipality/viografiko-dimarchou/',
    },
    secretaryGeneral: {
      id: 'secretary-general',
      name: { el: 'Γενικός Γραμματέας', en: 'Secretary General' },
      role: { el: 'Γενικός Γραμματέας Δήμου', en: 'Municipal Secretary General' },
      bio: {
        el: 'Συντονίζει τη λειτουργία των υπηρεσιών του Δήμου υπό τις οδηγίες του Δημάρχου.',
        en: 'Coordinates the municipal services under the Mayor’s direction.',
      },
    },
    deputyMayors: [
      { id: 'dm-armatas', name: { el: 'Γεράσιμος Αρμάτας', en: 'Gerasimos Armatas' }, role: DEPUTY },
      { id: 'dm-gianniotis', name: { el: 'Παναγιώτης Γιαννιώτης', en: 'Panagiotis Gianniotis' }, role: DEPUTY },
      { id: 'dm-giannoutsos', name: { el: 'Χαράλαμπος Γιαννούτσος', en: 'Charalampos Giannoutsos' }, role: DEPUTY },
      { id: 'dm-katsenou', name: { el: 'Θεοδώρα Κατσενού', en: 'Theodora Katsenou' }, role: DEPUTY },
      { id: 'dm-konstantinidi', name: { el: 'Σεβαστή Κωνσταντινίδη', en: 'Sevasti Konstantinidi' }, role: DEPUTY },
      { id: 'dm-lazaris', name: { el: 'Νικόλαος Λάζαρης', en: 'Nikolaos Lazaris' }, role: DEPUTY },
      { id: 'dm-margeli', name: { el: 'Μαρία Μαργέλη', en: 'Maria Margeli' }, role: DEPUTY },
      { id: 'dm-bakogiorgos', name: { el: 'Χρήστος Μπακογιώργος', en: 'Christos Bakogiorgos' }, role: DEPUTY },
      { id: 'dm-skliros', name: { el: 'Φίλιππος Σκληρός', en: 'Filippos Skliros' }, role: DEPUTY },
      { id: 'dm-soldatos', name: { el: 'Γεώργιος Σολδάτος', en: 'Georgios Soldatos' }, role: DEPUTY },
    ],
    delegatedCouncillors: [
      { id: 'ec-konidaris', name: { el: 'Κωνσταντίνος Κονιδάρης', en: 'Konstantinos Konidaris' }, role: DELEGATED },
      { id: 'ec-gantzias', name: { el: 'Ιωάννης Γαντζίας', en: 'Ioannis Gantzias' }, role: DELEGATED },
      { id: 'ec-karagiannis', name: { el: 'Αθανάσιος Καραγιάννης', en: 'Athanasios Karagiannis' }, role: DELEGATED },
      { id: 'ec-aravani', name: { el: 'Χριστίνα Αραβανή', en: 'Christina Aravani' }, role: DELEGATED },
    ],
    committees: CURRENT_COMMITTEES,
  },
  {
    id: 'term-2019',
    startYear: 2019,
    startDate: '2019-09-01',
    planning: { period: '2020–2023', strategic: 'https://lefkada.gov.gr/wp-content/uploads/2023/02/2o-paradoteo-_epich.-schediasmos-d.-leykadas_final.pdf', operational: 'https://lefkada.gov.gr/wp-content/uploads/2023/02/3o-paradoteo-_epich.-schediasmos-d.-leykadas_final.pdf' },
    endYear: 2023,
    mayor: {
      id: 'mayor-kalos',
      name: { el: 'Χαράλαμπος Καλός', en: 'Charalampos Kalos' },
      role: { el: 'Δήμαρχος Λευκάδας (2019–2023)', en: 'Mayor of Lefkada (2019–2023)' },
      assetUrl: 'https://lefkada.gov.gr/wp-content/uploads/2021/10/kalos_charalampos_1803000_2020-2.pdf',
    },
    deputyMayors: [
      // Only the officials whose asset declaration (πόθεν έσχες) is published for this term.
      { id: 'dm-lygdas-2019', name: { el: 'Σπυρίδων Λύγδας', en: 'Spyridon Lygdas' }, role: DEPUTY, assetUrl: 'https://lefkada.gov.gr/wp-content/uploads/2021/10/perioysiaki-katastasi-ligdas-spyros.pdf' },
    ],
    committees: [],
    note: {
      el: 'Πλήρης σύνθεση Δημοτικού Συμβουλίου και επιτροπών για τη θητεία αυτή δεν έχει καταχωρηθεί ακόμη στην εφαρμογή.',
      en: 'The full council and committee composition for this term is not yet recorded in the app.',
    },
  },
  {
    id: 'term-2014',
    startYear: 2014,
    startDate: '2014-09-01',
    endYear: 2019,
    mayor: {
      id: 'mayor-drakontaidis',
      name: { el: 'Κωνσταντίνος Δρακονταειδής', en: 'Konstantinos Drakontaidis' },
      role: { el: 'Δήμαρχος Λευκάδας (2014–2019)', en: 'Mayor of Lefkada (2014–2019)' },
    },
    deputyMayors: [],
    committees: [],
    note: {
      el: 'Πλήρης σύνθεση Δημοτικού Συμβουλίου και επιτροπών για τη θητεία αυτή δεν έχει καταχωρηθεί ακόμη στην εφαρμογή.',
      en: 'The full council and committee composition for this term is not yet recorded in the app.',
    },
  },
  {
    id: 'term-2011',
    startYear: 2011,
    startDate: '2011-01-01',
    endYear: 2014,
    mayor: {
      id: 'mayor-aravanis',
      name: { el: 'Κωνσταντίνος Αραβανής', en: 'Konstantinos Aravanis' },
      role: { el: 'Δήμαρχος Λευκάδας (2011–2014)', en: 'Mayor of Lefkada (2011–2014)' },
      bio: {
        el: 'Πρώτος Δήμαρχος του ενιαίου Δήμου Λευκάδας μετά τη μεταρρύθμιση «Καλλικράτης».',
        en: 'The first Mayor of the unified Municipality of Lefkada after the "Kallikratis" reform.',
      },
    },
    deputyMayors: [],
    committees: [],
    note: {
      el: 'Πλήρης σύνθεση Δημοτικού Συμβουλίου και επιτροπών για τη θητεία αυτή δεν έχει καταχωρηθεί ακόμη στην εφαρμογή.',
      en: 'The full council and committee composition for this term is not yet recorded in the app.',
    },
  },
];

/** The official decision (document) appointing the current Deputy Mayors. */
export const DEPUTY_ASSIGNMENT_DECISION =
  'https://lefkada.gov.gr/wp-content/uploads/2026/04/8321-26-98fpoli-itha.pdf';

/** The official decision (document) appointing the current Delegated Councillors. */
export const DELEGATED_ASSIGNMENT_DECISION =
  'https://lefkada.gov.gr/wp-content/uploads/2026/01/rp42oli-d0m.pdf';

// ── City Council (Δημοτικό Συμβούλιο) composition ────────────────────────────
export interface CityCouncil {
  president: string;
  vicePresident: string;
  secretary: string;
  councillors: string[];
}

export const cityCouncil: CityCouncil = {
  president: 'Σκλαβενίτης Ευστάθιος',
  vicePresident: 'Μπελεγρίνος Σπυρίδων',
  secretary: 'Θερμός Ευάγγελος',
  councillors: [
    'Καραγιάννης Αθανάσιος', 'Σκληρός Φίλιππος', 'Κάτσενου Θεοδώρα', 'Βεργίνης Σπυρίδων',
    'Μαργέλη Μαρία', 'Μπακογιώργος Χρήστος', 'Κονιδάρης Κωνσταντίνος', 'Αρματάς Γεράσιμος',
    'Λάζαρης Αρίστος', 'Γαντζίας Ιωάννης', 'Κωνσταντινίδη Σεβαστή', 'Σολδάτος Γεώργιος',
    'Λάζαρης Νικόλαος', 'Αραβανή Χριστίνα', 'Γιαννιώτης Παναγιώτης', 'Γιαννούτσος Χαράλαμπος',
    'Καλός Χαράλαμπος', 'Λύγδας Σπυρίδων', 'Τσιρογιάννης Γεώργιος', 'Πεντεσπίτης Νικόλαος',
    'Γαζής Γεώργιος', 'Αργυρός Νικόλαος', 'Δρακονταειδής Κωνσταντίνος', 'Σέρβος Κωνσταντίνος',
    'Βερροιώτης Ευάγγελος', 'Βεροιώτης Αλέξανδρος',
  ],
};

// ── Organisational tree (δομή του Δήμου) ─────────────────────────────────────
export interface OrgNode {
  name: BilingualText;
  children?: OrgNode[];
}

const n = (el: string, en: string, children?: OrgNode[]): OrgNode => ({ name: { el, en }, children });

export const orgTree: OrgNode[] = [
  n('Υπηρεσίες υπαγόμενες στον Δήμαρχο', 'Services under the Mayor', [
    n('Ιδιαίτερο Γραφείο Δημάρχου', "Mayor's Private Office"),
    n('Αυτοτελές Γραφείο Επικοινωνίας και Δημοσίων Σχέσεων', 'Communication & Public Relations Office'),
    n('Νομική Υπηρεσία', 'Legal Service'),
    n('Αυτοτελές Γραφείο Εσωτερικού Ελέγχου', 'Internal Audit Office'),
    n('Αυτοτελές Γραφείο Διαφάνειας', 'Transparency Office'),
    n('Αυτοτελές Γραφείο Διοικητικής Βοήθειας', 'Administrative Assistance Office'),
    n('Αυτοτελές Τμήμα Δημοτικής Αστυνομίας', 'Municipal Police Department', [
      n('Γραφείο Επιχειρησιακού Σχεδιασμού', 'Operational Planning Office'),
      n('Γραφείο Αστυνόμευσης', 'Policing Office'),
    ]),
  ]),
  n('Αυτοτελές Τμήμα Προγραμματισμού, Οργάνωσης και Πληροφορικής', 'Planning, Organization & IT Department', [
    n('Γραφείο Προγραμματισμού, Ανάπτυξης και Οργάνωσης', 'Planning, Development & Organization Office'),
    n('Γραφείο Τεχνολογιών Πληροφορικής και Επικοινωνιών', 'IT & Communications Office'),
  ]),
  n('Αυτοτελές Τμήμα Τοπικής Οικονομικής Ανάπτυξης', 'Local Economic Development Department', [
    n('Γραφείο Αγροτικής Παραγωγής', 'Agricultural Production Office'),
    n('Γραφείο Αλιείας', 'Fisheries Office'),
    n('Γραφείο Αδειοδοτήσεων και Ρύθμισης Εμπορικών Δραστηριοτήτων', 'Licensing & Commercial Activities Office'),
    n('Γραφείο Φυσικών Πόρων, Ενέργειας και Βιομηχανίας', 'Natural Resources, Energy & Industry Office'),
    n('Γραφείο Απασχόλησης και Τουρισμού', 'Employment & Tourism Office'),
  ]),
  n('Διεύθυνση Πολεοδομίας και Περιβάλλοντος', 'Directorate of Urban Planning & Environment', [
    n('Τμήμα Πολεοδομίας', 'Urban Planning Department'),
    n('Τμήμα Πολεοδομικών Εφαρμογών', 'Urban Planning Applications Department'),
    n('Τμήμα Περιβάλλοντος και Πολιτικής Προστασίας', 'Environment & Civil Protection Department'),
    n('Τμήμα Καθαριότητας, Ανακύκλωσης και Συντήρησης Πρασίνου', 'Cleanliness, Recycling & Green Maintenance Department'),
  ]),
  n('Αυτοτελές Τμήμα Κοινωνικής Προστασίας, Παιδείας και Πολιτισμού', 'Social Protection, Education & Culture Department', [
    n('Γραφείο Κοινωνικής Πολιτικής και Ισότητας των Φύλων', 'Social Policy & Gender Equality Office'),
    n('Γραφείο Προστασίας και Προαγωγής της Δημόσιας Υγείας', 'Public Health Office'),
    n('Γραφείο Παιδείας, Διά Βίου Μάθησης και Πολιτισμού', 'Education, Lifelong Learning & Culture Office'),
  ]),
  n('Διεύθυνση Διοικητικών Υπηρεσιών', 'Directorate of Administrative Services', [
    n('Τμήμα Υποστήριξης Πολιτικών Οργάνων', 'Political Bodies Support Department'),
    n('Τμήμα Δημοτικής Κατάστασης, Ληξιαρχείου και Μετανάστευσης', 'Registry, Records & Migration Department'),
    n('Τμήμα Ανθρώπινου Δυναμικού', 'Human Resources Department'),
    n('Τμήμα Διοικητικής Μέριμνας', 'Administrative Care Department'),
  ]),
  n('Διεύθυνση Οικονομικών Υπηρεσιών', 'Directorate of Financial Services', [
    n('Τμήμα Προϋπολογισμού, Λογιστηρίου και Προμηθειών', 'Budget, Accounting & Procurement Department'),
    n('Τμήμα Εσόδων, Περιουσίας και Ταμείου', 'Revenue, Property & Treasury Department'),
  ]),
  n('Διεύθυνση Τεχνικών Υπηρεσιών', 'Directorate of Technical Services', [
    n('Τμήμα Τεχνικών Έργων', 'Technical Works Department'),
    n('Τμήμα Ηλεκτρομηχανολογικών Έργων και Συγκοινωνιών', 'Electromechanical Works & Transport Department'),
    n('Τμήμα Διαχείρισης και Συντήρησης Οχημάτων', 'Vehicle Management & Maintenance Department'),
    n('Τμήμα Ύδρευσης και Αποχέτευσης', 'Water Supply & Sewerage Department'),
  ]),
  n('Διεύθυνση ΚΕΠ', 'Directorate of Citizen Service Centres (KEP)', [
    n('Τμήμα Εξυπηρέτησης Πολιτών', 'Citizen Service Department'),
    n('Τμήμα Εσωτερικής Ανταπόκρισης', 'Internal Correspondence Department'),
    n('Τμήμα Αποκεντρωμένων Υπηρεσιών', 'Decentralized Services Department'),
  ]),
];
