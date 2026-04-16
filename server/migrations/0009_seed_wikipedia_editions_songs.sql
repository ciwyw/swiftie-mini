-- Seed `editions` and `songs` from Wikipedia track listings.
-- Notes:
-- - Only seeds selected albums (TTPD, Midnights).
-- - Excludes remixes/acoustic variants; keeps only original tracks + bonus original tracks.
-- - Song IDs: 40000001+ ; Edition IDs: 50000001+ (as requested).

-- Reset seeded scope (safe to re-run manually, but migrations run once).
DELETE FROM songs WHERE album_id IN ('20000002', '20000005');
DELETE FROM editions WHERE album_id IN ('20000002', '20000005');

-- Editions
INSERT OR REPLACE INTO editions (id, album_id, name, is_primary, release_at) VALUES
  ('50000001', '20000002', 'Standard', 1, NULL),
  ('50000002', '20000002', 'The Anthology (extra track listing)', 0, NULL),
  ('50000003', '20000005', 'Standard', 1, NULL),
  ('50000004', '20000005', 'Lavender & Japanese Editions (bonus tracks)', 0, NULL),
  ('50000005', '20000005', '3am Edition (bonus tracks)', 0, NULL),
  ('50000006', '20000005', 'Late Night Edition (bonus tracks)', 0, NULL);

-- Songs: The Tortured Poets Department (album_id = 20000002)
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
  ('40000001', 'Fortnight (featuring Post Malone)', '20000002', '[]', NULL, 228000, '50000001', 1, 1, NULL),
  ('40000002', 'The Tortured Poets Department', '20000002', '[]', NULL, 293000, '50000001', 1, 2, NULL),
  ('40000003', 'My Boy Only Breaks His Favorite Toys', '20000002', '[]', NULL, 203000, '50000001', 1, 3, NULL),
  ('40000004', 'Down Bad', '20000002', '[]', NULL, 261000, '50000001', 1, 4, NULL),
  ('40000005', 'So Long, London', '20000002', '[]', NULL, 262000, '50000001', 1, 5, NULL),
  ('40000006', 'But Daddy I Love Him', '20000002', '[]', NULL, 340000, '50000001', 1, 6, NULL),
  ('40000007', 'Fresh Out the Slammer', '20000002', '[]', NULL, 210000, '50000001', 1, 7, NULL),
  ('40000008', 'Florida!!! (featuring Florence and the Machine)', '20000002', '[]', NULL, 215000, '50000001', 1, 8, NULL),
  ('40000009', 'Guilty as Sin?', '20000002', '[]', NULL, 254000, '50000001', 1, 9, NULL),
  ('40000010', 'Who''s Afraid of Little Old Me?', '20000002', '[]', NULL, 334000, '50000001', 1, 10, NULL),
  ('40000011', 'I Can Fix Him (No Really I Can)', '20000002', '[]', NULL, 156000, '50000001', 1, 11, NULL),
  ('40000012', 'loml', '20000002', '[]', NULL, 277000, '50000001', 1, 12, NULL),
  ('40000013', 'I Can Do It with a Broken Heart', '20000002', '[]', NULL, 218000, '50000001', 1, 13, NULL),
  ('40000014', 'The Smallest Man Who Ever Lived', '20000002', '[]', NULL, 245000, '50000001', 1, 14, NULL),
  ('40000015', 'The Alchemy', '20000002', '[]', NULL, 196000, '50000001', 1, 15, NULL),
  ('40000016', 'Clara Bow', '20000002', '[]', NULL, 216000, '50000001', 1, 16, NULL),
  ('40000017', 'The Black Dog', '20000002', '[]', NULL, 238000, '50000002', 1, 17, NULL),
  ('40000018', 'imgonnagetyouback', '20000002', '[]', NULL, 222000, '50000002', 1, 18, NULL),
  ('40000019', 'The Albatross', '20000002', '[]', NULL, 183000, '50000002', 1, 19, NULL),
  ('40000020', 'Chloe or Sam or Sophia or Marcus', '20000002', '[]', NULL, 213000, '50000002', 1, 20, NULL),
  ('40000021', 'How Did It End?', '20000002', '[]', NULL, 238000, '50000002', 1, 21, NULL),
  ('40000022', 'So High School', '20000002', '[]', NULL, 228000, '50000002', 1, 22, NULL),
  ('40000023', 'I Hate It Here', '20000002', '[]', NULL, 243000, '50000002', 1, 23, NULL),
  ('40000024', 'Thank You Aimee', '20000002', '[]', NULL, 263000, '50000002', 1, 24, NULL),
  ('40000025', 'I Look in People''s Windows', '20000002', '[]', NULL, 131000, '50000002', 1, 25, NULL),
  ('40000026', 'The Prophecy', '20000002', '[]', NULL, 249000, '50000002', 1, 26, NULL),
  ('40000027', 'Cassandra', '20000002', '[]', NULL, 240000, '50000002', 1, 27, NULL),
  ('40000028', 'Peter', '20000002', '[]', NULL, 283000, '50000002', 1, 28, NULL),
  ('40000029', 'The Bolter', '20000002', '[]', NULL, 238000, '50000002', 1, 29, NULL),
  ('40000030', 'Robin', '20000002', '[]', NULL, 240000, '50000002', 1, 30, NULL),
  ('40000031', 'The Manuscript', '20000002', '[]', NULL, 224000, '50000002', 1, 31, NULL);

