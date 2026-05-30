export interface JobPosting {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType: string;
  workMode: string;
  postedAt: string;
}

export const jobsData: JobPosting[] = [
  {
    id: '1',
    title: 'Tourism Information Officer',
    company: 'Lefkada Municipality',
    description:
      'Provide tourist information, assist visitors at the info kiosk, coordinate with local tour operators, and maintain updated promotional materials in Greek and English.',
    location: 'Lefkada Town',
    employmentType: 'Full-time',
    workMode: 'On-site',
    postedAt: '3 days ago',
  },
  {
    id: '2',
    title: 'Marine Biology Researcher',
    company: 'Ionian University — Lefkada Branch',
    description:
      'Conduct field research on the Ionian Sea marine ecosystem. Analyze water samples, monitor protected species, and publish quarterly reports.',
    location: 'Nidri, Lefkada',
    employmentType: 'Contract',
    workMode: 'Hybrid',
    postedAt: '1 week ago',
  },
  {
    id: '3',
    title: 'Hotel Receptionist',
    company: 'Ionian Star Hotels',
    description:
      'Greet and check-in guests, manage reservations, answer phone inquiries, and coordinate with housekeeping. Multilingual candidates preferred.',
    location: 'Vassiliki, Lefkada',
    employmentType: 'Seasonal',
    workMode: 'On-site',
    postedAt: '1 week ago',
  },
  {
    id: '4',
    title: 'Civil Engineer — Road Projects',
    company: 'Regional Infrastructure Authority',
    description:
      'Oversee the planning and construction of road improvement projects across Lefkada. Requires 5+ years experience and a valid engineering license.',
    location: 'Lefkada Prefecture',
    employmentType: 'Full-time',
    workMode: 'On-site',
    postedAt: '2 weeks ago',
  },
  {
    id: '5',
    title: 'Primary School Teacher (Greek Language)',
    company: 'Lefkada Public Schools',
    description:
      'Teach Greek language and literature to grades 1–6 at a primary school in Lefkada town. Valid teaching certification required.',
    location: 'Lefkada Town',
    employmentType: 'Full-time',
    workMode: 'On-site',
    postedAt: '2 weeks ago',
  },
  {
    id: '6',
    title: 'Windsurfing Instructor',
    company: 'Vassiliki Watersports Center',
    description:
      'Teach beginner and intermediate windsurfing lessons in the famous Vassiliki bay. Experience required, IWO certification preferred.',
    location: 'Vassiliki, Lefkada',
    employmentType: 'Seasonal',
    workMode: 'On-site',
    postedAt: '3 weeks ago',
  },
  {
    id: '7',
    title: 'Social Worker',
    company: 'Lefkada Social Services',
    description:
      'Assist vulnerable populations including elderly, children at risk, and low-income families. Coordinate welfare programs and provide counseling services.',
    location: 'Lefkada Town',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    postedAt: '1 month ago',
  },
  {
    id: '8',
    title: 'Remote Data Entry Specialist',
    company: 'Ionian Data Solutions',
    description:
      'Enter, verify, and manage municipal records and administrative data. Strong attention to detail required. Work entirely from home.',
    location: 'Any / Remote',
    employmentType: 'Part-time',
    workMode: 'Remote',
    postedAt: '5 days ago',
  },
];
