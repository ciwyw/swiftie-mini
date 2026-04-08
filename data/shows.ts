import { Show } from '../types/tour';

export const shows: Show[] = [
  {
    id: 'show_tokyo_n1',
    tourId: 'tour_eras',
    country: 'Japan',
    city: 'Tokyo',
    venue: 'Tokyo Dome',
    date: '2024-02-10',
    status: 'ended'
  },
  {
    id: 'show_singapore_n1',
    tourId: 'tour_eras',
    country: 'Singapore',
    city: 'Singapore',
    venue: 'National Stadium',
    date: '2024-03-08',
    status: 'ended',
    surpriseGuests: [{ name: 'Sabrina Carpenter' }],
    surpriseSongs: [
      { songId: 'song_tim_mcgraw', name: 'Tim McGraw' },
      { songId: 'song_mirrorball', name: 'mirrorball' }
    ]
  },
  {
    id: 'show_toronto_cancelled',
    tourId: 'tour_eras',
    country: 'Canada',
    city: 'Toronto',
    venue: 'Rogers Centre',
    date: '2024-11-23',
    status: 'cancelled'
  },
  {
    id: 'show_vancouver_n1',
    tourId: 'tour_eras',
    country: 'Canada',
    city: 'Vancouver',
    venue: 'BC Place',
    date: '2024-12-06',
    status: 'ongoing'
  },
  {
    id: 'show_arlington_n1',
    tourId: 'tour_reputation',
    country: 'United States',
    city: 'Arlington',
    venue: 'AT&T Stadium',
    date: '2018-10-05',
    status: 'ended'
  }
];
