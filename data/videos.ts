import { Video } from '../types/tour';

function localDateTimeTimestamp(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): number {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

export const videos: Video[] = [
  {
    id: 'video_tokyo_1',
    showId: 'show_tokyo_n1',
    title: 'Tokyo Dome fan cam',
    cover: '/assets/images/ui/avatar-placeholder.png',
    song: 'Enchanted',
    userName: 'Swiftie Tokyo',
    uploadedAt: localDateTimeTimestamp(2024, 2, 11, 10, 20)
  },
  {
    id: 'video_singapore_1',
    showId: 'show_singapore_n1',
    title: 'Singapore night one recap',
    cover: '/assets/images/ui/avatar-placeholder.png',
    song: 'Tim McGraw',
    userName: 'SG Swiftie',
    uploadedAt: localDateTimeTimestamp(2024, 3, 9, 9, 15)
  },
  {
    id: 'video_vancouver_1',
    showId: 'show_vancouver_n1',
    title: 'Queue vlog before doors open',
    cover: '/assets/images/ui/avatar-placeholder.png',
    userName: 'Eras Queue Diary',
    uploadedAt: localDateTimeTimestamp(2024, 12, 6, 15, 40)
  }
];
