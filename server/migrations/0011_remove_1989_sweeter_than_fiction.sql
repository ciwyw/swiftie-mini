DELETE FROM songs
WHERE id = '40000075'
   OR (album_id = '20000003' AND edition_id = '50000008' AND name = 'Sweeter than Fiction');

DELETE FROM editions
WHERE id = '50000008'
   OR (album_id = '20000003' AND name = 'Tangerine LP edition (bonus track)');
