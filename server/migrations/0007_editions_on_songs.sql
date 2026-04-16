ALTER TABLE albums ADD COLUMN kind TEXT NOT NULL DEFAULT 'album';
ALTER TABLE songs ADD COLUMN duration_ms INTEGER;

CREATE TABLE IF NOT EXISTS editions (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  release_at INTEGER,
  FOREIGN KEY (album_id) REFERENCES albums(id)
);

ALTER TABLE songs ADD COLUMN edition_id TEXT;
ALTER TABLE songs ADD COLUMN disc_no INTEGER NOT NULL DEFAULT 1;
ALTER TABLE songs ADD COLUMN track_no INTEGER;
ALTER TABLE songs ADD COLUMN display_name TEXT;

CREATE INDEX IF NOT EXISTS idx_editions_album_id ON editions(album_id);
CREATE INDEX IF NOT EXISTS idx_songs_edition_id ON songs(edition_id);

DROP TABLE IF EXISTS tracks;
DROP INDEX IF EXISTS idx_tracks_edition_id;

INSERT OR IGNORE INTO albums (id, name, year, cover, kind)
VALUES ('album_singles', '单曲', 0, '/assets/images/ui/avatar-placeholder.png', 'singles');

INSERT OR IGNORE INTO editions (id, album_id, name, is_primary)
VALUES ('edition_album_singles_standard', 'album_singles', 'Singles', 1);

INSERT OR IGNORE INTO editions (id, album_id, name, is_primary)
SELECT 'edition_' || id || '_standard', id, 'Standard', 1
FROM albums
WHERE id <> 'album_singles';

UPDATE songs
SET edition_id = 'edition_' || album_id || '_standard'
WHERE album_id <> 'album_singles' AND (edition_id IS NULL OR edition_id = '');

UPDATE songs
SET edition_id = 'edition_album_singles_standard'
WHERE album_id = 'album_singles' AND (edition_id IS NULL OR edition_id = '');
