import type { BilingualText } from './news';

export interface CouncilPerson {
  id: string;
  name: BilingualText;
  role: BilingualText;
  /** Short note / responsibilities, shown in-app (no external link). */
  bio?: BilingualText;
  email?: string;
  phone?: string;
}

export interface Committee {
  id: string;
  name: BilingualText;
  description: BilingualText;
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
  committees: Committee[];
  /** Shown when a past term's full composition isn't recorded in-app yet. */
  note?: BilingualText;
}

const DEPUTY = { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' };

const CURRENT_COMMITTEES: Committee[] = [
  {
    id: 'executive',
    name: { el: 'Εκτελεστική Επιτροπή', en: 'Executive Committee' },
    description: {
      el: 'Συντονιστικό όργανο της δημοτικής αρχής, αποτελούμενο από τον Δήμαρχο και τους Αντιδημάρχους· παρακολουθεί την εφαρμογή της δημοτικής πολιτικής.',
      en: 'The coordinating body of the municipal authority — the Mayor and Deputy Mayors — overseeing the implementation of municipal policy.',
    },
  },
  {
    id: 'finance',
    name: { el: 'Δημοτική (Οικονομική) Επιτροπή', en: 'Municipal (Finance) Committee' },
    description: {
      el: 'Αποφασίζει για οικονομικά θέματα, προμήθειες και διαγωνισμούς του Δήμου. Από το 2024 ενοποιεί αρμοδιότητες της Οικονομικής Επιτροπής και της Επιτροπής Ποιότητας Ζωής.',
      en: 'Decides on financial matters, procurement and tenders. Since 2024 it merges the duties of the former Finance and Quality-of-Life committees.',
    },
  },
  {
    id: 'quality-of-life',
    name: { el: 'Επιτροπή Ποιότητας Ζωής', en: 'Quality-of-Life Committee' },
    description: {
      el: 'Αρμόδια για θέματα πολεοδομίας, περιβάλλοντος, αδειοδοτήσεων και ποιότητας ζωής στις κοινότητες.',
      en: 'Responsible for town planning, environment, permits and quality of life in the communities.',
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
    endYear: 2028,
    mayor: {
      id: 'mayor-verginis',
      name: { el: 'Δρ. Ξενοφών Βεργίνης', en: 'Dr. Xenophon Verginis' },
      role: { el: 'Δήμαρχος Λευκάδας', en: 'Mayor of Lefkada' },
      bio: {
        el: 'Δήμαρχος Λευκάδας για τη θητεία 2024–2028. Προΐσταται των υπηρεσιών του Δήμου και εκπροσωπεί τον Δήμο.',
        en: 'Mayor of Lefkada for the 2024–2028 term. Heads the municipal services and represents the Municipality.',
      },
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
    committees: CURRENT_COMMITTEES,
  },
  {
    id: 'term-2019',
    startYear: 2019,
    startDate: '2019-09-01',
    endYear: 2023,
    mayor: {
      id: 'mayor-kalos',
      name: { el: 'Χαράλαμπος Καλός', en: 'Charalampos Kalos' },
      role: { el: 'Δήμαρχος Λευκάδας (2019–2023)', en: 'Mayor of Lefkada (2019–2023)' },
    },
    deputyMayors: [],
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

/** Asset declarations live on the national registry (the source of the actual
 *  documents), not on the municipality's site. */
export const ASSET_DISCLOSURES_URL = 'https://www.pothen.gr/';
