import { Performance } from '../types/library';

export const performances: Performance[] = [
  {
    id: 'performance_grammys_all_too_well',
    title: 'All Too Well (10 Minute Version)',
    songIds: ['song_all_too_well'],
    kind: 'live',
    domain: 'library',
    eventName: 'Grammy Awards',
    year: 2024,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'CBS',
    duration: '10:13',
    summary: 'A stripped-back award-show stage built around the 10-minute arrangement.'
  },
  {
    id: 'performance_iheart_anti_hero',
    title: 'Anti-Hero',
    songIds: ['song_anti_hero'],
    kind: 'live',
    domain: 'library',
    eventName: 'iHeartRadio Music Awards',
    year: 2023,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'FOX',
    duration: '4:27',
    summary: 'A televised performance built around the Midnights visual language.'
  },
  {
    id: 'performance_bbc_holy_ground',
    title: 'Holy Ground',
    songIds: ['song_holy_ground'],
    kind: 'live',
    domain: 'library',
    eventName: 'BBC Radio 1 Live Lounge',
    year: 2019,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'BBC',
    duration: '3:58',
    summary: 'A tighter live-band arrangement that fans often revisit as a standout non-tour cut.'
  },
  {
    id: 'performance_long_pond_session',
    title: 'folklore: the long pond studio sessions',
    songIds: ['song_mirrorball'],
    kind: 'special',
    domain: 'library',
    eventName: 'Disney+ Special',
    year: 2020,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'Disney+',
    duration: '1:46:00',
    summary: 'An intimate session film that became the defining revisit artifact for folklore.'
  },
  {
    id: 'performance_midnights_release_interview',
    title: 'Midnights Release Week Interview',
    songIds: ['song_anti_hero'],
    kind: 'interview',
    domain: 'library',
    eventName: 'iHeartRadio Interview',
    year: 2022,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'iHeartRadio',
    duration: '12:40',
    summary: 'A release-week conversation focused on the album’s sleepless-night concept.'
  }
];
