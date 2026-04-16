import { loadAlbumDetailPage, loadAlbumList } from '../../services/contentStore';
import { Album, AlbumSongSection } from '../../types/album';
import { Song } from '../../types/song';
import { ROUTES } from '../../utils/constants';

interface AlbumSongItem extends Song {
  hasMv: boolean;
}

interface AlbumSongTrackItem {
  editionId: string;
  songId: string;
  discNo?: number;
  trackNo?: number;
  displayName?: string;
  song: AlbumSongItem;
}

interface AlbumSongSectionItem {
  edition: AlbumSongSection['edition'];
  tracks: AlbumSongTrackItem[];
}

interface AlbumData {
  albums: Album[];
  album: Album | null;
  sections: AlbumSongSectionItem[];
  currentAlbumId: string;
  hasError: boolean;
  isLoading: boolean;
  loadError: boolean;
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
    albums: [],
    album: null,
    sections: [],
    currentAlbumId: '',
    hasError: false,
    isLoading: false,
    loadError: false
  } as AlbumData,

  onLoad(options: { id?: string }) {
    return this.loadPage(options.id ?? '');
  },

  async loadPage(albumId: string) {
    this.setData({
      currentAlbumId: albumId,
      hasError: false,
      isLoading: true,
      loadError: false
    });

    if (!albumId) {
      try {
        this.setData({
          albums: await loadAlbumList(),
          album: null,
          sections: [],
          hasError: false,
          isLoading: false,
          loadError: false
        });
      } catch {
        this.setData({
          albums: [],
          album: null,
          sections: [],
          hasError: false,
          isLoading: false,
          loadError: true
        });
      }
      return;
    }

    try {
      const { album, sections } = await loadAlbumDetailPage(albumId);
      if (!album) {
        this.setData({
          albums: [],
          album: null,
          sections: [],
          hasError: true,
          isLoading: false,
          loadError: false
        });
        return;
      }

      this.setData({
        albums: [],
        album,
        sections: sections.map((section) => ({
          edition: section.edition,
          tracks: section.tracks.map((track) => ({
            editionId: track.editionId,
            songId: track.songId,
            discNo: track.discNo,
            trackNo: track.trackNo,
            displayName: track.displayName,
            song: {
              ...track.song,
              hasMv: Boolean(track.song.mv)
            }
          }))
        })),
        hasError: false,
        isLoading: false,
        loadError: false
      });
    } catch {
      this.setData({
        albums: [],
        album: null,
        sections: [],
        hasError: false,
        isLoading: false,
        loadError: true
      });
    }
  },

  retryLoad() {
    return this.loadPage(this.data.currentAlbumId);
  },

  goSong(event: { currentTarget: { dataset: { id: string } } }) {
    const songId = event.currentTarget.dataset.id;
    goToDetail(ROUTES.song, songId);
  },

  goAlbum(event: { currentTarget: { dataset: { id: string } } }) {
    const albumId = event.currentTarget.dataset.id;
    goToDetail(ROUTES.album, albumId);
  }
});
