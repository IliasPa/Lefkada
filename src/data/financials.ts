export interface FinancialItem {
  id: string;
  category: string;
  name: string;
  itemPrice: number;
  quantity: number;
  totalPrice: number;
  notes: string;
  year: number;
}

export const FINANCIAL_CATEGORIES = [
  'All',
  'Infrastructure',
  'Education',
  'Healthcare',
  'Environment',
  'Administration',
];

export const FINANCIAL_YEARS = [2022, 2023, 2024, 2025];

/** Solid chart colours per category — used by both pie and line charts */
export const CATEGORY_CHART_COLORS: Record<string, string> = {
  Infrastructure: '#3B82F6',
  Education:      '#A855F7',
  Healthcare:     '#22C55E',
  Environment:    '#06B6D4',
  Administration: '#F59E0B',
};

export const financialsData: FinancialItem[] = [
  // ── 2022 ──────────────────────────────────────────────────────────────────
  { id: '2201', year: 2022, category: 'Infrastructure',  name: 'Road Repair – Main Street',           itemPrice: 4500,  quantity: 3,  totalPrice: 13500,  notes: 'Annual road maintenance' },
  { id: '2202', year: 2022, category: 'Infrastructure',  name: 'Floating Bridge Inspection',          itemPrice: 18000, quantity: 1,  totalPrice: 18000,  notes: 'Structural safety check' },
  { id: '2203', year: 2022, category: 'Education',       name: 'School Supplies – Primary Schools',   itemPrice: 300,   quantity: 40, totalPrice: 12000,  notes: 'Classroom consumables' },
  { id: '2204', year: 2022, category: 'Education',       name: 'After-School Program Funding',        itemPrice: 7000,  quantity: 2,  totalPrice: 14000,  notes: 'Arts & STEM programs' },
  { id: '2205', year: 2022, category: 'Healthcare',      name: 'Mobile Health Unit Operation',        itemPrice: 11000, quantity: 4,  totalPrice: 44000,  notes: 'Island quarterly visits' },
  { id: '2206', year: 2022, category: 'Healthcare',      name: 'Medical Supplies – Community Clinic', itemPrice: 550,   quantity: 20, totalPrice: 11000,  notes: 'PPE and consumables' },
  { id: '2207', year: 2022, category: 'Environment',     name: 'Beach Cleaning Campaign',             itemPrice: 2000,  quantity: 5,  totalPrice: 10000,  notes: 'Seasonal beach events' },
  { id: '2208', year: 2022, category: 'Environment',     name: 'Tree Planting Initiative',            itemPrice: 40,    quantity: 400,totalPrice: 16000,  notes: 'Reforestation effort' },
  { id: '2209', year: 2022, category: 'Administration',  name: 'Municipal Software Licenses',         itemPrice: 4500,  quantity: 3,  totalPrice: 13500,  notes: 'HR and accounting suites' },
  { id: '2210', year: 2022, category: 'Administration',  name: 'Staff Training Programs',             itemPrice: 1200,  quantity: 8,  totalPrice: 9600,   notes: 'EU-funded workshops' },
  // ── 2023 ──────────────────────────────────────────────────────────────────
  { id: '2301', year: 2023, category: 'Infrastructure',  name: 'Road Repair – Main Street',           itemPrice: 5000,  quantity: 3,  totalPrice: 15000,  notes: 'Expanded resurfacing scope' },
  { id: '2302', year: 2023, category: 'Infrastructure',  name: 'Floating Bridge Maintenance',         itemPrice: 22000, quantity: 1,  totalPrice: 22000,  notes: 'Minor structural repairs' },
  { id: '2303', year: 2023, category: 'Infrastructure',  name: 'Coastal Cycling Path – Phase 1',      itemPrice: 1000,  quantity: 12, totalPrice: 12000,  notes: 'First section of cycle path' },
  { id: '2304', year: 2023, category: 'Education',       name: 'School Supplies – Primary Schools',   itemPrice: 320,   quantity: 40, totalPrice: 12800,  notes: 'Classroom consumables' },
  { id: '2305', year: 2023, category: 'Education',       name: 'Digital Classroom Equipment',         itemPrice: 3000,  quantity: 8,  totalPrice: 24000,  notes: 'Tablets and projectors' },
  { id: '2306', year: 2023, category: 'Healthcare',      name: 'Mobile Health Unit Operation',        itemPrice: 12000, quantity: 4,  totalPrice: 48000,  notes: 'Quarterly island visits' },
  { id: '2307', year: 2023, category: 'Healthcare',      name: 'Medical Supplies – Community Clinic', itemPrice: 580,   quantity: 20, totalPrice: 11600,  notes: 'PPE and consumables' },
  { id: '2308', year: 2023, category: 'Environment',     name: 'Solar Panel Study',                   itemPrice: 9000,  quantity: 1,  totalPrice: 9000,   notes: 'Feasibility study' },
  { id: '2309', year: 2023, category: 'Environment',     name: 'Beach Cleaning Campaign',             itemPrice: 2100,  quantity: 6,  totalPrice: 12600,  notes: 'Seasonal events' },
  { id: '2310', year: 2023, category: 'Administration',  name: 'Municipal Software Licenses',         itemPrice: 4600,  quantity: 3,  totalPrice: 13800,  notes: 'Annual renewal' },
  { id: '2311', year: 2023, category: 'Administration',  name: 'Office Renovation – Registry Office', itemPrice: 28000, quantity: 1,  totalPrice: 28000,  notes: 'Public-facing area refurb' },
  // ── 2024 ──────────────────────────────────────────────────────────────────
  { id: '2401', year: 2024, category: 'Infrastructure',  name: 'Road Repair – Main Street',           itemPrice: 5200,  quantity: 4,  totalPrice: 20800,  notes: 'Extended scope to north section' },
  { id: '2402', year: 2024, category: 'Infrastructure',  name: 'Floating Bridge Maintenance',         itemPrice: 23000, quantity: 1,  totalPrice: 23000,  notes: 'Full deck replacement' },
  { id: '2403', year: 2024, category: 'Infrastructure',  name: 'Coastal Cycling Path – Phase 2',      itemPrice: 1200,  quantity: 12, totalPrice: 14400,  notes: 'Second section completed' },
  { id: '2404', year: 2024, category: 'Education',       name: 'School Supplies – Primary Schools',   itemPrice: 340,   quantity: 40, totalPrice: 13600,  notes: 'Annual allocation' },
  { id: '2405', year: 2024, category: 'Education',       name: 'Digital Classroom Equipment',         itemPrice: 3100,  quantity: 10, totalPrice: 31000,  notes: 'Upgraded lab equipment' },
  { id: '2406', year: 2024, category: 'Education',       name: 'After-School Program Funding',        itemPrice: 7500,  quantity: 2,  totalPrice: 15000,  notes: 'STEM expansion' },
  { id: '2407', year: 2024, category: 'Healthcare',      name: 'Mobile Health Unit Operation',        itemPrice: 12200, quantity: 4,  totalPrice: 48800,  notes: 'Quarterly island visits' },
  { id: '2408', year: 2024, category: 'Healthcare',      name: 'Medical Supplies – Community Clinic', itemPrice: 600,   quantity: 20, totalPrice: 12000,  notes: 'PPE and consumables' },
  { id: '2409', year: 2024, category: 'Environment',     name: 'Solar Panel Installation – Town Hall',itemPrice: 18000, quantity: 1,  totalPrice: 18000,  notes: 'Green energy transition' },
  { id: '2410', year: 2024, category: 'Environment',     name: 'Beach Cleaning Campaign',             itemPrice: 2150,  quantity: 6,  totalPrice: 12900,  notes: 'Seasonal events' },
  { id: '2411', year: 2024, category: 'Environment',     name: 'Tree Planting Initiative',            itemPrice: 43,    quantity: 450,totalPrice: 19350,  notes: 'Reforestation' },
  { id: '2412', year: 2024, category: 'Administration',  name: 'Municipal Software Licenses',         itemPrice: 4700,  quantity: 3,  totalPrice: 14100,  notes: 'Annual renewal' },
  { id: '2413', year: 2024, category: 'Administration',  name: 'Staff Training Programs',             itemPrice: 1400,  quantity: 8,  totalPrice: 11200,  notes: 'EU-funded workshops' },
  // ── 2025 ──────────────────────────────────────────────────────────────────
  { id: '2501', year: 2025, category: 'Infrastructure',  name: 'Road Repair – Main Street',           itemPrice: 5000,  quantity: 3,  totalPrice: 15000,  notes: 'Scheduled maintenance' },
  { id: '2502', year: 2025, category: 'Infrastructure',  name: 'Floating Bridge Maintenance',         itemPrice: 22000, quantity: 1,  totalPrice: 22000,  notes: 'Annual inspection & repairs' },
  { id: '2503', year: 2025, category: 'Infrastructure',  name: 'Coastal Cycling Path Lighting',       itemPrice: 1200,  quantity: 24, totalPrice: 28800,  notes: 'LED poles – full 12km route' },
  { id: '2504', year: 2025, category: 'Education',       name: 'School Supplies – Primary Schools',   itemPrice: 350,   quantity: 40, totalPrice: 14000,  notes: 'Annual supply allocation' },
  { id: '2505', year: 2025, category: 'Education',       name: 'Digital Classroom Equipment',         itemPrice: 3200,  quantity: 12, totalPrice: 38400,  notes: 'Projectors and tablets' },
  { id: '2506', year: 2025, category: 'Education',       name: 'After-School Program Funding',        itemPrice: 8000,  quantity: 2,  totalPrice: 16000,  notes: 'Arts and STEM programs' },
  { id: '2507', year: 2025, category: 'Healthcare',      name: 'Mobile Health Unit Operation',        itemPrice: 12500, quantity: 4,  totalPrice: 50000,  notes: 'Quarterly island visits' },
  { id: '2508', year: 2025, category: 'Healthcare',      name: 'Medical Supplies – Community Clinic', itemPrice: 620,   quantity: 20, totalPrice: 12400,  notes: 'PPE and consumables' },
  { id: '2509', year: 2025, category: 'Environment',     name: 'Solar Panel Expansion',               itemPrice: 19000, quantity: 1,  totalPrice: 19000,  notes: 'Additional panels – library' },
  { id: '2510', year: 2025, category: 'Environment',     name: 'Beach Cleaning Campaign',             itemPrice: 2200,  quantity: 6,  totalPrice: 13200,  notes: 'Seasonal events' },
  { id: '2511', year: 2025, category: 'Environment',     name: 'Tree Planting Initiative',            itemPrice: 45,    quantity: 500,totalPrice: 22500,  notes: 'Reforestation' },
  { id: '2512', year: 2025, category: 'Administration',  name: 'Municipal Software Licenses',         itemPrice: 4800,  quantity: 3,  totalPrice: 14400,  notes: 'Annual renewal' },
  { id: '2513', year: 2025, category: 'Administration',  name: 'Office Renovation – Registry Office', itemPrice: 31000, quantity: 1,  totalPrice: 31000,  notes: 'Full refurbishment' },
  { id: '2514', year: 2025, category: 'Administration',  name: 'Staff Training Programs',             itemPrice: 1500,  quantity: 8,  totalPrice: 12000,  notes: 'EU-funded workshops' },
];
