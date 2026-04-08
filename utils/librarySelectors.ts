import { albums } from '../data/albums';
import { documentaries } from '../data/documentaries';
import { performances } from '../data/performances';
import { songs } from '../data/songs';
import { Documentary, LibraryHubEntry, Performance } from '../types/library';
import { Song, SongMvAsset } from '../types/song';
import { ROUTES } from './constants';
import { getFavoriteSongIds } from './storage';

export interface SongListItem extends Song {
  albumName: string;
  hasMv: boolean;
}

export interface SongVideoSection {
  mv: SongMvAsset | null;
  performances: Performance[];
}

function isLibraryLivePerformance(item: Performance): boolean {
  return item.domain === 'library' && item.kind === 'live';
}

export function getSongListItems(): SongListItem[] {
  return songs.map((song) => ({
    ...song,
    albumName: albums.find((album) => album.id === song.albumId)?.name ?? song.albumId,
    hasMv: Boolean(song.mv)
  }));
}

export function getLibraryHubEntries(): LibraryHubEntry[] {
  return [
    { id: 'albums', title: '专辑', subtitle: '按时代浏览全部专辑', route: ROUTES.album },
    { id: 'songs', title: '歌曲', subtitle: '完整歌曲列表与 MV 标记', route: ROUTES.songList },
    {
      id: 'performances',
      title: 'Live 表演',
      subtitle: '典礼、节目与特别舞台',
      route: ROUTES.performanceList
    },
    {
      id: 'documentaries',
      title: '纪录片',
      subtitle: '长内容与幕后特辑',
      route: ROUTES.documentaryList
    },
    { id: 'favorites', title: '我的收藏', subtitle: '集中查看已收藏歌曲', route: ROUTES.favorites }
  ];
}

export function getPerformanceList(): Performance[] {
  return performances.filter(isLibraryLivePerformance);
}

export function getDocumentaryList(): Documentary[] {
  return documentaries;
}

export function getSongVideoSection(songId: string): SongVideoSection {
  const song = songs.find((item) => item.id === songId) ?? null;

  return {
    mv: song?.mv ?? null,
    performances: performances
      .filter((item) => isLibraryLivePerformance(item) && item.songIds.includes(songId))
      .slice(0, 2)
  };
}

export function getFavoriteSongListItems(): SongListItem[] {
  const favoriteIds = getFavoriteSongIds();
  const songItems = getSongListItems();

  return favoriteIds
    .map((id) => songItems.find((item) => item.id === id))
    .filter((item): item is SongListItem => Boolean(item));
}
