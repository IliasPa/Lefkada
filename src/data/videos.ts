export interface VideoItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnailColor: string;
  year: string;
}

export const videosData: VideoItem[] = [
  {
    id: '1',
    title: 'Lefkada Carnival 2022 - Full Highlights',
    description:
      'Relive the spectacular carnival parade through Lefkada town with floats, music, and thousands of participants.',
    duration: '12:34',
    thumbnailColor: '#FF6B6B',
    year: '2022',
  },
  {
    id: '2',
    title: 'The Great Flood of 2020 - News Report',
    description:
      'An archival news report covering the flash floods that hit the municipality of Lefkada in November 2020, causing widespread damage.',
    duration: '8:21',
    thumbnailColor: '#4ECDC4',
    year: '2020',
  },
  {
    id: '3',
    title: 'Earthquake Response - Lefkada 2015',
    description:
      'News footage from the 6.1 magnitude earthquake that struck Lefkada in November 2015. Civil protection teams respond.',
    duration: '18:05',
    thumbnailColor: '#45B7D1',
    year: '2015',
  },
  {
    id: '4',
    title: 'Traditional Panigiri at Agios Ioannis 2019',
    description:
      'A documentary-style recording of the traditional religious festival held every August at Agios Ioannis chapel.',
    duration: '22:18',
    thumbnailColor: '#96CEB4',
    year: '2019',
  },
  {
    id: '5',
    title: 'Vassiliki Windsurfing World Cup 2018',
    description:
      'Coverage of the international windsurfing championship held in Vassiliki bay, featuring competitors from 40 countries.',
    duration: '35:50',
    thumbnailColor: '#FFEAA7',
    year: '2018',
  },
  {
    id: '6',
    title: 'Lefkada Town Heritage Walk - 2016',
    description:
      'A guided video tour of the old architecture, Venetian-era buildings, and historic sites of Lefkada town.',
    duration: '27:44',
    thumbnailColor: '#DDA0DD',
    year: '2016',
  },
];
