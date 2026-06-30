import type { BilingualText } from './news';
import type { Lang } from '@/lib/i18n';

/**
 * Real municipal budget-execution data, harvested from the Municipality of
 * Lefkada's monthly/quarterly "Στατιστικά Δελτία Εκτέλεσης Προϋπολογισμού"
 * (lefkada.gov.gr ▸ Οικονομικά στοιχεία). Each report is cumulative year-to-date
 * (period 1/1 → end of that month). The figures live in /public/budgetReports.json
 * (lazy-loaded — ~300KB), parsed from the official PDFs. Scanned-only reports
 * carry no figures and are surfaced as document links.
 */

export interface BudgetLine {
  code: string;
  name: string;          // Greek (official chart-of-accounts wording)
  budgeted: number;
  // revenue columns
  assessed?: number;
  collected?: number;
  // expense columns
  committed?: number;
  invoiced?: number;
  warranted?: number;
  paid?: number;
}

export interface BudgetSide {
  budgeted: number;
  collected?: number;    // revenue: total collected
  paid?: number;         // expense: total paid
  lines: BudgetLine[];
}

export interface BudgetReport {
  id: string;
  kind: 'monthly' | 'quarterly';
  year: number;
  month?: number;        // 1-12 (cumulative through this month)
  quarter?: number;      // 1-4
  date: string | null;   // publication date
  title: string;
  pdfUrl: string;
  scanned?: boolean;     // image-only PDF → link, no parsed figures
  revenue?: BudgetSide;
  expenses?: BudgetSide;
}

// ── Lazy loader ──────────────────────────────────────────────────────────────
let _cache: BudgetReport[] | null = null;
let _promise: Promise<BudgetReport[]> | null = null;

export function loadBudgetReports(): Promise<BudgetReport[]> {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = fetch('/budgetReports.json')
    .then((r) => (r.ok ? r.json() : []))
    .then((d: BudgetReport[]) => { _cache = d; return d; })
    .catch(() => { _cache = []; return _cache; });
  return _promise;
}

// ── The full adopted 2022 budget (links only — large RTF documents) ──────────
export const annualBudgetDocs: { year: number; side: 'revenue' | 'expenses'; url: string }[] = [
  { year: 2022, side: 'expenses', url: 'https://lefkada.gov.gr/wp-content/uploads/2022/02/dapanes-proypologismoy-2022.doc' },
  { year: 2022, side: 'revenue',  url: 'https://lefkada.gov.gr/wp-content/uploads/2022/02/esoda-proypologismoy-2022.doc' },
];

