import { ROUTES, prefixCdnUri } from '../utils/constants';
import { Album } from '../types/album';
import { Song } from '../types/song';
import {
  fetchAlbumDetail,
  fetchAlbums,
  fetchAlbumSongs,
  fetchDocumentaries,
  fetchEraDetail,
  fetchHomeFeed,
  fetchPerformanceDetail,
  fetchPerformances,
  fetchShowDetail,
  fetchShowVideos,
  fetchSongs,
  fetchSingles,
  fetchSongDetail,
  fetchTourDetail,
  fetchTours,
  fetchTourShows
} from './contentApi';

const cache = new Map<string, Promise<unknown>>();

function fromCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const cached = cache.get(key) as Promise<T> | undefined;
  if (cached) {
    return cached;
  }

  const next = loader().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, next);
  return next;
}

export function clearContentStoreCache() {
  cache.clear();
}

export interface SongListItem extends Song {
  albumName: string;
  hasMv: boolean;
}

function buildSongListItems(songs: Song[], albums: Album[]): SongListItem[] {
  return songs.map((song) => ({
    ...song,
    albumName:
      song.albumId
        ? albums.find((album) => album.id === song.albumId)?.name ?? song.albumId
        : song.artistCredit
          ? song.artistCredit
          : song.year
          ? String(song.year)
          : '单曲',
    hasMv: Boolean(song.mv)
  }));
}

export function loadHomeFeed() {
  return fromCache('home', () => fetchHomeFeed());
}

export function loadAlbumList() {
  return fromCache('albums', async () => {
    const albums = await fetchAlbums();
    return [...albums].sort((left, right) => right.year - left.year);
  });
}

export function loadAlbumDetail(id: string) {
  return fromCache(`album:${id}`, () => fetchAlbumDetail(id));
}

export function loadSongs() {
  return fromCache('songs', () => fetchSongs());
}

export function loadSingles() {
  return fromCache('singles', () => fetchSingles());
}

export function loadAlbumSongs(id: string) {
  return fromCache(`albumSongs:${id}`, () => fetchAlbumSongs(id));
}

export async function loadSongListPage() {
  const [songs, albums] = await Promise.all([loadSongs(), loadAlbumList()]);
  return buildSongListItems(songs, albums);
}

export async function loadSinglesListPage() {
  const [songs, albums] = await Promise.all([loadSingles(), loadAlbumList()]);
  return buildSongListItems(songs, albums);
}

export async function loadFavoriteSongListPage(favoriteIds: string[]) {
  if (favoriteIds.length === 0) {
    return [];
  }

  const songItems = await loadSongListPage();
  return favoriteIds
    .map((id) => songItems.find((item) => item.id === id))
    .filter((item): item is SongListItem => Boolean(item));
}

export async function loadAlbumDetailPage(id: string) {
  const [album, sections] = await Promise.all([loadAlbumDetail(id), loadAlbumSongs(id)]);
  return { album, sections };
}

export function loadSongDetail(id: string) {
  return fromCache(`song:${id}`, () => fetchSongDetail(id));
}

export function loadPerformances() {
  return fromCache('performances', () => fetchPerformances());
}

export function loadPerformanceDetail(id: string) {
  return fromCache(`performance:${id}`, () => fetchPerformanceDetail(id));
}

export async function loadPerformancePlayerPage(id: string) {
  const performance = await loadPerformanceDetail(id);
  if (!performance) {
    return null;
  }

  return {
    ...performance,
    videoUrl: prefixCdnUri(performance.videoUri)
  };
}

export function loadDocumentaries() {
  return fromCache('documentaries', () => fetchDocumentaries());
}

export async function loadSongDetailPage(id: string) {
  const song = await loadSongDetail(id);
  if (!song) {
    return null;
  }

  const [album, performances] = await Promise.all([
    song.albumId ? loadAlbumDetail(song.albumId) : Promise.resolve(null),
    loadPerformances()
  ]);

  return {
    song,
    album,
    mv: song.mv ?? null,
    relatedPerformances: performances
      .filter((item) => item.songIds.includes(song.id))
      .slice(0, 2)
  };
}

export function loadEraDetail(id: string) {
  return fromCache(`era:${id}`, () => fetchEraDetail(id));
}

export async function loadEraDetailPage(id: string) {
  const exhibit = await loadEraDetail(id);
  if (!exhibit) {
    return null;
  }

  const [album, performances] = await Promise.all([
    exhibit.albumId ? loadAlbumDetail(exhibit.albumId) : Promise.resolve(null),
    exhibit.revisit.performanceIds.length > 0 ? loadPerformances() : Promise.resolve([])
  ]);

  const revisitPerformances = exhibit.revisit.performanceIds
    .map((performanceId) => performances.find((item) => item.id === performanceId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...exhibit,
    album: album
      ? {
          ...album,
          action: {
            route: ROUTES.album,
            query: `id=${album.id}`
          }
        }
      : null,
    featuredHonors: exhibit.eraHonors.slice(0, 3),
    remainingHonors: exhibit.eraHonors.slice(3),
    performances: revisitPerformances
  };
}

export function loadTours() {
  return fromCache('tours', () => fetchTours());
}

export function loadTourDetail(id: string) {
  return fromCache(`tour:${id}`, () => fetchTourDetail(id));
}

export function loadTourShows(id: string) {
  return fromCache(`tourShows:${id}`, () => fetchTourShows(id));
}

export async function loadTourDetailPage(id: string) {
  const [tour, shows] = await Promise.all([loadTourDetail(id), loadTourShows(id)]);
  return { tour, shows };
}

export function loadShowDetail(id: string) {
  return fromCache(`show:${id}`, () => fetchShowDetail(id));
}

export function loadShowVideos(id: string) {
  return fromCache(`showVideos:${id}`, () => fetchShowVideos(id));
}

export async function loadShowDetailPage(id: string) {
  const show = await loadShowDetail(id);
  if (!show) {
    return null;
  }

  const [tour, videos] = await Promise.all([
    loadTourDetail(show.tourId),
    loadShowVideos(id)
  ]);

  return {
    show,
    tour,
    videos
  };
}
