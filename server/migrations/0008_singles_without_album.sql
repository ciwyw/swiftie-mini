-- Make songs.album_id nullable so singles can exist without an album container.
-- SQLite doesn't support dropping NOT NULL constraints directly, so we rebuild the table.

CREATE TABLE IF NOT EXISTS songs_next (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  album_id TEXT,
  lyrics_json TEXT NOT NULL,
  mv_json TEXT,
  duration_ms INTEGER,
  edition_id TEXT,
  disc_no INTEGER NOT NULL DEFAULT 1,
  track_no INTEGER,
  display_name TEXT,
  FOREIGN KEY (album_id) REFERENCES albums(id)
);

INSERT INTO songs_next (
  id,
  name,
  album_id,
  lyrics_json,
  mv_json,
  duration_ms,
  edition_id,
  disc_no,
  track_no,
  display_name
)
SELECT
  id,
  name,
  album_id,
  lyrics_json,
  mv_json,
  duration_ms,
  edition_id,
  disc_no,
  track_no,
  display_name
FROM songs;

DROP TABLE songs;
ALTER TABLE songs_next RENAME TO songs;

CREATE INDEX IF NOT EXISTS idx_songs_album_id ON songs(album_id);
CREATE INDEX IF NOT EXISTS idx_songs_edition_id ON songs(edition_id);

-- Remove the legacy pseudo-album used to host singles.
UPDATE songs
SET album_id = NULL,
    edition_id = NULL
WHERE album_id = 'album_singles';

DELETE FROM editions
WHERE album_id = 'album_singles' OR id = 'edition_album_singles_standard';

DELETE FROM albums
WHERE id = 'album_singles';
