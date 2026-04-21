import { Song } from './song';

export interface Album {
  id: string;
  name: string;
  year: number;
  cover: string;
  announcementAt?: number;
  releaseAt?: number;
  kind?: 'album' | 'singles';
}

export interface AlbumEdition {
  id: string;
  albumId: string;
  name: string;
  isPrimary?: boolean;
  releaseAt?: number;
}

export interface AlbumTrack {
  editionId: string;
  songId: string;
  discNo?: number;
  trackNo?: number;
  song?: Song;
}

export interface AlbumSongSection {
  edition: AlbumEdition;
  tracks: Array<AlbumTrack & { song: Song }>;
}
