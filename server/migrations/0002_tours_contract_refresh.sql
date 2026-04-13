PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS tours_next (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status INTEGER NOT NULL,
  cover TEXT NOT NULL,
  description TEXT NOT NULL,
  announcement_at INTEGER,
  start_at INTEGER NOT NULL,
  end_at INTEGER NOT NULL,
  album_ids_json TEXT,
  setlists_json TEXT NOT NULL
);

INSERT INTO tours_next (
  id,
  name,
  status,
  cover,
  description,
  announcement_at,
  start_at,
  end_at,
  album_ids_json,
  setlists_json
)
SELECT
  id,
  name,
  CASE status
    WHEN 'ongoing' THEN 1
    WHEN 'ended' THEN 2
    ELSE 0
  END,
  cover,
  description,
  announcement_at,
  start_at,
  end_at,
  '[]',
  setlists_json
FROM tours;

DROP TABLE tours;
ALTER TABLE tours_next RENAME TO tours;

PRAGMA foreign_keys=ON;
