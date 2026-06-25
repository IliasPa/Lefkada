import type { BilingualText } from './news';

export interface CouncilPerson {
  id: string;
  name: BilingualText;
  role: BilingualText;
  /** Short note / responsibilities. The official page stays the source of truth. */
  bio?: BilingualText;
  email?: string;
  phone?: string;
  url?: string;
}

export interface Committee {
  id: string;
  name: BilingualText;
  description: BilingualText;
  url?: string;
}

/** Mayor of the Municipality of Lefkada (2023 term). */
export const mayor: CouncilPerson = {
  id: 'mayor',
  name: { el: 'Δρ. Ξενοφών Βεργίνης', en: 'Dr. Xenophon Verginis' },
  role: { el: 'Δήμαρχος Λευκάδας', en: 'Mayor of Lefkada' },
  bio: {
    el: 'Δήμαρχος Λευκάδας. Προΐσταται των υπηρεσιών του Δήμου και εκπροσωπεί τον Δήμο. Πλήρες βιογραφικό και αρμοδιότητες στην επίσημη πύλη.',
    en: 'Mayor of Lefkada. Heads the municipal services and represents the Municipality. Full biography and duties on the official portal.',
  },
  url: 'https://lefkada.gov.gr/municipality/',
};

/** Secretary General — appointment varies per term; link to the official page. */
export const secretaryGeneral: CouncilPerson = {
  id: 'secretary-general',
  name: { el: 'Γενικός Γραμματέας', en: 'Secretary General' },
  role: { el: 'Γενικός Γραμματέας Δήμου', en: 'Municipal Secretary General' },
  bio: {
    el: 'Συντονίζει τη λειτουργία των υπηρεσιών του Δήμου υπό τις οδηγίες του Δημάρχου. Το πρόσωπο που κατέχει τη θέση ανακοινώνεται στην επίσημη πύλη.',
    en: 'Coordinates the municipal services under the Mayor’s direction. The current appointee is announced on the official portal.',
  },
  url: 'https://lefkada.gov.gr/municipality/',
};

/** Deputy Mayors (Αντιδήμαρχοι) — names as published by the Municipality.
 *  Individual portfolios are not listed publicly per-person; see the official
 *  Deputy Mayors page for the appointment decisions. */
export const deputyMayors: CouncilPerson[] = [
  { id: 'dm-armatas', name: { el: 'Γεράσιμος Αρμάτας', en: 'Gerasimos Armatas' }, role: { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' } },
  { id: 'dm-gianniotis', name: { el: 'Παναγιώτης Γιαννιώτης', en: 'Panagiotis Gianniotis' }, role: { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' } },
  { id: 'dm-giannoutsos', name: { el: 'Χαράλαμπος Γιαννούτσος', en: 'Charalampos Giannoutsos' }, role: { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' } },
  { id: 'dm-katsenou', name: { el: 'Θεοδώρα Κατσενού', en: 'Theodora Katsenou' }, role: { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' } },
  { id: 'dm-konstantinidi', name: { el: 'Σεβαστή Κωνσταντινίδη', en: 'Sevasti Konstantinidi' }, role: { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' } },
  { id: 'dm-lazaris', name: { el: 'Νικόλαος Λάζαρης', en: 'Nikolaos Lazaris' }, role: { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' } },
  { id: 'dm-margeli', name: { el: 'Μαρία Μαργέλη', en: 'Maria Margeli' }, role: { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' } },
  { id: 'dm-bakogiorgos', name: { el: 'Χρήστος Μπακογιώργος', en: 'Christos Bakogiorgos' }, role: { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' } },
  { id: 'dm-skliros', name: { el: 'Φίλιππος Σκληρός', en: 'Filippos Skliros' }, role: { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' } },
  { id: 'dm-soldatos', name: { el: 'Γεώργιος Σολδάτος', en: 'Georgios Soldatos' }, role: { el: 'Αντιδήμαρχος', en: 'Deputy Mayor' } },
];

export const committees: Committee[] = [
  {
    id: 'executive',
    name: { el: 'Εκτελεστική Επιτροπή', en: 'Executive Committee' },
    description: {
      el: 'Συντονιστικό όργανο της δημοτικής αρχής, αποτελούμενο από τον Δήμαρχο και τους Αντιδημάρχους· παρακολουθεί την εφαρμογή της δημοτικής πολιτικής.',
      en: 'The coordinating body of the municipal authority — the Mayor and Deputy Mayors — overseeing the implementation of municipal policy.',
    },
    url: 'https://lefkada.gov.gr/municipality/',
  },
  {
    id: 'finance',
    name: { el: 'Δημοτική (Οικονομική) Επιτροπή', en: 'Municipal (Finance) Committee' },
    description: {
      el: 'Αποφασίζει για οικονομικά θέματα, προμήθειες και διαγωνισμούς του Δήμου. Από το 2024 ενοποιεί αρμοδιότητες της Οικονομικής Επιτροπής και της Επιτροπής Ποιότητας Ζωής.',
      en: 'Decides on financial matters, procurement and tenders. Since 2024 it merges the duties of the former Finance and Quality-of-Life committees.',
    },
    url: 'https://lefkada.gov.gr/municipality/',
  },
  {
    id: 'quality-of-life',
    name: { el: 'Επιτροπή Ποιότητας Ζωής', en: 'Quality-of-Life Committee' },
    description: {
      el: 'Αρμόδια για θέματα πολεοδομίας, περιβάλλοντος, αδειοδοτήσεων και ποιότητας ζωής στις κοινότητες.',
      en: 'Responsible for town planning, environment, permits and quality of life in the communities.',
    },
    url: 'https://lefkada.gov.gr/municipality/',
  },
];

/** Reference links surfaced as cards in the Council view. */
export const COUNCIL_LINKS = {
  councillors: 'https://lefkada.gov.gr/category/dimotiko-symvoulio/',
  deputyMayors: 'https://lefkada.gov.gr/antidimarchoi/',
  assetDisclosures: 'https://www.pothen.gr/',
  archive: 'https://lefkada.gov.gr/category/dimotiko-symvoulio/',
};
