import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index';

const TOUR_IDS = {
  eras: '48291357'
} as const;

interface QueryResult<T = Record<string, unknown>> {
  results: T[];
}

class FakePreparedStatement {
  constructor(private readonly result: QueryResult | Record<string, unknown> | null = { results: [] }) {}

  bind(..._values: unknown[]) {
    return this;
  }

  async all<T = Record<string, unknown>>(): Promise<QueryResult<T>> {
    if (this.result && 'results' in this.result) {
      return this.result as QueryResult<T>;
    }

    return { results: [] };
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    if (this.result && !('results' in this.result)) {
      return this.result as T;
    }

    return null;
  }
}

class FakeDb {
  prepare(_query: string) {
    return new FakePreparedStatement();
  }
}

class QueryMapDb {
  constructor(private readonly queries: Record<string, QueryResult | Record<string, unknown> | null>) {}

  prepare(query: string) {
    return new FakePreparedStatement(this.queries[query] ?? { results: [] });
  }
}

type TestEnv = {
  DB: FakeDb;
};

async function requestJson(path: string, env: TestEnv = { DB: new FakeDb() }) {
  const response = await worker.fetch(new Request(`https://example.com${path}`), env);
  return {
    response,
    body: await response.json()
  };
}

test('health endpoint reports ok', async () => {
  const { response, body } = await requestJson('/health');

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    code: 0,
    data: { ok: true }
  });
});

test('home endpoint returns empty arrays when the database is empty', async () => {
  const { response, body } = await requestJson('/home');

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    code: 0,
    data: {
      spotlights: [],
      eras: [],
      news: []
    }
  });
});

test('list endpoints return empty arrays when the database is empty', async () => {
  const listPaths = [
    '/albums',
    '/songs',
    '/singles',
    '/albums/album_midnights/songs',
    '/albums/album_midnights/editions',
    '/editions/edition_album_midnights_standard/tracks',
    '/performances',
    '/documentaries',
    '/tours',
    `/tours/${TOUR_IDS.eras}/shows`,
    '/shows/show_tokyo_n1/videos'
  ];

  for (const path of listPaths) {
    const { response, body } = await requestJson(path);
    assert.equal(response.status, 200, path);
    assert.deepEqual(body, { code: 0, data: [] }, path);
  }
});

test('detail endpoints return null when the database is empty', async () => {
  const detailPaths = [
    '/albums/album_midnights',
    '/songs/song_anti_hero',
    '/eras/era_midnights',
    `/tours/${TOUR_IDS.eras}`,
    '/shows/show_tokyo_n1'
  ];

  for (const path of detailPaths) {
    const { response, body } = await requestJson(path);
    assert.equal(response.status, 200, path);
    assert.deepEqual(body, { code: 0, data: null }, path);
  }
});

test('unknown routes return a 404 payload', async () => {
  const { response, body } = await requestJson('/unknown');

  assert.equal(response.status, 404);
  assert.deepEqual(body, {
    code: -1,
    data: null
  });
});

test('song and album endpoints prefix image asset paths in response payloads', async () => {
  const env = {
    DB: new QueryMapDb({
      'SELECT id, name, year, cover, announcement_at, release_at, kind FROM albums WHERE id = ?': {
        id: 'album_midnights',
        name: 'Midnights',
        year: 2022,
        cover: '/assets/images/albums/album-midnights.png',
        announcement_at: null,
        release_at: null,
        kind: 'album'
      },
      'SELECT id, name, album_id, year, artist_credit, duration_ms, lyrics_json, mv_json FROM songs WHERE id = ?': {
        id: 'song_anti_hero',
        name: 'Anti-Hero',
        album_id: 'album_midnights',
        year: null,
        artist_credit: null,
        duration_ms: null,
        lyrics_json: '[]',
        mv_json: JSON.stringify({
          title: 'Anti-Hero (Official Music Video)',
          cover: '/assets/images/ui/avatar-placeholder.png',
          source: 'YouTube',
          duration: '5:10'
        })
      }
    })
  };

  const albumResult = await requestJson('/albums/album_midnights', env);
  const songResult = await requestJson('/songs/song_anti_hero', env);

  assert.deepEqual(albumResult.body, {
    code: 0,
    data: {
      id: 'album_midnights',
      name: 'Midnights',
      year: 2022,
      cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/albums/album-midnights.png',
      kind: 'album'
    }
  });
  assert.deepEqual(songResult.body, {
    code: 0,
    data: {
      id: 'song_anti_hero',
      name: 'Anti-Hero',
      albumId: 'album_midnights',
      lyrics: [],
      mv: {
        title: 'Anti-Hero (Official Music Video)',
        cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/ui/avatar-placeholder.png',
        source: 'YouTube',
        duration: '5:10'
      }
    }
  });
});

