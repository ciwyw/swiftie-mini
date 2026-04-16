-- Seed The Life of a Showgirl track listing from Wikipedia.
-- Source checked on 2026-04-16:
-- https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl#Track_listing

DELETE FROM songs WHERE album_id = '20000001';
DELETE FROM editions WHERE album_id = '20000001';

INSERT OR REPLACE INTO editions (id, album_id, name, is_primary, release_at) VALUES
  ('50000020', '20000001', 'Standard', 1, NULL);

INSERT OR REPLACE INTO songs (
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
) VALUES
  ('40000234', 'The Fate of Ophelia', '20000001', '[]', NULL, 226000, '50000020', 1, 1, NULL),
  ('40000235', 'Elizabeth Taylor', '20000001', '[]', NULL, 208000, '50000020', 1, 2, NULL),
  ('40000236', 'Opalite', '20000001', '[]', NULL, 235000, '50000020', 1, 3, NULL),
  ('40000237', 'Father Figure', '20000001', '[]', NULL, 212000, '50000020', 1, 4, NULL),
  ('40000238', 'Eldest Daughter', '20000001', '[]', NULL, 246000, '50000020', 1, 5, NULL),
  ('40000239', 'Ruin the Friendship', '20000001', '[]', NULL, 220000, '50000020', 1, 6, NULL),
  ('40000240', 'Actually Romantic', '20000001', '[]', NULL, 163000, '50000020', 1, 7, NULL),
  ('40000241', 'Wish List', '20000001', '[]', NULL, 207000, '50000020', 1, 8, NULL),
  ('40000242', 'Wood', '20000001', '[]', NULL, 150000, '50000020', 1, 9, NULL),
  ('40000243', 'Cancelled!', '20000001', '[]', NULL, 211000, '50000020', 1, 10, NULL),
  ('40000244', 'Honey', '20000001', '[]', NULL, 181000, '50000020', 1, 11, NULL),
  ('40000245', 'The Life of a Showgirl (featuring Sabrina Carpenter)', '20000001', '[]', NULL, 241000, '50000020', 1, 12, NULL);
