import { Show } from '../types/tour';

function localDayTimestamp(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getTime();
}

export const shows: Show[] = [
  {
    id: 'show_tokyo_n1',
    tourId: 'tour_eras',
    country: 'Japan',
    city: 'Tokyo',
    venue: 'Tokyo Dome',
    startAt: localDayTimestamp(2024, 2, 10),
    status: 'ended',
    entryTime: '17:00',
    address: '1-3-61 Koraku, Bunkyo-ku, Tokyo',
    seatMapImages: ['/assets/images/ui/avatar-placeholder.png'],
    notes: ['入场时间 17:00', '地址信息已归档']
  },
  {
    id: 'show_singapore_n1',
    tourId: 'tour_eras',
    country: 'Singapore',
    city: 'Singapore',
    venue: 'National Stadium',
    startAt: localDayTimestamp(2024, 3, 8),
    status: 'ended',
    entryTime: '18:00',
    address: '1 Stadium Drive, Singapore 397629',
    seatMapImages: ['/assets/images/ui/avatar-placeholder.png'],
    notes: ['入场时间 18:00', '地址信息已归档'],
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
    startAt: localDayTimestamp(2024, 11, 23),
    status: 'cancelled'
  },
  {
    id: 'show_vancouver_n1',
    tourId: 'tour_eras',
    country: 'Canada',
    city: 'Vancouver',
    venue: 'BC Place',
    startAt: localDayTimestamp(2024, 12, 6),
    status: 'ongoing',
    ticketPlatform: 'Ticketmaster',
    saleAt: Date.UTC(2024, 9, 1, 3),
    entryTime: '18:00',
    address: '777 Pacific Blvd, Vancouver, BC V6B 4Y8',
    seatMapImages: [
      '/assets/images/ui/avatar-placeholder.png',
      '/assets/images/ui/avatar-placeholder.png'
    ],
    notes: ['入场口请以现场指引为准', '安检排队较长']
  },
  {
    id: 'show_arlington_n1',
    tourId: 'tour_reputation',
    country: 'United States',
    city: 'Arlington',
    venue: 'AT&T Stadium',
    startAt: localDayTimestamp(2018, 10, 5),
    status: 'ended',
    entryTime: '17:30',
    address: '1 AT&T Way, Arlington, TX 76011',
    seatMapImages: ['/assets/images/ui/avatar-placeholder.png'],
    notes: ['入场时间 17:30', '地址信息已归档']
  }
];
