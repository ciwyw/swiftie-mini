import { Documentary } from '../types/library';

export const documentaries: Documentary[] = [
  {
    id: 'documentary_miss_americana',
    title: 'Miss Americana',
    year: 2020,
    category: 'documentary',
    cover: '/assets/images/ui/avatar-placeholder.png',
    platform: 'Netflix',
    duration: '85 min',
    summary: 'A personal documentary focused on identity, pressure, and reinvention.',
    relatedSongIds: ['song_mirrorball', 'song_dear_reader']
  },
  {
    id: 'documentary_eras_tour_film',
    title: 'Taylor Swift | The Eras Tour',
    year: 2023,
    category: 'concert-film',
    cover: '/assets/images/ui/avatar-placeholder.png',
    platform: 'Disney+',
    duration: '169 min',
    summary: 'A feature-length concert film presenting the Eras Tour set in cinematic form.',
    relatedSongIds: ['song_love_story', 'song_anti_hero', 'song_long_live']
  }
];
