export interface HealthCard {
  id: string;
  title: string;
  content: string;
  category: string;
  color: string;
}

export const healthData: HealthCard[] = [
  {
    id: '1',
    title: 'Lefkada General Hospital – Emergency Hours',
    content:
      'The emergency department at Lefkada General Hospital operates 24/7. For non-urgent cases, outpatient appointments are available Monday–Friday, 8:00–14:00. Call 26450-25371 for appointments.',
    category: 'Hospital',
    color: '#FF6B6B',
  },
  {
    id: '2',
    title: 'Summer Heat Wave Advisory',
    content:
      'During peak summer months (July–August), residents and visitors are advised to stay hydrated, avoid outdoor activities between 12:00–17:00, and use sunscreen with SPF 50+. Cooling stations are open at the Municipal Center.',
    category: 'Advisory',
    color: '#FFA500',
  },
  {
    id: '3',
    title: 'Free Vaccination Campaign – Spring 2026',
    content:
      'The Lefkada Health Center is offering free flu and pneumonia vaccinations for residents over 60 and at-risk groups. Registration opens March 20th at the health center or via telephone.',
    category: 'Vaccination',
    color: '#4CAF50',
  },
  {
    id: '4',
    title: 'Mental Health Support Line',
    content:
      'A free and confidential mental health support line is now available for Lefkada residents. Call 10306 (toll-free) Monday–Friday, 10:00–22:00. Staffed by certified psychologists.',
    category: 'Mental Health',
    color: '#9C27B0',
  },
  {
    id: '5',
    title: 'Dental Care for Low-Income Families',
    content:
      'Eligible low-income families can access subsidized dental care through the municipal social services office. Applications are accepted year-round. Required: AMKA number and income certificate.',
    category: 'Dentistry',
    color: '#2196F3',
  },
  {
    id: '6',
    title: 'Water Quality Report – March 2026',
    content:
      'Monthly water quality testing confirms that tap water throughout Lefkada municipality meets all EU drinking water standards. No advisories are currently in effect.',
    category: 'Environment',
    color: '#00BCD4',
  },
];
