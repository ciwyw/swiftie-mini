export interface Performance {
  id: string;
  title: string;
  songIds: string[];
  kind: 'live' | 'interview' | 'special';
  domain: 'library' | 'tour';
  eventName: string;
  year: number;
  cover: string;
  source: string;
  duration: string;
  summary: string;
}

export interface Documentary {
  id: string;
  title: string;
  year: number;
  category: 'documentary' | 'concert-film' | 'special';
  cover: string;
  platform: string;
  duration: string;
  summary: string;
  relatedSongIds: string[];
}

export interface LibraryHubEntry {
  id: 'albums' | 'singles' | 'songs' | 'performances' | 'documentaries' | 'favorites';
  title: string;
  subtitle: string;
  route: string;
}
