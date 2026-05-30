export type ResultStatus = 'normal' | 'high' | 'low';

export interface YearlyResult {
  year: number;
  value: string;
  numericValue?: number;
  status: ResultStatus;
}

export interface HealthTestEntry {
  id: string;
  name: string;
  referenceRange: string;
  unit: string;
  yearlyResults: YearlyResult[];
}

export interface HealthCategory {
  id: string;
  label: string;
  emoji: string;
  tests: HealthTestEntry[];
}

export const healthCategories: HealthCategory[] = [
  {
    id: 'blood',
    label: 'Blood',
    emoji: '🩸',
    tests: [
      {
        id: 'b1',
        name: 'Hemoglobin',
        referenceRange: '13.5–17.5 g/dL',
        unit: 'g/dL',
        yearlyResults: [
          { year: 2022, value: '14.1', numericValue: 14.1, status: 'normal' },
          { year: 2023, value: '13.6', numericValue: 13.6, status: 'normal' },
          { year: 2024, value: '14.4', numericValue: 14.4, status: 'normal' },
          { year: 2025, value: '13.2', numericValue: 13.2, status: 'low' },
        ],
      },
      {
        id: 'b2',
        name: 'White Blood Cell Count',
        referenceRange: '4,500–11,000 /µL',
        unit: 'cells/µL',
        yearlyResults: [
          { year: 2022, value: '6,800', numericValue: 6800, status: 'normal' },
          { year: 2023, value: '7,200', numericValue: 7200, status: 'normal' },
          { year: 2024, value: '11,400', numericValue: 11400, status: 'high' },
          { year: 2025, value: '8,100', numericValue: 8100, status: 'normal' },
        ],
      },
      {
        id: 'b3',
        name: 'Platelet Count',
        referenceRange: '150,000–400,000 /µL',
        unit: 'platelets/µL',
        yearlyResults: [
          { year: 2022, value: '210,000', numericValue: 210000, status: 'normal' },
          { year: 2023, value: '195,000', numericValue: 195000, status: 'normal' },
          { year: 2024, value: '228,000', numericValue: 228000, status: 'normal' },
          { year: 2025, value: '245,000', numericValue: 245000, status: 'normal' },
        ],
      },
      {
        id: 'b4',
        name: 'Blood Glucose (Fasting)',
        referenceRange: '<100 mg/dL',
        unit: 'mg/dL',
        yearlyResults: [
          { year: 2022, value: '88', numericValue: 88, status: 'normal' },
          { year: 2023, value: '97', numericValue: 97, status: 'normal' },
          { year: 2024, value: '104', numericValue: 104, status: 'high' },
          { year: 2025, value: '99', numericValue: 99, status: 'normal' },
        ],
      },
      {
        id: 'b5',
        name: 'HbA1c',
        referenceRange: '<5.7%',
        unit: '%',
        yearlyResults: [
          { year: 2022, value: '5.2%', numericValue: 5.2, status: 'normal' },
          { year: 2023, value: '5.5%', numericValue: 5.5, status: 'normal' },
          { year: 2024, value: '6.0%', numericValue: 6.0, status: 'high' },
          { year: 2025, value: '5.8%', numericValue: 5.8, status: 'high' },
        ],
      },
    ],
  },
  {
    id: 'urine',
    label: 'Urine',
    emoji: '🧪',
    tests: [
      {
        id: 'u1',
        name: 'Urine pH',
        referenceRange: '4.5–8.0',
        unit: '',
        yearlyResults: [
          { year: 2022, value: '6.0', numericValue: 6.0, status: 'normal' },
          { year: 2023, value: '5.8', numericValue: 5.8, status: 'normal' },
          { year: 2024, value: '6.2', numericValue: 6.2, status: 'normal' },
          { year: 2025, value: '6.1', numericValue: 6.1, status: 'normal' },
        ],
      },
      {
        id: 'u2',
        name: 'Urine Protein',
        referenceRange: '<150 mg/day',
        unit: 'mg/day',
        yearlyResults: [
          { year: 2022, value: 'Negative', status: 'normal' },
          { year: 2023, value: 'Trace', status: 'normal' },
          { year: 2024, value: '+1 (mild)', status: 'high' },
          { year: 2025, value: 'Negative', status: 'normal' },
        ],
      },
      {
        id: 'u3',
        name: 'Creatinine Clearance',
        referenceRange: '88–128 mL/min',
        unit: 'mL/min',
        yearlyResults: [
          { year: 2022, value: '115', numericValue: 115, status: 'normal' },
          { year: 2023, value: '108', numericValue: 108, status: 'normal' },
          { year: 2024, value: '102', numericValue: 102, status: 'normal' },
          { year: 2025, value: '96', numericValue: 96, status: 'normal' },
        ],
      },
      {
        id: 'u4',
        name: 'Specific Gravity',
        referenceRange: '1.005–1.030',
        unit: '',
        yearlyResults: [
          { year: 2022, value: '1.018', numericValue: 1.018, status: 'normal' },
          { year: 2023, value: '1.022', numericValue: 1.022, status: 'normal' },
          { year: 2024, value: '1.028', numericValue: 1.028, status: 'normal' },
          { year: 2025, value: '1.015', numericValue: 1.015, status: 'normal' },
        ],
      },
    ],
  },
  {
    id: 'xrays',
    label: 'X-Rays',
    emoji: '🦴',
    tests: [
      {
        id: 'x1',
        name: 'Chest X-Ray Result',
        referenceRange: 'Clear / No abnormality',
        unit: '',
        yearlyResults: [
          { year: 2022, value: 'Clear', status: 'normal' },
          { year: 2023, value: 'Clear', status: 'normal' },
          { year: 2024, value: 'Mild opacity (R)', status: 'high' },
          { year: 2025, value: 'Clear', status: 'normal' },
        ],
      },
      {
        id: 'x2',
        name: 'Bone Density (T-score)',
        referenceRange: '>= -1.0 (Normal)',
        unit: 'T-score',
        yearlyResults: [
          { year: 2022, value: '-0.8', numericValue: -0.8, status: 'normal' },
          { year: 2023, value: '-1.0', numericValue: -1.0, status: 'normal' },
          { year: 2024, value: '-1.3', numericValue: -1.3, status: 'high' },
          { year: 2025, value: '-1.5', numericValue: -1.5, status: 'high' },
        ],
      },
      {
        id: 'x3',
        name: 'Spinal Curvature',
        referenceRange: 'Normal alignment',
        unit: '',
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
    label: 'Lab Tests',
    emoji: '🧬',
    tests: [
      {
        id: 't1',
        name: 'TSH (Thyroid)',
        referenceRange: '0.4–4.0 mIU/L',
        unit: 'mIU/L',
        yearlyResults: [
          { year: 2022, value: '1.8', numericValue: 1.8, status: 'normal' },
          { year: 2023, value: '2.3', numericValue: 2.3, status: 'normal' },
          { year: 2024, value: '4.5', numericValue: 4.5, status: 'high' },
          { year: 2025, value: '3.1', numericValue: 3.1, status: 'normal' },
        ],
      },
      {
        id: 't2',
        name: 'Total Cholesterol',
        referenceRange: '<200 mg/dL',
        unit: 'mg/dL',
        yearlyResults: [
          { year: 2022, value: '182', numericValue: 182, status: 'normal' },
          { year: 2023, value: '195', numericValue: 195, status: 'normal' },
          { year: 2024, value: '214', numericValue: 214, status: 'high' },
          { year: 2025, value: '201', numericValue: 201, status: 'high' },
        ],
      },
      {
        id: 't3',
        name: 'Vitamin D (25-OH)',
        referenceRange: '20–50 ng/mL',
        unit: 'ng/mL',
        yearlyResults: [
          { year: 2022, value: '32', numericValue: 32, status: 'normal' },
          { year: 2023, value: '18', numericValue: 18, status: 'low' },
          { year: 2024, value: '24', numericValue: 24, status: 'normal' },
          { year: 2025, value: '29', numericValue: 29, status: 'normal' },
        ],
      },
      {
        id: 't4',
        name: 'C-Reactive Protein',
        referenceRange: '<3.0 mg/L',
        unit: 'mg/L',
        yearlyResults: [
          { year: 2022, value: '0.8', numericValue: 0.8, status: 'normal' },
          { year: 2023, value: '1.4', numericValue: 1.4, status: 'normal' },
          { year: 2024, value: '5.2', numericValue: 5.2, status: 'high' },
          { year: 2025, value: '2.1', numericValue: 2.1, status: 'normal' },
        ],
      },
      {
        id: 't5',
        name: 'Ferritin',
        referenceRange: '12–150 ng/mL',
        unit: 'ng/mL',
        yearlyResults: [
          { year: 2022, value: '55', numericValue: 55, status: 'normal' },
          { year: 2023, value: '42', numericValue: 42, status: 'normal' },
          { year: 2024, value: '38', numericValue: 38, status: 'normal' },
          { year: 2025, value: '21', numericValue: 21, status: 'normal' },
        ],
      },
    ],
  },
];
