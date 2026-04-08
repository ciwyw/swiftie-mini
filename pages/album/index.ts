import { Album } from '../../types/album';
import { Song } from '../../types/song';
import { ROUTES } from '../../utils/constants';
import { getAlbumById, getAlbums, getSongsByAlbumId } from '../../utils/selectors';

interface AlbumSongItem extends Song {
  hasMv: boolean;
}

interface AlbumData {
  albums: Album[];
  album: Album | null;
  songs: AlbumSongItem[];
  hasError: boolean;
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
    songs: [],
    hasError: false
  } as AlbumData,

  onLoad(options: { id?: string }) {
    const albumId = options.id;
    if (!albumId) {
      this.setData({
        albums: getAlbums(),
        album: null,
        songs: [],
        hasError: false
      });
      return;
    }

    const album = getAlbumById(albumId);
    if (!album) {
      this.setData({
        albums: [],
        album: null,
        songs: [],
        hasError: true
      });
      return;
    }

    this.setData({
      albums: [],
      album,
      songs: getSongsByAlbumId(albumId).map((song) => ({
        ...song,
        hasMv: Boolean(song.mv)
      })),
      hasError: false
    });
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
