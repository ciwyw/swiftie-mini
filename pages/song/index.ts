import { Album } from '../../types/album';
import { Performance } from '../../types/library';
import { Song, SongMvAsset } from '../../types/song';
import { ROUTES } from '../../utils/constants';
import { getSongVideoSection } from '../../utils/librarySelectors';
import { getAlbumBySong, getSongById } from '../../utils/selectors';
import { getFavoriteSongIds, toggleFavoriteSong } from '../../utils/storage';

interface SongData {
  song: Song | null;
  album: Album | null;
  hasError: boolean;
  isFavorite: boolean;
  showTranslation: boolean;
  mv: SongMvAsset | null;
  relatedPerformances: Performance[];
}

interface VideoEntryDataset {
  kind: 'mv' | 'performance';
  title: string;
  subtitle?: string;
  meta?: string;
  summary?: string;
}

function showInfoModal(title: string, lines: Array<string | undefined>) {
  const modal = wx as typeof wx & {
    showModal(options: { title: string; content: string; showCancel: boolean; confirmText: string }): void;
  };

  modal.showModal({
    title,
    content: lines.filter((line): line is string => Boolean(line)).join('\n'),
    showCancel: false,
    confirmText: '知道了'
  });
}

function goToDetail(route: string, id: string) {
  const pages = (
    globalThis as typeof globalThis & {
      getCurrentPages?: () => Array<{ route?: string; options?: { id?: string } }>;
    }
  ).getCurrentPages?.() ?? [];
  const previousPage = pages[pages.length - 2] as
    | { route?: string; options?: { id?: string } }
    | undefined;
  const normalizedRoute = route.replace(/^\//, '');
  const normalizedPreviousRoute = previousPage?.route?.replace(/^\//, '');

  if (normalizedPreviousRoute === normalizedRoute && previousPage?.options?.id === id) {
    (wx as typeof wx & { navigateBack(options: { delta: number }): void }).navigateBack({
      delta: 1
    });
    return;
  }

  wx.navigateTo({ url: `${route}?id=${id}` });
}

Page({
  data: {
    song: null,
    album: null,
    hasError: false,
    isFavorite: false,
    showTranslation: false,
    mv: null,
    relatedPerformances: []
  } as SongData,

  onLoad(options: { id?: string }) {
    const songId = options.id;
    if (!songId) {
      this.setData({ hasError: true });
      return;
    }

    const song = getSongById(songId);
    if (!song) {
      this.setData({ hasError: true });
      return;
    }

    const album = getAlbumBySong(song) ?? null;
    const videoSection = getSongVideoSection(song.id);
    const favoriteIds = getFavoriteSongIds();

    this.setData({
      song,
      album,
      hasError: false,
      isFavorite: favoriteIds.includes(song.id),
      mv: videoSection.mv,
      relatedPerformances: videoSection.performances
    });
  },

  onShow() {
    const song = this.data.song;
    if (!song) {
      return;
    }
    const favoriteIds = getFavoriteSongIds();
    this.setData({ isFavorite: favoriteIds.includes(song.id) });
  },

  onToggleTranslation() {
    this.setData({
      showTranslation: !this.data.showTranslation
    });
  },

  onToggleFavorite() {
    const song = this.data.song;
    if (!song) {
      return;
    }

    const nextIds = toggleFavoriteSong(song.id);
    const isFavorite = nextIds.includes(song.id);

    this.setData({ isFavorite });
    wx.showToast({
      title: isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  openVideoEntry(event: { currentTarget: { dataset: VideoEntryDataset } }) {
    const { kind, title, subtitle, meta, summary } = event.currentTarget.dataset;
    const isMv = kind === 'mv';

    showInfoModal(isMv ? 'MV 预览' : '现场演出信息', [
      title,
      subtitle,
      meta,
      summary,
      isMv ? '暂未接入播放，这里先作为可点击入口。' : '暂未接入演出页，这里先作为可点击入口。'
    ]);
  },

  goAlbum() {
    const album = this.data.album;
    if (!album) {
      return;
    }
    goToDetail(ROUTES.album, album.id);
  }
});
