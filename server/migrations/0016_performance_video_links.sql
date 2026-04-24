ALTER TABLE performances RENAME TO performances_old;

CREATE TABLE IF NOT EXISTS live_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  song_ids_json TEXT NOT NULL,
  event_name TEXT NOT NULL,
  cover TEXT,
  duration TEXT NOT NULL,
  video_uri TEXT NOT NULL
);

INSERT INTO live_videos (id, title, song_ids_json, event_name, cover, duration, video_uri)
SELECT id, title, song_ids_json, event_name, cover, duration, ''
FROM performances_old;

DROP TABLE performances_old;
