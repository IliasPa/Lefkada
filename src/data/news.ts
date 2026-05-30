export interface NewsItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  imageColor: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

export const newsData: NewsItem[] = [
  {
    id: '1',
    title: 'Lefkada Bridge Renovation Project Begins',
    description:
      'The long-awaited renovation of the floating bridge connecting Lefkada to the mainland has officially started. Authorities expect the project to be completed within 8 months.',
    timestamp: '2 hours ago',
    imageColor: '#4A90D9',
    socialLinks: {
      instagram: 'https://www.instagram.com/p/bridge-renovation/',
      facebook: 'https://www.facebook.com/lefkadacity/posts/bridge-renovation',
      twitter: 'https://twitter.com/lefkadacity/status/bridge-renovation',
    },
  },
  {
    id: '2',
    title: 'Summer Tourism Season Sets New Records',
    description:
      'Lefkada welcomed over 500,000 visitors this summer season, marking a 15% increase compared to last year. Porto Katsiki beach ranked #1 in Greece for 2025.',
    timestamp: '5 hours ago',
    imageColor: '#27AE60',
    socialLinks: {
      instagram: 'https://www.instagram.com/p/tourism-record/',
      facebook: 'https://www.facebook.com/lefkadacity/posts/tourism-record',
    },
  },
  {
    id: '3',
    title: 'Local Festival of the Sea Announced for August',
    description:
      'The annual Festival of the Sea will take place on August 15th at Nidri harbor. Traditional boat races, live music, and fresh seafood will headline the event.',
    timestamp: 'Yesterday',
    imageColor: '#E67E22',
    socialLinks: {
      instagram: 'https://www.instagram.com/p/sea-festival/',
      facebook: 'https://www.facebook.com/lefkadacity/posts/sea-festival',
      twitter: 'https://twitter.com/lefkadacity/status/sea-festival',
    },
  },
  {
    id: '4',
    title: 'New Cycling Paths Open Along West Coast',
    description:
      'A 12km coastal cycling path has been inaugurated along the west coast of Lefkada, connecting Agios Nikitas to Kathisma beach for cyclists and joggers.',
    timestamp: '2 days ago',
    imageColor: '#9B59B6',
    socialLinks: {
      facebook: 'https://www.facebook.com/lefkadacity/posts/cycling-paths',
      twitter: 'https://twitter.com/lefkadacity/status/cycling-paths',
    },
  },
  {
    id: '5',
    title: 'Municipal Council Approves Green Energy Plan',
    description:
      'The Lefkada Municipal Council voted in favor of a comprehensive green energy transition plan, targeting 80% renewable energy use by 2030.',
    timestamp: '3 days ago',
    imageColor: '#1ABC9C',
    socialLinks: {
      instagram: 'https://www.instagram.com/p/green-energy/',
      facebook: 'https://www.facebook.com/lefkadacity/posts/green-energy',
      twitter: 'https://twitter.com/lefkadacity/status/green-energy',
    },
  },
  {
    id: '6',
    title: 'Archaeological Site Near Meganisi Reopens',
    description:
      'After two years of restoration, the ancient ruins near Meganisi island are once again open to the public, offering guided tours on weekends.',
    timestamp: '4 days ago',
    imageColor: '#E74C3C',
    socialLinks: {
      instagram: 'https://www.instagram.com/p/meganisi-ruins/',
    },
  },
  {
    id: '7',
    title: 'Lefkada Airport Expansion Approved',
    description:
      'Government approval has been granted for expanding Aktion Airport, which serves Lefkada, with a new terminal wing and additional runway capacity.',
    timestamp: '5 days ago',
    imageColor: '#3498DB',
    socialLinks: {
      facebook: 'https://www.facebook.com/lefkadacity/posts/airport-expansion',
      twitter: 'https://twitter.com/lefkadacity/status/airport-expansion',
    },
  },
];
