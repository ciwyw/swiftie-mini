ALTER TABLE songs ADD COLUMN artist_credit TEXT;

UPDATE songs
SET artist_credit = CASE name
  WHEN 'Half of My Heart' THEN 'John Mayer feat. Taylor Swift'
  WHEN 'Two Is Better Than One' THEN 'Boys Like Girls feat. Taylor Swift'
  WHEN 'Crazier' THEN 'Taylor Swift'
  WHEN 'Safe & Sound' THEN 'Taylor Swift feat. The Civil Wars'
  WHEN 'Eyes Open' THEN 'Taylor Swift'
  WHEN 'Both of Us' THEN 'B.o.B feat. Taylor Swift'
  WHEN 'Highway Don''t Care' THEN 'Tim McGraw & Taylor Swift'
  WHEN 'Sweeter Than Fiction' THEN 'Taylor Swift'
  WHEN 'I Don''t Wanna Live Forever' THEN 'ZAYN & Taylor Swift'
  WHEN 'Beautiful Ghosts' THEN 'Taylor Swift'
  WHEN 'Macavity' THEN 'Taylor Swift'
  WHEN 'Christmas Tree Farm' THEN 'Taylor Swift'
  WHEN 'Only The Young' THEN 'Taylor Swift'
  WHEN 'Gasoline' THEN 'HAIM feat. Taylor Swift'
  WHEN 'Renegade' THEN 'Big Red Machine feat. Taylor Swift'
  WHEN 'Birch' THEN 'Big Red Machine feat. Taylor Swift'
  WHEN 'The Joker and the Queen' THEN 'Ed Sheeran feat. Taylor Swift'
  WHEN 'Carolina' THEN 'Taylor Swift'
  WHEN 'The Alcott' THEN 'The National feat. Taylor Swift'
  WHEN 'All Of The Girls You Loved Before' THEN 'Taylor Swift'
  WHEN 'us.' THEN 'Gracie Abrams feat. Taylor Swift'
  ELSE artist_credit
END
WHERE album_id IS NULL;
