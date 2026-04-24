export interface Performance {
  id: string;
  title: string;
  songIds: string[];
  eventName: string;
  cover?: string;
  duration: string;
  videoUri: string;
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