test('singles endpoint returns artist credit for standalone songs', async () => {
  const env = {
    DB: new QueryMapDb({
      'SELECT id, name, album_id, year, artist_credit, duration_ms, lyrics_json, mv_json FROM songs WHERE album_id IS NULL ORDER BY year ASC, id ASC': {
        results: [
          {
            id: 'song_carolina',
            name: 'Carolina',
            album_id: null,
            year: 2022,
            artist_credit: 'Taylor Swift',
            duration_ms: 264000,
            lyrics_json: '[]',
            mv_json: null
          },
          {
            id: 'song_the_joker_and_the_queen',
            name: 'The Joker and the Queen',
            album_id: null,
            year: 2022,
            artist_credit: 'Ed Sheeran feat. Taylor Swift',
            duration_ms: 185000,
            lyrics_json: '[]',
            mv_json: null
          }
        ]
      }
    })
  };

  const { response, body } = await requestJson('/singles', env);

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    code: 0,
    data: [
      {
        id: 'song_carolina',
        name: 'Carolina',
        year: 2022,
        artistCredit: 'Taylor Swift',
        durationMs: 264000,
        lyrics: []
      },
      {
        id: 'song_the_joker_and_the_queen',
        name: 'The Joker and the Queen',
        year: 2022,
        artistCredit: 'Ed Sheeran feat. Taylor Swift',
        durationMs: 185000,
        lyrics: []
      }
    ]
  });
});

test('edition tracks endpoint no longer exposes display names', async () => {
  const env = {
    DB: new QueryMapDb({
      'SELECT edition_id, id AS song_id, disc_no, track_no FROM songs WHERE edition_id = ? ORDER BY disc_no ASC, track_no ASC, id ASC': {
        results: [
          {
            edition_id: 'edition_midnights_standard',
            song_id: 'song_lavender_haze',
            disc_no: 1,
            track_no: 1
          }
        ]
      }
    })
  };

  const { response, body } = await requestJson('/editions/edition_midnights_standard/tracks', env);

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    code: 0,
    data: [
      {
        editionId: 'edition_midnights_standard',
        songId: 'song_lavender_haze',
        discNo: 1,
        trackNo: 1
      }
    ]
  });
});

test('server also prefixes non-assets relative image paths from content data', async () => {
  const env = {
    DB: new QueryMapDb({
      'SELECT id, name, status, cover, description, announcement_at, start_at, end_at, total, cancelled, album_ids_json, setlists_json FROM tours WHERE id = ?': {
        id: TOUR_IDS.eras,
        name: 'The Eras Tour',
        status: 1,
        cover: '/tours/eras.jpg',
        description: 'tour image path should resolve to CDN',
        announcement_at: null,
        start_at: 1772294400000,
        end_at: 1788019200000,
        total: 0,
        cancelled: 0,
        album_ids_json: '[]',
        setlists_json: '[]'
      }
    })
  };

  const result = await requestJson(`/tours/${TOUR_IDS.eras}`, env);

  assert.deepEqual(result.body, {
    code: 0,
    data: {
      id: TOUR_IDS.eras,
      name: 'The Eras Tour',
      status: 1,
      cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/tours/eras.jpg',
      description: 'tour image path should resolve to CDN',
      startAt: 1772294400000,
      endAt: 1788019200000,
      total: 0,
      cancelled: 0,
      albumIds: [],
      setlists: []
    }
  });
});

