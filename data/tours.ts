import { Tour } from '../types/tour';

function localDayTimestamp(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getTime();
}

export const tours: Tour[] = [
  {
    id: 'tour_eras',
    name: 'The Eras Tour',
    year: 2023,
    status: 'ongoing',
    cover: '/assets/images/ui/avatar-placeholder.png',
    description: 'A career-spanning stadium tour covering every album era.',
    announcementAt: localDayTimestamp(2026, 1, 15),
    startAt: localDayTimestamp(2026, 3, 1),
    endAt: localDayTimestamp(2026, 8, 30),
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
    startAt: localDayTimestamp(2018, 5, 8),
    endAt: localDayTimestamp(2018, 11, 21),
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
    startAt: localDayTimestamp(2015, 5, 5),
    endAt: localDayTimestamp(2015, 12, 12),
    setlists: [
      {
        id: 'standard',
        label: 'Standard Setlist',
        songs: ['Welcome to New York', 'Blank Space', 'Style']
      }
    ]
  }
];
