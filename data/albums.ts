import { Album } from '../types/album';

function localDayTimestamp(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getTime();
}

export const albums: Album[] = [
  {
    id: 'album_taylor_swift',
    name: 'Taylor Swift',
    year: 2006,
    cover: '/assets/images/ui/avatar-placeholder.png'
  },
  {
    id: 'album_speak_now',
    name: 'Speak Now',
    year: 2010,
    cover: '/assets/images/ui/avatar-placeholder.png'
  },
  {
    id: 'album_1989',
    name: '1989',
    year: 2014,
    cover: '/assets/images/ui/avatar-placeholder.png'
  },
  {
    id: 'album_folklore',
    name: 'folklore',
    year: 2020,
    cover: '/assets/images/ui/avatar-placeholder.png'
  },
  {
    id: 'album_fearless',
    name: 'Fearless (Taylor\'s Version)',
    year: 2021,
    cover: '/assets/images/albums/album-fearless.png'
  },
  {
    id: 'album_red',
    name: 'Red (Taylor\'s Version)',
    year: 2021,
    cover: '/assets/images/albums/album-red.png'
  },
  {
    id: 'album_midnights',
    name: 'Midnights',
    year: 2022,
    cover: '/assets/images/albums/album-midnights.png',
    announcementAt: localDayTimestamp(2026, 4, 1),
    releaseAt: localDayTimestamp(2026, 4, 30)
  }
];
