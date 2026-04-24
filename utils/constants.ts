export const STORAGE_KEYS = {
  favoriteSongIds: 'favoriteSongIds',
  userProfileCache: 'userProfileCache',
  tourGuideChecklist: 'tourGuideChecklist'
} as const;

export const DEFAULT_USER_PROFILE = {
  avatarUrl: '/assets/images/ui/avatar-placeholder.png',
  nickName: 'Swiftie'
};

export const CDN_BASE_URL = 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev';

const CDN_URL_SCHEME_PATTERN = /^(?:https?:)?\/\//i;
const CDN_DATA_URL_PATTERN = /^(?:data|wxfile|cloud):/i;

export function prefixCdnUri(value: string): string {
  if (!value) {
    return value;
  }

  if (CDN_URL_SCHEME_PATTERN.test(value) || CDN_DATA_URL_PATTERN.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${CDN_BASE_URL}${value}`;
  }

  return `${CDN_BASE_URL}/${value}`;
}

export const ROUTES = {
  library: '/pages/library/index',
  tour: '/pages/tour/index',
  tourDetail: '/pages/tour/detail/index',
  showDetail: '/pages/show/detail/index',
  eraDetail: '/pages/era/detail/index',
  guide: '/pages/guide/index',
  videoUpload: '/pages/video/upload/index',
  videoPlayer: '/pages/video/player/index',
  album: '/pages/album/index',
  song: '/pages/song/index',
  songList: '/pages/song-list/index',
  performanceList: '/pages/performance/index',
  documentaryList: '/pages/documentary/index',
  favorites: '/pages/favorites/index'
} as const;
