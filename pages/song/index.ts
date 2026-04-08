import { Album } from '../../types/album';
import { Performance } from '../../types/library';
import { loadSongDetailPage } from '../../services/contentStore';
import { Song, SongMvAsset } from '../../types/song';
import { ROUTES } from '../../utils/constants';
import { getFavoriteSongIds, toggleFavoriteSong } from '../../utils/storage';

interface SongData {
  song: Song | null;
  album: Album | null;
  currentSongId: string;
  hasError: boolean;
  isLoading: boolean;
  loadError: boolean;
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
    currentSongId: '',
    hasError: false,
    isLoading: false,
    loadError: false,
    isFavorite: false,
    showTranslation: false,
    mv: null,
    relatedPerformances: []
  } as SongData,

  onLoad(options: { id?: string }) {
    return this.loadPage(options.id ?? '');
  },

  async loadPage(songId: string) {
    this.setData({
      currentSongId: songId,
      hasError: false,
      isLoading: true,
      loadError: false
    });

    if (!songId) {
      this.setData({ hasError: true, isLoading: false, loadError: false });
      return;
    }

    try {
      const detail = await loadSongDetailPage(songId);
      if (!detail) {
        this.setData({
          song: null,
          album: null,
          hasError: true,
          isLoading: false,
          loadError: false,
          isFavorite: false,
          mv: null,
          relatedPerformances: []
        });
        return;
      }

      const favoriteIds = getFavoriteSongIds();

      this.setData({
        song: detail.song,
        album: detail.album,
        hasError: false,
        isLoading: false,
        loadError: false,
        isFavorite: favoriteIds.includes(detail.song.id),
        mv: detail.mv,
        relatedPerformances: detail.relatedPerformances
      });
    } catch {
      this.setData({
        song: null,
        album: null,
        hasError: false,
        isLoading: false,
        loadError: true,
        isFavorite: false,
        mv: null,
        relatedPerformances: []
      });
    }
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
  },

  retryLoad() {
    return this.loadPage(this.data.currentSongId);
  }
});
