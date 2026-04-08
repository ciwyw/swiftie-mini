import { Tour } from '../types/tour';

export const tours: Tour[] = [
  {
    id: 'tour_eras',
    name: 'The Eras Tour',
    year: 2023,
    status: 'ongoing',
    cover: '/assets/images/ui/avatar-placeholder.png',
    description: 'A career-spanning stadium tour covering every album era.',
    announcementDate: '2026-01-15',
    startDate: '2026-03-01',
    endDate: '2026-08-30',
    rangeLabel: '2023.3 - 2024.12',
    setlists: [
      {
        id: 'standard',
        label: 'Standard Setlist',
        songs: ['Miss Americana & the Heartbreak Prince', 'Cruel Summer', 'The Man']
      },
      {
        id: 'ttpd',
        label: 'TTPD Added Setlist',
        songs: ['But Daddy I Love Him', 'So High School', 'Who’s Afraid of Little Old Me?']
      }
    ]
  },
  {
    id: 'tour_reputation',
    name: 'Reputation Stadium Tour',
    year: 2018,
    status: 'ended',
    cover: '/assets/images/ui/avatar-placeholder.png',
    description: 'A dark-pop stadium era with snakes, fire, and massive sing-alongs.',
    startDate: '2018-05-08',
    endDate: '2018-11-21',
    rangeLabel: '2018.5 - 2018.11',
    setlists: [
      {
        id: 'standard',
        label: 'Standard Setlist',
        songs: ['...Ready For It?', 'Delicate', 'Look What You Made Me Do']
      }
    ]
  },
  {
    id: 'tour_1989',
    name: 'The 1989 World Tour',
    year: 2015,
    status: 'ended',
    cover: '/assets/images/ui/avatar-placeholder.png',
    description: 'The global pop era tour built around 1989 and guest appearances.',
    startDate: '2015-05-05',
    endDate: '2015-12-12',
    rangeLabel: '2015.5 - 2015.12',
    setlists: [
      {
        id: 'standard',
        label: 'Standard Setlist',
        songs: ['Welcome to New York', 'Blank Space', 'Style']
      }
    ]
  }
];
