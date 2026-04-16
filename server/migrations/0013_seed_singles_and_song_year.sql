ALTER TABLE songs ADD COLUMN year INTEGER;

DELETE FROM songs
WHERE album_id IS NULL
  AND name IN (
    'Half of My Heart',
    'Two Is Better Than One',
    'Crazier',
    'Safe & Sound',
    'Eyes Open',
    'Both of Us',
    'Highway Don''t Care',
    'Sweeter Than Fiction',
    'I Don''t Wanna Live Forever',
    'Beautiful Ghosts',
    'Macavity',
    'Christmas Tree Farm',
    'Only The Young',
    'Gasoline',
    'Renegade',
    'Birch',
    'The Joker and the Queen',
    'Carolina',
    'The Alcott',
    'All Of The Girls You Loved Before',
    'us.'
  );

INSERT OR REPLACE INTO songs (
  id,
  name,
  album_id,
  lyrics_json,
  mv_json,
  duration_ms,
  year
) VALUES
  ('40000246', 'Half of My Heart', NULL, '[]', NULL, 250000, 2009),
  ('40000247', 'Two Is Better Than One', NULL, '[]', NULL, 243000, 2009),
  ('40000248', 'Crazier', NULL, '[]', NULL, 191000, 2009),
  ('40000249', 'Safe & Sound', NULL, '[]', NULL, 241000, 2011),
  ('40000250', 'Eyes Open', NULL, '[]', NULL, 244000, 2012),
  ('40000251', 'Both of Us', NULL, '[]', NULL, 216000, 2012),
  ('40000252', 'Highway Don''t Care', NULL, '[]', NULL, 289000, 2013),
  ('40000253', 'Sweeter Than Fiction', NULL, '[]', NULL, 235000, 2013),
  ('40000254', 'I Don''t Wanna Live Forever', NULL, '[]', NULL, 245000, 2016),
  ('40000255', 'Beautiful Ghosts', NULL, '[]', NULL, 261000, 2019),
  ('40000256', 'Macavity', NULL, '[]', NULL, 221000, 2019),
  ('40000257', 'Christmas Tree Farm', NULL, '[]', NULL, 228000, 2019),
  ('40000258', 'Only The Young', NULL, '[]', NULL, 157000, 2020),
  ('40000259', 'Gasoline', NULL, '[]', NULL, 236000, 2021),
  ('40000260', 'Renegade', NULL, '[]', NULL, 261000, 2021),
  ('40000261', 'Birch', NULL, '[]', NULL, 270000, 2021),
  ('40000262', 'The Joker and the Queen', NULL, '[]', NULL, 185000, 2022),
  ('40000263', 'Carolina', NULL, '[]', NULL, 264000, 2022),
  ('40000264', 'The Alcott', NULL, '[]', NULL, 273000, 2023),
  ('40000265', 'All Of The Girls You Loved Before', NULL, '[]', NULL, 221000, 2023),
  ('40000266', 'us.', NULL, '[]', NULL, 242000, 2024);
