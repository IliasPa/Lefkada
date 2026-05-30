export type ResultStatus = 'normal' | 'high' | 'low';

export interface YearlyResult {
  year: number;
  value: string;
  status: ResultStatus;
}

export interface HealthTestEntry {
  id: string;
  name: { el: string; en: string };
  referenceRange: string;
  unit: string;
  /** If set, value is chosen from a dropdown. The first option is the "normal" value. */
  selectOptions?: string[];
  yearlyResults: YearlyResult[];
}

export interface HealthCategory {
  id: string;
  label: { el: string; en: string };
  emoji: string;
  tests: HealthTestEntry[];
}

export const healthCategories: HealthCategory[] = [
  {
    id: 'blood',
    label: { el: 'Αίμα', en: 'Blood' },
    emoji: '🩸',
    tests: [
      {
        id: 'b1',
        name: { el: 'Αιμοσφαιρίνη', en: 'Hemoglobin' },
        referenceRange: '13.5–17.5 g/dL',
        unit: 'g/dL',
        yearlyResults: [
          { year: 2022, value: '14.1', status: 'normal' },
          { year: 2023, value: '13.6', status: 'normal' },
          { year: 2024, value: '14.4', status: 'normal' },
          { year: 2025, value: '13.2', status: 'low' },
        ],
      },
      {
        id: 'b2',
        name: { el: 'Λευκά Αιμοσφαίρια', en: 'White Blood Cells' },
        referenceRange: '4,500–11,000 /µL',
        unit: 'cells/µL',
        yearlyResults: [
          { year: 2022, value: '6,800', status: 'normal' },
          { year: 2023, value: '7,200', status: 'normal' },
          { year: 2024, value: '11,400', status: 'high' },
          { year: 2025, value: '8,100', status: 'normal' },
        ],
      },
      {
        id: 'b3',
        name: { el: 'Αιμοπετάλια', en: 'Platelet Count' },
        referenceRange: '150,000–400,000 /µL',
        unit: 'platelets/µL',
        yearlyResults: [
          { year: 2022, value: '210,000', status: 'normal' },
          { year: 2023, value: '195,000', status: 'normal' },
          { year: 2024, value: '228,000', status: 'normal' },
          { year: 2025, value: '245,000', status: 'normal' },
        ],
      },
      {
        id: 'b4',
        name: { el: 'Γλυκόζη Νηστείας', en: 'Blood Glucose (Fasting)' },
        referenceRange: '<100 mg/dL',
        unit: 'mg/dL',
        yearlyResults: [
          { year: 2022, value: '88', status: 'normal' },
          { year: 2023, value: '97', status: 'normal' },
          { year: 2024, value: '104', status: 'high' },
          { year: 2025, value: '99', status: 'normal' },
        ],
      },
      {
        id: 'b5',
        name: { el: 'HbA1c (Γλυκοζυλιωμένη)', en: 'HbA1c' },
        referenceRange: '<5.7%',
        unit: '%',
        yearlyResults: [
          { year: 2022, value: '5.2', status: 'normal' },
          { year: 2023, value: '5.5', status: 'normal' },
          { year: 2024, value: '6.0', status: 'high' },
          { year: 2025, value: '5.8', status: 'high' },
        ],
      },
    ],
  },
  {
    id: 'urine',
    label: { el: 'Ούρα', en: 'Urine' },
    emoji: '🧪',
    tests: [
      {
        id: 'u1',
        name: { el: 'pH Ούρων', en: 'Urine pH' },
        referenceRange: '4.5–8.0',
        unit: '',
        yearlyResults: [
          { year: 2022, value: '6.0', status: 'normal' },
          { year: 2023, value: '5.8', status: 'normal' },
          { year: 2024, value: '6.2', status: 'normal' },
          { year: 2025, value: '6.1', status: 'normal' },
        ],
      },
      {
        id: 'u2',
        name: { el: 'Πρωτεΐνη Ούρων', en: 'Urine Protein' },
        referenceRange: '<150 mg/day',
        unit: 'mg/day',
        selectOptions: ['Negative', 'Trace', '+1 (mild)', '+2 (moderate)', '+3 (severe)'],
        yearlyResults: [
          { year: 2022, value: 'Negative', status: 'normal' },
          { year: 2023, value: 'Trace', status: 'normal' },
          { year: 2024, value: '+1 (mild)', status: 'high' },
          { year: 2025, value: 'Negative', status: 'normal' },
        ],
      },
      {
        id: 'u3',
        name: { el: 'Κρεατινίνη Κάθαρσης', en: 'Creatinine Clearance' },
        referenceRange: '88–128 mL/min',
        unit: 'mL/min',
        yearlyResults: [
          { year: 2022, value: '115', status: 'normal' },
          { year: 2023, value: '108', status: 'normal' },
          { year: 2024, value: '102', status: 'normal' },
          { year: 2025, value: '96', status: 'normal' },
        ],
      },
      {
        id: 'u4',
        name: { el: 'Ειδικό Βάρος', en: 'Specific Gravity' },
        referenceRange: '1.005–1.030',
        unit: '',
        yearlyResults: [
          { year: 2022, value: '1.018', status: 'normal' },
          { year: 2023, value: '1.022', status: 'normal' },
          { year: 2024, value: '1.028', status: 'normal' },
          { year: 2025, value: '1.015', status: 'normal' },
        ],
      },
    ],
  },
  {
    id: 'xrays',
    label: { el: 'Ακτ/φίες', en: 'X-Rays' },
    emoji: '🦴',
    tests: [
      {
        id: 'x1',
        name: { el: 'Ακτινογραφία Θώρακα', en: 'Chest X-Ray' },
        referenceRange: 'Clear / No abnormality',
        unit: '',
        selectOptions: ['Clear', 'Mild opacity (R)', 'Mild opacity (L)', 'Infiltrate', 'Effusion', 'Cardiomegaly'],
        yearlyResults: [
          { year: 2022, value: 'Clear', status: 'normal' },
          { year: 2023, value: 'Clear', status: 'normal' },
          { year: 2024, value: 'Mild opacity (R)', status: 'high' },
          { year: 2025, value: 'Clear', status: 'normal' },
        ],
      },
      {
        id: 'x2',
        name: { el: 'Οστική Πυκνότητα (T-score)', en: 'Bone Density (T-score)' },
        referenceRange: '>= -1.0',
        unit: 'T-score',
        yearlyResults: [
          { year: 2022, value: '-0.8', status: 'normal' },
          { year: 2023, value: '-1.0', status: 'normal' },
          { year: 2024, value: '-1.3', status: 'high' },
          { year: 2025, value: '-1.5', status: 'high' },
        ],
      },
      {
        id: 'x3',
        name: { el: 'Σπονδυλική Στήλη', en: 'Spinal Curvature' },
        referenceRange: 'Normal alignment',
        unit: '',
        selectOptions: ['Normal', 'Mild scoliosis', 'Moderate scoliosis', 'Severe scoliosis', 'Kyphosis'],
        yearlyResults: [
          { year: 2022, value: 'Normal', status: 'normal' },
          { year: 2023, value: 'Normal', status: 'normal' },
          { year: 2024, value: 'Mild scoliosis', status: 'high' },
          { year: 2025, value: 'Mild scoliosis', status: 'high' },
        ],
      },
    ],
  },
  {
    id: 'tests',
    label: { el: 'Εξετάσεις', en: 'Lab Tests' },
    emoji: '🧬',
    tests: [
      {
        id: 't1',
        name: { el: 'TSH (Θυρεοειδής)', en: 'TSH (Thyroid)' },
        referenceRange: '0.4–4.0 mIU/L',
        unit: 'mIU/L',
        yearlyResults: [
          { year: 2022, value: '1.8', status: 'normal' },
          { year: 2023, value: '2.3', status: 'normal' },
          { year: 2024, value: '4.5', status: 'high' },
          { year: 2025, value: '3.1', status: 'normal' },
        ],
      },
      {
        id: 't2',
        name: { el: 'Ολική Χοληστερόλη', en: 'Total Cholesterol' },
        referenceRange: '<200 mg/dL',
        unit: 'mg/dL',
        yearlyResults: [
          { year: 2022, value: '182', status: 'normal' },
          { year: 2023, value: '195', status: 'normal' },
          { year: 2024, value: '214', status: 'high' },
          { year: 2025, value: '201', status: 'high' },
        ],
      },
      {
        id: 't3',
        name: { el: 'Βιταμίνη D (25-OH)', en: 'Vitamin D (25-OH)' },
        referenceRange: '20–50 ng/mL',
        unit: 'ng/mL',
        yearlyResults: [
          { year: 2022, value: '32', status: 'normal' },
          { year: 2023, value: '18', status: 'low' },
          { year: 2024, value: '24', status: 'normal' },
          { year: 2025, value: '29', status: 'normal' },
        ],
      },
      {
        id: 't4',
        name: { el: 'C-Αντιδρώσα Πρωτεΐνη (CRP)', en: 'C-Reactive Protein' },
        referenceRange: '<3.0 mg/L',
        unit: 'mg/L',
        yearlyResults: [
          { year: 2022, value: '0.8', status: 'normal' },
          { year: 2023, value: '1.4', status: 'normal' },
          { year: 2024, value: '5.2', status: 'high' },
          { year: 2025, value: '2.1', status: 'normal' },
        ],
      },
      {
        id: 't5',
        name: { el: 'Φερριτίνη', en: 'Ferritin' },
        referenceRange: '12–150 ng/mL',
        unit: 'ng/mL',
        yearlyResults: [
          { year: 2022, value: '55', status: 'normal' },
          { year: 2023, value: '42', status: 'normal' },
          { year: 2024, value: '38', status: 'normal' },
          { year: 2025, value: '21', status: 'normal' },
        ],
      },
    ],
  },
];
