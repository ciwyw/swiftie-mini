import { ROUTES } from '../utils/constants';
import { HomeEraCard } from '../types/home';

function createHomeEraCard(input: Omit<HomeEraCard, 'action'>): HomeEraCard {
  return {
    ...input,
    action: {
      type: 'navigateTo',
      route: ROUTES.eraDetail,
      query: `id=${input.id}`
    }
  };
}

export const homeEraCards: HomeEraCard[] = [
  createHomeEraCard({
    id: 'era_taylor_swift',
    albumId: 'album_taylor_swift',
    name: 'Taylor Swift',
    cover: '/assets/images/ui/avatar-placeholder.png',
    themeColor: '#d6c48f',
    tagline: '青涩、乡村、像第一封写给世界的自我介绍。'
  }),
  createHomeEraCard({
    id: 'era_fearless',
    albumId: 'album_fearless',
    name: 'Fearless',
    cover: '/assets/images/albums/album-fearless.png',
    themeColor: '#d4b15d',
    tagline: '金色光晕里的心动、成长与少女叙事。'
  }),
  createHomeEraCard({
    id: 'era_speak_now',
    albumId: 'album_speak_now',
    name: 'Speak Now',
    cover: '/assets/images/ui/avatar-placeholder.png',
    themeColor: '#8d69c9',
    tagline: '紫色舞台、童话感与把心事说出口的勇气。'
  }),
  createHomeEraCard({
    id: 'era_red',
    albumId: 'album_red',
    name: 'Red',
    cover: '/assets/images/albums/album-red.png',
    themeColor: '#b44545',
    tagline: '炽热、失控、把爱与痛都写成高饱和记忆。'
  }),
  createHomeEraCard({
    id: 'era_1989',
    albumId: 'album_1989',
    name: '1989',
    cover: '/assets/images/ui/avatar-placeholder.png',
    themeColor: '#7ab5d6',
    tagline: '城市霓虹、流行锋芒与彻底转身的自信。'
  }),
  createHomeEraCard({
    id: 'era_folklore',
    albumId: 'album_folklore',
    name: 'folklore',
    cover: '/assets/images/ui/avatar-placeholder.png',
    themeColor: '#7b7b7b',
    tagline: '树林、耳语和把故事写成传说的静谧时刻。'
  }),
  createHomeEraCard({
    id: 'era_midnights',
    albumId: 'album_midnights',
    name: 'Midnights',
    cover: '/assets/images/albums/album-midnights.png',
    themeColor: '#324765',
    tagline: '午夜独白、蓝调霓虹和清醒到发亮的思绪。'
  })
];
