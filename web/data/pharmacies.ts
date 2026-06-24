import type { BilingualText } from './news';

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

export const pharmaciesData: Pharmacy[] = [
  {
    id: 'p1',
    name: 'Φαρμακείο Κέντρου',
    area: { el: 'Λευκάδα, Κέντρο', en: 'Lefkada Town Centre' },
    phone: '+302645022100',
    onDuty: true,
    dutyHours: { el: 'Εφημερία έως 08:00', en: 'On duty until 08:00' },
  },
  {
    id: 'p2',
    name: 'Φαρμακείο Νυδρίου',
    area: { el: 'Νυδρί', en: 'Nidri' },
    phone: '+302645092200',
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