// ── Chart-of-accounts (ΚΑΕ) — bilingual labels for the standard codes ────────
export const KAE_LABEL: Record<string, BilingualText> = {
  // Revenue groups
  '0':  { el: 'Τακτικά έσοδα', en: 'Regular revenue' },
  '01': { el: 'Πρόσοδοι από ακίνητη περιουσία', en: 'Income from real estate' },
  '02': { el: 'Πρόσοδοι από κινητή περιουσία', en: 'Income from movable property' },
  '03': { el: 'Έσοδα από ανταποδοτικά τέλη & δικαιώματα', en: 'Charges, fees & duties' },
  '04': { el: 'Λοιπά τέλη & παροχή υπηρεσιών', en: 'Other fees & service charges' },
  '05': { el: 'Φόροι και εισφορές', en: 'Taxes & contributions' },
  '06': { el: 'Έσοδα από επιχορηγήσεις', en: 'Grants & subsidies' },
  '07': { el: 'Λοιπά τακτικά έσοδα', en: 'Other regular revenue' },
  '1':  { el: 'Έκτακτα έσοδα', en: 'Extraordinary revenue' },
  '11': { el: 'Εκποίηση κινητής & ακίνητης περιουσίας', en: 'Asset sales' },
  '12': { el: 'Επιχορηγήσεις για λειτουργικές δαπάνες', en: 'Grants for operating costs' },
  '13': { el: 'Επιχορηγήσεις για επενδύσεις', en: 'Grants for investments' },
  '14': { el: 'Δωρεές, κληρονομιές, κληροδοσίες', en: 'Donations & bequests' },
  '15': { el: 'Προσαυξήσεις, πρόστιμα, παράβολα', en: 'Surcharges, fines & fees' },
  '16': { el: 'Λοιπά έκτακτα έσοδα', en: 'Other extraordinary revenue' },
  '2':  { el: 'Έσοδα παρελθόντων ετών (Π.Ο.Ε.)', en: 'Revenue from prior years' },
  '21': { el: 'Τακτικά έσοδα Π.Ο.Ε.', en: 'Regular revenue (prior years)' },
  '22': { el: 'Έκτακτα έσοδα Π.Ο.Ε.', en: 'Extraordinary revenue (prior years)' },
  '3':  { el: 'Εισπράξεις από δάνεια & απαιτήσεις Π.Ο.Ε.', en: 'Loans & receivables (prior years)' },
  '31': { el: 'Εισπράξεις από δάνεια', en: 'Loan proceeds' },
  '32': { el: 'Εισπρακτέα υπόλοιπα προηγ. ετών', en: 'Outstanding receivables (prior years)' },
  '4':  { el: 'Εισπράξεις υπέρ Δημοσίου & τρίτων', en: 'Collections for State & third parties' },
  '41': { el: 'Εισπράξεις υπέρ Δημοσίου & τρίτων', en: 'Collections for State & third parties' },
  '42': { el: 'Επιστροφές χρημάτων', en: 'Refunds' },
  '43': { el: 'Έσοδα προς απόδοση σε τρίτους', en: 'Funds payable to third parties' },
  '5':  { el: 'Χρηματικό υπόλοιπο προηγ. έτους', en: 'Cash balance carried over' },
  // Expense groups
  '6':  { el: 'Λειτουργικά έξοδα', en: 'Operating expenses' },
  '60': { el: 'Αμοιβές & έξοδα προσωπικού', en: 'Staff salaries & costs' },
  '61': { el: 'Αμοιβές αιρετών & τρίτων', en: 'Fees to officials & third parties' },
  '62': { el: 'Παροχές τρίτων (ΔΕΗ, νερό κ.λπ.)', en: 'Third-party services (utilities etc.)' },
  '63': { el: 'Φόροι & τέλη', en: 'Taxes & duties' },
  '64': { el: 'Λοιπά γενικά έξοδα', en: 'Other general expenses' },
  '65': { el: 'Εξυπηρέτηση δημόσιας πίστης (δάνεια)', en: 'Debt service' },
  '66': { el: 'Προμήθεια αναλωσίμων', en: 'Consumables & supplies' },
  '67': { el: 'Πληρωμές & μεταβιβάσεις σε τρίτους', en: 'Transfers & grants to third parties' },
  '68': { el: 'Λοιπά έξοδα', en: 'Other expenses' },
  '7':  { el: 'Επενδύσεις', en: 'Investments' },
  '71': { el: 'Αγορές κτιρίων & παγίων', en: 'Buildings & fixed-asset purchases' },
  '73': { el: 'Έργα', en: 'Public works & projects' },
  '74': { el: 'Μελέτες & έρευνες', en: 'Studies & research' },
  '75': { el: 'Συμμετοχές σε επιχειρήσεις', en: 'Equity participations' },
  '8':  { el: 'Πληρωμές Π.Ο.Ε., αποδόσεις & προβλέψεις', en: 'Prior-year payments & provisions' },
  '81': { el: 'Πληρωμές Π.Ο.Ε.', en: 'Prior-year payments' },
  '82': { el: 'Αποδόσεις (εισπράξεις υπέρ τρίτων)', en: 'Remittances to third parties' },
  '83': { el: 'Επιχορηγούμενες πληρωμές', en: 'Subsidised payments' },
  '85': { el: 'Προβλέψεις μη είσπραξης', en: 'Provisions for uncollectible amounts' },
  '9':  { el: 'Αποθεματικό', en: 'Reserve fund' },
};

export const KAE_COLOR: Record<string, string> = {
  '0': '#0EA5E9', '1': '#8B5CF6', '2': '#F97316', '3': '#10B981', '4': '#EAB308', '5': '#64748B',
  '6': '#3B82F6', '7': '#A855F7', '8': '#EF4444', '9': '#14B8A6',
};

