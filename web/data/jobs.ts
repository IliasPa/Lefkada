import type { BilingualText } from './news';

export type EmploymentType = 'Full-time' | 'Part-time' | 'Seasonal' | 'Contract';
export type WorkMode = 'On-site' | 'Remote' | 'Hybrid';

export interface JobPosting {
  id: string;
  title: BilingualText;
  company: BilingualText;
  description: BilingualText;
  location: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  postedAt: BilingualText;
}

export const jobsData: JobPosting[] = [
  {
    id: '1',
    title: {
      el: 'Υπεύθυνος Τουριστικής Πληροφόρησης',
      en: 'Tourism Information Officer',
    },
    company: { el: 'Δήμος Λευκάδος', en: 'Lefkada Municipality' },
    description: {
      el: 'Παροχή τουριστικών πληροφοριών, εξυπηρέτηση επισκεπτών στο περίπτερο, συντονισμός με τοπικούς τουριστικούς φορείς και ενημέρωση προωθητικού υλικού στα ελληνικά και αγγλικά.',
      en: 'Provide tourist information, assist visitors at the info kiosk, coordinate with local tour operators, and maintain updated promotional materials in Greek and English.',
    },
    location: 'Λευκάδα / Lefkada Town',
    employmentType: 'Full-time',
    workMode: 'On-site',
    postedAt: { el: 'Πριν 3 μέρες', en: '3 days ago' },
  },
  {
    id: '2',
    title: {
      el: 'Ερευνητής Θαλάσσιας Βιολογίας',
      en: 'Marine Biology Researcher',
    },
    company: { el: 'Ιόνιο Πανεπιστήμιο – Παράρτημα Λευκάδας', en: 'Ionian University — Lefkada Branch' },
    description: {
      el: 'Διεξαγωγή έρευνας στο θαλάσσιο οικοσύστημα του Ιονίου. Ανάλυση δειγμάτων νερού, παρακολούθηση προστατευόμενων ειδών και δημοσίευση τριμηνιαίων αναφορών.',
      en: 'Conduct field research on the Ionian Sea marine ecosystem. Analyze water samples, monitor protected species, and publish quarterly reports.',
    },
    location: 'Νυδρί / Nidri, Lefkada',
    employmentType: 'Contract',
    workMode: 'Hybrid',
    postedAt: { el: 'Πριν 1 εβδομάδα', en: '1 week ago' },
  },
  {
    id: '3',
    title: { el: 'Ρεσεψιονίστ Ξενοδοχείου', en: 'Hotel Receptionist' },
    company: { el: 'Ξενοδοχεία Ionian Star', en: 'Ionian Star Hotels' },
    description: {
      el: 'Υποδοχή και τακτοποίηση επισκεπτών, διαχείριση κρατήσεων, απάντηση τηλεφωνικών ερωτημάτων. Προτιμώνται υποψήφιοι με γνώση πολλαπλών γλωσσών.',
      en: 'Greet and check-in guests, manage reservations, answer phone inquiries, and coordinate with housekeeping. Multilingual candidates preferred.',
    },
    location: 'Βασιλική / Vassiliki, Lefkada',
    employmentType: 'Seasonal',
    workMode: 'On-site',
    postedAt: { el: 'Πριν 1 εβδομάδα', en: '1 week ago' },
  },
  {
    id: '4',
    title: { el: 'Πολιτικός Μηχανικός – Έργα Οδοποιίας', en: 'Civil Engineer — Road Projects' },
    company: { el: 'Περιφερειακή Αρχή Υποδομών', en: 'Regional Infrastructure Authority' },
    description: {
      el: 'Επίβλεψη σχεδιασμού και κατασκευής έργων βελτίωσης δρόμων σε όλη τη Λευκάδα. Απαιτείται 5ετής εμπειρία και άδεια ασκήσεως επαγγέλματος.',
      en: 'Oversee the planning and construction of road improvement projects across Lefkada. Requires 5+ years experience and a valid engineering license.',
    },
    location: 'Νομός Λευκάδος / Lefkada Prefecture',
    employmentType: 'Full-time',
    workMode: 'On-site',
    postedAt: { el: 'Πριν 2 εβδομάδες', en: '2 weeks ago' },
  },
  {
    id: '5',
    title: { el: 'Δάσκαλος Πρωτοβάθμιας (Ελληνική Γλώσσα)', en: 'Primary School Teacher (Greek Language)' },
    company: { el: 'Δημόσια Σχολεία Λευκάδας', en: 'Lefkada Public Schools' },
    description: {
      el: 'Διδασκαλία ελληνικής γλώσσας και λογοτεχνίας στις τάξεις Α–ΣΤ σε δημοτικό σχολείο της Λευκάδας. Απαιτείται πτυχίο παιδαγωγικής.',
      en: 'Teach Greek language and literature to grades 1–6. Valid teaching certification required.',
    },
    location: 'Λευκάδα / Lefkada Town',
    employmentType: 'Full-time',
    workMode: 'On-site',
    postedAt: { el: 'Πριν 2 εβδομάδες', en: '2 weeks ago' },
  },
  {
    id: '6',
    title: { el: 'Εκπαιδευτής Windsurfing', en: 'Windsurfing Instructor' },
    company: { el: 'Κέντρο Θαλάσσιων Σπορ Βασιλικής', en: 'Vassiliki Watersports Center' },
    description: {
      el: 'Διδασκαλία μαθημάτων windsurfing αρχαρίων και προχωρημένων στη φημισμένη Βασιλική. Απαιτείται εμπειρία, προτιμάται πιστοποίηση IWO.',
      en: 'Teach beginner and intermediate windsurfing lessons in Vassiliki bay. Experience required, IWO certification preferred.',
    },
    location: 'Βασιλική / Vassiliki, Lefkada',
    employmentType: 'Seasonal',
    workMode: 'On-site',
    postedAt: { el: 'Πριν 3 εβδομάδες', en: '3 weeks ago' },
  },
  {
    id: '7',
    title: { el: 'Κοινωνικός Λειτουργός', en: 'Social Worker' },
    company: { el: 'Κοινωνικές Υπηρεσίες Λευκάδας', en: 'Lefkada Social Services' },
    description: {
      el: 'Υποστήριξη ευάλωτων πληθυσμών (ηλικιωμένοι, παιδιά σε κίνδυνο, χαμηλόεισοδηματικές οικογένειες). Συντονισμός προγραμμάτων πρόνοιας.',
      en: 'Assist vulnerable populations including elderly, children at risk, and low-income families. Coordinate welfare programs and provide counseling.',
    },
    location: 'Λευκάδα / Lefkada Town',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    postedAt: { el: 'Πριν 1 μήνα', en: '1 month ago' },
  },
  {
    id: '8',
    title: { el: 'Ειδικός Εισαγωγής Δεδομένων (Εξ Αποστάσεως)', en: 'Remote Data Entry Specialist' },
    company: { el: 'Ionian Data Solutions', en: 'Ionian Data Solutions' },
    description: {
      el: 'Εισαγωγή, επαλήθευση και διαχείριση δημοτικών αρχείων και διοικητικών δεδομένων. Απαραίτητη η ακρίβεια στις λεπτομέρειες. Πλήρης εξ αποστάσεως εργασία.',
      en: 'Enter, verify, and manage municipal records and administrative data. Strong attention to detail required. Work entirely from home.',
    },
    location: 'Εξ Αποστάσεως / Remote',
    employmentType: 'Part-time',
    workMode: 'Remote',
    postedAt: { el: 'Πριν 5 μέρες', en: '5 days ago' },
  },
];
