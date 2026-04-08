CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  cover TEXT NOT NULL,
  announcement_at INTEGER,
  release_at INTEGER
);

CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  published_at INTEGER NOT NULL,
  summary TEXT NOT NULL,
  tag TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_route TEXT NOT NULL,
  action_query TEXT
);

CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  album_id TEXT NOT NULL,
  lyrics_json TEXT NOT NULL,
  mv_json TEXT,
  FOREIGN KEY (album_id) REFERENCES albums(id)
);

CREATE TABLE IF NOT EXISTS performances (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  song_ids_json TEXT NOT NULL,
  kind TEXT NOT NULL,
  domain TEXT NOT NULL,
  event_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  cover TEXT NOT NULL,
  source TEXT NOT NULL,
  duration TEXT NOT NULL,
  summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documentaries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  cover TEXT NOT NULL,
  platform TEXT NOT NULL,
  duration TEXT NOT NULL,
  summary TEXT NOT NULL,
  related_song_ids_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eras (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  era_name TEXT NOT NULL,
  cover TEXT NOT NULL,
  theme_color TEXT NOT NULL,
  tagline TEXT NOT NULL,
  hero_intro TEXT NOT NULL,
  signature_looks_json TEXT NOT NULL,
  milestones_json TEXT NOT NULL,
  era_honors_json TEXT NOT NULL,
  revisit_performance_ids_json TEXT NOT NULL,
  FOREIGN KEY (album_id) REFERENCES albums(id)
);

CREATE TABLE IF NOT EXISTS tours (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL,
  cover TEXT NOT NULL,
  description TEXT NOT NULL,
  announcement_at INTEGER,
  start_at INTEGER NOT NULL,
  end_at INTEGER NOT NULL,
  setlists_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shows (
  id TEXT PRIMARY KEY,
  tour_id TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  venue TEXT NOT NULL,
  start_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  ticket_platform TEXT,
  sale_at INTEGER,
  entry_time TEXT,
  address TEXT,
  seat_map_images_json TEXT,
  notes_json TEXT,
  surprise_guests_json TEXT,
  surprise_songs_json TEXT,
  FOREIGN KEY (tour_id) REFERENCES tours(id)
);

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL,
  title TEXT NOT NULL,
  cover TEXT NOT NULL,
  song TEXT,
  user_name TEXT NOT NULL,
  uploaded_at INTEGER NOT NULL,
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

CREATE INDEX IF NOT EXISTS idx_songs_album_id ON songs(album_id);
CREATE INDEX IF NOT EXISTS idx_news_items_published_at ON news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_shows_tour_id_start_at ON shows(tour_id, start_at);
CREATE INDEX IF NOT EXISTS idx_videos_show_id_uploaded_at ON videos(show_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_tours_year ON tours(year DESC);
CREATE INDEX IF NOT EXISTS idx_albums_year ON albums(year ASC);