const MONTHS: BilingualText[] = [
  { el: 'Ιανουάριος', en: 'January' }, { el: 'Φεβρουάριος', en: 'February' },
  { el: 'Μάρτιος', en: 'March' }, { el: 'Απρίλιος', en: 'April' },
  { el: 'Μάιος', en: 'May' }, { el: 'Ιούνιος', en: 'June' },
  { el: 'Ιούλιος', en: 'July' }, { el: 'Αύγουστος', en: 'August' },
  { el: 'Σεπτέμβριος', en: 'September' }, { el: 'Οκτώβριος', en: 'October' },
  { el: 'Νοέμβριος', en: 'November' }, { el: 'Δεκέμβριος', en: 'December' },
];

export function monthName(m: number, lang: Lang): string {
  return MONTHS[m - 1]?.[lang] ?? `${m}`;
}

const MONTHS_SHORT: BilingualText[] = [
  { el: 'Ιαν', en: 'Jan' }, { el: 'Φεβ', en: 'Feb' }, { el: 'Μάρ', en: 'Mar' }, { el: 'Απρ', en: 'Apr' },
  { el: 'Μάι', en: 'May' }, { el: 'Ιούν', en: 'Jun' }, { el: 'Ιούλ', en: 'Jul' }, { el: 'Αύγ', en: 'Aug' },
  { el: 'Σεπ', en: 'Sep' }, { el: 'Οκτ', en: 'Oct' }, { el: 'Νοέ', en: 'Nov' }, { el: 'Δεκ', en: 'Dec' },
];

export function monthShort(m: number, lang: Lang): string {
  return MONTHS_SHORT[m - 1]?.[lang] ?? `${m}`;
}

/** Compact chip label for a period (no year — the year is shown separately). */
export function periodChip(r: BudgetReport, lang: Lang): string {
  if (r.kind === 'quarterly' && r.quarter) return `${lang === 'el' ? 'Τ' : 'Q'}${r.quarter}`;
  if (r.month) return monthShort(r.month, lang);
  return `${r.year}`;
}

export function kaeLabel(code: string, greekFallback: string, lang: Lang): string {
  return KAE_LABEL[code]?.[lang] ?? greekFallback;
}

/** Short human label for a report/period. */
export function reportLabel(r: BudgetReport, lang: Lang): string {
  if (r.kind === 'quarterly' && r.quarter) return `${lang === 'el' ? 'Τρίμηνο' : 'Q'}${r.quarter} ${r.year}`;
  if (r.month) return `${monthName(r.month, lang)} ${r.year}`;
  return `${r.year}`;
}

/** Top-level category rows (single-digit codes) of a side. */
export function topCategories(side: BudgetSide): BudgetLine[] {
  return side.lines.filter((l) => l.code.length === 1);
}

/** Compact euro formatting for big municipal figures. */
export function fmtEurShort(n: number, lang: Lang): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `€${(n / 1_000_000).toLocaleString(lang === 'el' ? 'el-GR' : 'en-US', { maximumFractionDigits: 2 })}M`;
  if (abs >= 1_000) return `€${Math.round(n / 1000).toLocaleString(lang === 'el' ? 'el-GR' : 'en-US')}k`;
  return `€${Math.round(n)}`;
}

/** Full euro formatting (e.g. €12.563.660,94). */
export function fmtEur(n: number, lang: Lang): string {
  return '€' + n.toLocaleString(lang === 'el' ? 'el-GR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Execution percentage (collected/paid vs budgeted), clamped for display. */
export function execPct(actual: number, budgeted: number): number {
  if (!budgeted) return 0;
  return Math.round((actual / budgeted) * 100);
}

/** One synthetic "full year" period per year = its latest available monthly report. */
export function yearPeriods(reports: BudgetReport[]): BudgetReport[] {
  const byYear = new Map<number, BudgetReport>();
  for (const r of reports) {
    if (r.kind !== 'monthly' || !r.revenue || !r.month) continue;
    const cur = byYear.get(r.year);
    if (!cur || (cur.month ?? 0) < r.month) byYear.set(r.year, r);
  }
  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}