test('tour endpoints expose total and cancelled counts', async () => {
  const tourRecord = {
    id: TOUR_IDS.eras,
    name: 'The Eras Tour',
    status: 1,
    cover: '/tours/eras.jpg',
    description: 'tour stats should be exposed',
    announcement_at: null,
    start_at: 1772294400000,
    end_at: 1788019200000,
    total: 152,
    cancelled: 3,
    album_ids_json: '[]',
    setlists_json: '[]'
  };
  const env = {
    DB: new QueryMapDb({
      'SELECT id, name, status, cover, description, announcement_at, start_at, end_at, total, cancelled, album_ids_json, setlists_json FROM tours WHERE id = ?': tourRecord,
      'SELECT id, name, status, cover, description, announcement_at, start_at, end_at, total, cancelled, album_ids_json, setlists_json FROM tours ORDER BY start_at DESC, id ASC': {
        results: [tourRecord]
      }
    })
  };

  const detailResult = await requestJson(`/tours/${TOUR_IDS.eras}`, env);
  const listResult = await requestJson('/tours', env);

  assert.deepEqual(detailResult.body, {
    code: 0,
    data: {
      id: TOUR_IDS.eras,
      name: 'The Eras Tour',
      status: 1,
      cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/tours/eras.jpg',
      description: 'tour stats should be exposed',
      startAt: 1772294400000,
      endAt: 1788019200000,
      total: 152,
      cancelled: 3,
      albumIds: [],
      setlists: []
    }
  });
  assert.deepEqual(listResult.body, {
    code: 0,
    data: [
      {
        id: TOUR_IDS.eras,
        name: 'The Eras Tour',
        status: 1,
        cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/tours/eras.jpg',
        description: 'tour stats should be exposed',
        startAt: 1772294400000,
        endAt: 1788019200000,
        total: 152,
        cancelled: 3,
        albumIds: [],
        setlists: []
      }
    ]
  });
});

test('show endpoints expose opening acts and normalize surprise songs without song ids', async () => {
  const showRecord = {
    id: 'show_glendale_n1',
    tour_id: TOUR_IDS.eras,
    country: 'United States',
    city: 'Glendale',
    venue: 'State Farm Stadium',
    start_at: 1679011200000,
    status: 'ended',
    opening_act: 'Paramore / Gayle',
    ticket_platform: null,
    sale_at: null,
    entry_time: null,
    address: null,
    seat_map_images_json: null,
    notes_json: null,
    surprise_guests_json: null,
    surprise_songs_json: JSON.stringify(['Mirrorball', 'Tim McGraw'])
  };
  const env = {
    DB: new QueryMapDb({
      'SELECT id, tour_id, country, city, venue, start_at, status, opening_act, ticket_platform, sale_at, entry_time, address, seat_map_images_json, notes_json, surprise_guests_json, surprise_songs_json FROM shows WHERE id = ?': showRecord,
      'SELECT id, tour_id, country, city, venue, start_at, status, opening_act, ticket_platform, sale_at, entry_time, address, seat_map_images_json, notes_json, surprise_guests_json, surprise_songs_json FROM shows WHERE tour_id = ? ORDER BY start_at ASC, id ASC': {
        results: [showRecord]
      }
    })
  };

  const detailResult = await requestJson('/shows/show_glendale_n1', env);
  const listResult = await requestJson(`/tours/${TOUR_IDS.eras}/shows`, env);

  const expectedShow = {
    id: 'show_glendale_n1',
    tourId: TOUR_IDS.eras,
    country: 'United States',
    city: 'Glendale',
    venue: 'State Farm Stadium',
    startAt: 1679011200000,
    status: 'ended',
    openingAct: 'Paramore / Gayle',
    seatMapImages: [],
    notes: [],
    surpriseGuests: [],
    surpriseSongs: [
      { name: 'Mirrorball' },
      { name: 'Tim McGraw' }
    ]
  };

  assert.deepEqual(detailResult.body, { code: 0, data: expectedShow });
  assert.deepEqual(listResult.body, { code: 0, data: [expectedShow] });
});