-- Songs: Midnights (album_id = 20000005)
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
  ('40000032', 'Lavender Haze', '20000005', '[]', NULL, 202000, '50000003', 1, 1, NULL),
  ('40000033', 'Maroon', '20000005', '[]', NULL, 218000, '50000003', 1, 2, NULL),
  ('40000034', 'Anti-Hero', '20000005', '[]', NULL, 200000, '50000003', 1, 3, NULL),
  ('40000035', 'Snow on the Beach (featuring Lana Del Rey)', '20000005', '[]', NULL, 256000, '50000003', 1, 4, NULL),
  ('40000036', 'You''re on Your Own, Kid', '20000005', '[]', NULL, 194000, '50000003', 1, 5, NULL),
  ('40000037', 'Midnight Rain', '20000005', '[]', NULL, 174000, '50000003', 1, 6, NULL),
  ('40000038', 'Question...?', '20000005', '[]', NULL, 210000, '50000003', 1, 7, NULL),
  ('40000039', 'Vigilante Shit', '20000005', '[]', NULL, 164000, '50000003', 1, 8, NULL),
  ('40000040', 'Bejeweled', '20000005', '[]', NULL, 194000, '50000003', 1, 9, NULL),
  ('40000041', 'Labyrinth', '20000005', '[]', NULL, 247000, '50000003', 1, 10, NULL),
  ('40000042', 'Karma', '20000005', '[]', NULL, 204000, '50000003', 1, 11, NULL),
  ('40000043', 'Sweet Nothing', '20000005', '[]', NULL, 188000, '50000003', 1, 12, NULL),
  ('40000044', 'Mastermind', '20000005', '[]', NULL, 191000, '50000003', 1, 13, NULL),
  ('40000045', 'Hits Different', '20000005', '[]', NULL, 234000, '50000004', 1, 14, NULL),
  ('40000046', 'The Great War', '20000005', '[]', NULL, 240000, '50000005', 1, 14, NULL),
  ('40000047', 'Bigger Than the Whole Sky', '20000005', '[]', NULL, 218000, '50000005', 1, 15, NULL),
  ('40000048', 'Paris', '20000005', '[]', NULL, 196000, '50000005', 1, 16, NULL),
  ('40000049', 'High Infidelity', '20000005', '[]', NULL, 231000, '50000005', 1, 17, NULL),
  ('40000050', 'Glitch', '20000005', '[]', NULL, 148000, '50000005', 1, 18, NULL),
  ('40000051', 'Would''ve, Could''ve, Should''ve', '20000005', '[]', NULL, 260000, '50000005', 1, 19, NULL),
  ('40000052', 'Dear Reader', '20000005', '[]', NULL, 225000, '50000005', 1, 20, NULL),
  ('40000053', 'You''re Losing Me (From the Vault)', '20000005', '[]', NULL, 278000, '50000006', 1, 19, NULL);
