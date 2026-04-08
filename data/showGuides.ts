import { ShowGuide } from '../types/tour';

export const showGuides: ShowGuide[] = [
  {
    showId: 'show_tokyo_n1',
    entryTime: '17:00',
    address: '1-3-61 Koraku, Bunkyo-ku, Tokyo',
    seatMapImages: ['/assets/images/ui/avatar-placeholder.png'],
    notes: ['入场时间 17:00', '地址信息已归档']
  },
  {
    showId: 'show_vancouver_n1',
    ticketPlatform: 'Ticketmaster',
    saleTime: '2024-10-01 11:00',
    entryTime: '18:00',
    address: '777 Pacific Blvd, Vancouver, BC V6B 4Y8',
    seatMapImages: [
      '/assets/images/ui/avatar-placeholder.png',
      '/assets/images/ui/avatar-placeholder.png'
    ],
    notes: ['入场口请以现场指引为准', '安检排队较长']
  },
  {
    showId: 'show_singapore_n1',
    entryTime: '18:00',
    address: '1 Stadium Drive, Singapore 397629',
    seatMapImages: ['/assets/images/ui/avatar-placeholder.png'],
    notes: ['入场时间 18:00', '地址信息已归档']
  },
  {
    showId: 'show_arlington_n1',
    entryTime: '17:30',
    address: '1 AT&T Way, Arlington, TX 76011',
    seatMapImages: ['/assets/images/ui/avatar-placeholder.png'],
    notes: ['入场时间 17:30', '地址信息已归档']
  }
];
