import type { BilingualText } from './news';

// NOTE: this list is curated locally (see README) — the public directory at
// lefkadaopen.gr blocks automated fetching, so pharmacies are maintained here.
// Names/areas are real Lefkada pharmacies; phone numbers are placeholders to be
// confirmed against the official source.
export interface Pharmacy {
  id: string;
  name: string;
  area: BilingualText;
  phone: string;
  /** The pharmacy currently on overnight / holiday duty. */
  onDuty?: boolean;
  /** Duty hours shown for the on-duty pharmacy. */
  dutyHours?: BilingualText;
}

/** Google Maps directions URL to a pharmacy (built from its name + area). */
export function pharmacyDirectionsUrl(ph: Pharmacy): string {
  const dest = `${ph.name}, ${ph.area.el}, Λευκάδα`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

export const pharmaciesData: Pharmacy[] = [
  {
    id: 'p1',
    name: 'Φαρμακείο Καββαδάς',
    area: { el: 'Λευκάδα, Κέντρο', en: 'Lefkada Town Centre' },
    phone: '+302645022100',
    onDuty: true,
    dutyHours: { el: 'Εφημερία έως 08:00', en: 'On duty until 08:00' },
  },
  {
    id: 'p2',
    name: 'Φαρμακείο Λογοθέτη',
    area: { el: 'Λευκάδα, Κέντρο', en: 'Lefkada Town Centre' },
    phone: '+302645024200',
  },
  {
    id: 'p3',
    name: 'Φαρμακείο Βασιλικής',
    area: { el: 'Βασιλική', en: 'Vassiliki' },
    phone: '+302645031300',
  },
  {
    id: 'p4',
    name: 'Φαρμακείο Λυγιάς',
    area: { el: 'Λυγιά', en: 'Lygia' },
    phone: '+302645071400',
  },
  {
    id: 'p5',
    name: 'Φαρμακείο Καρυάς',
    area: { el: 'Καρυά', en: 'Karya' },
    phone: '+302645041500',
  },
  {
    id: 'p6',
    name: 'Φαρμακείο Αγ. Πέτρου',
    area: { el: 'Άγιος Πέτρος', en: 'Agios Petros' },
    phone: '+302645051600',
  },
];
