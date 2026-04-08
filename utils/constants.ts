export const STORAGE_KEYS = {
  favoriteSongIds: 'favoriteSongIds',
  userProfileCache: 'userProfileCache',
  tourGuideChecklist: 'tourGuideChecklist'
} as const;

export const DEFAULT_USER_PROFILE = {
  avatarUrl: '/assets/images/ui/avatar-placeholder.png',
  nickName: 'Swiftie'
};

export const ROUTES = {
  library: '/pages/library/index',
  tour: '/pages/tour/index',
  tourDetail: '/pages/tour/detail/index',
  showDetail: '/pages/show/detail/index',
  eraDetail: '/pages/era/detail/index',
  guide: '/pages/guide/index',
  videoUpload: '/pages/video/upload/index',
  album: '/pages/album/index',
  song: '/pages/song/index',
  songList: '/pages/song-list/index',
  performanceList: '/pages/performance/index',
  documentaryList: '/pages/documentary/index',
  favorites: '/pages/favorites/index'
} as const;
