export interface LyricLine {
  en: string;
  zh: string;
}

export interface SongMvAsset {
  title: string;
  cover: string;
  source: string;
  duration: string;
}

export interface Song {
  id: string;
  name: string;
  albumId: string;
  lyrics: LyricLine[];
  mv?: SongMvAsset;
}
