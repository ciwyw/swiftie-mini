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
    '/albums/album_midnights/songs',
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
