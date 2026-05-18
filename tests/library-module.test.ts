import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clearContentStoreCache, loadAlbumList, loadSinglesListPage } from '../services/contentStore';
import { ROUTES } from '../utils/constants';

const storage = new Map<string, unknown>();

(globalThis as unknown as { wx: typeof wx }).wx = {
  navigateTo() {},
  switchTab() {},
  showToast() {},
  getStorageSync(key: string) {
    return storage.get(key);
  },
  setStorageSync(key: string, data: unknown) {
    storage.set(key, data);
  }
};

test('library page exposes the five primary destinations in product order', async () => {
  type LibraryPageConfig = {
    data: {
      entries: Array<{ id: string; route: string }>;
    };
    setData: (patch: Partial<LibraryPageConfig['data']>) => void;
    onLoad: () => void;
    goEntry: (event: { currentTarget: { dataset: { route: string } } }) => void;
  };

  let pageConfig: LibraryPageConfig | undefined;
  const navigateToCalls: Array<{ url: string }> = [];
  (globalThis as typeof globalThis & { Page?: unknown }).Page = ((config: LibraryPageConfig) => {
    pageConfig = config;
  }) as unknown as typeof Page;
  (globalThis as typeof globalThis & { wx?: typeof wx }).wx = {
    ...(globalThis as unknown as { wx: typeof wx }).wx,
    navigateTo(options: { url: string }) {
      navigateToCalls.push(options);
    }
  };

  await import(new URL('../pages/library/index.ts?library-page-test', import.meta.url).href);

  assert.ok(pageConfig);
  pageConfig.setData = function setData(patch) {
    this.data = { ...this.data, ...patch };
  };
  pageConfig.onLoad.call(pageConfig);
  assert.deepEqual(
    pageConfig.data.entries.map((entry) => entry.id),
    ['albums', 'singles', 'songs', 'performances', 'documentaries', 'favorites']
  );
  assert.deepEqual(
    pageConfig.data.entries.map((entry) => entry.route),
    [
      ROUTES.album,
      `${ROUTES.songList}?scope=singles`,
      ROUTES.songList,
      ROUTES.performanceList,
      ROUTES.documentaryList,
      ROUTES.favorites
    ]
  );

  pageConfig.goEntry({ currentTarget: { dataset: { route: ROUTES.songList } } });
  assert.deepEqual(navigateToCalls, [{ url: ROUTES.songList }]);
});

test('song list page loads songs from remote interfaces and maps album names with mv flags', async () => {
  type SongListPageConfig = {
    data: {
      songs: Array<{ id: string; name: string; albumName: string; hasMv: boolean }>;
      sections: Array<{
        letter: string;
        sectionId: string;
        songs: Array<{ id: string; name: string }>;
      }>;
      letterIndexes: Array<{ letter: string; sectionId: string; disabled: boolean }>;
      scrollIntoView: string;
      isLoading: boolean;
      loadError: boolean;
    };
    setData: (patch: Partial<SongListPageConfig['data']>) => void;
    onLoad: (options: { scope?: string }) => void | Promise<void>;
    retryLoad: () => Promise<void>;
    goLetter: (event: { currentTarget: { dataset: { sectionId?: string } } }) => void;
  };

  let pageConfig: SongListPageConfig | undefined;
  const requestUrls: string[] = [];
  clearContentStoreCache();

  (globalThis as typeof globalThis & { Page?: unknown }).Page = ((config: SongListPageConfig) => {
    pageConfig = config;
  }) as unknown as typeof Page;
  (globalThis as typeof globalThis & { wx?: unknown }).wx = {
    ...(globalThis as unknown as { wx: typeof wx }).wx,
    setNavigationBarTitle() {},
    request(options: {
      url: string;
      success: (result: { statusCode: number; data: unknown }) => void;
      fail: (error: Error) => void;
    }) {
      requestUrls.push(options.url);
      if (options.url.endsWith('/songs')) {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: [
              {
                id: 'song_ready_for_it',
                name: '...Ready For It?',
                albumId: 'album_reputation',
                lyrics: [],
                mv: {
                  title: '...Ready For It?',
                  cover: 'https://cdn.example/ready-for-it.png',
                  source: 'YouTube',
                  duration: '3:55'
                }
              },
              {
                id: 'song_tim_mcgraw',
                name: 'Tim McGraw',
                albumId: 'album_taylor_swift',
                lyrics: []
              },
              {
                id: 'song_anti_hero',
                name: 'Anti-Hero',
                albumId: 'album_midnights',
                lyrics: [],
                mv: {
                  title: 'Anti-Hero (Official Music Video)',
                  cover: 'https://cdn.example/anti-hero.png',
                  source: 'YouTube',
                  duration: '5:10'
                }
              },
              {
                id: 'song_carolina',
                name: 'Carolina',
                year: 2022,
                artistCredit: 'Taylor Swift',
                lyrics: []
              }
            ]
          }
        });
        return;
      }

      if (options.url.endsWith('/albums')) {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: [
              { id: 'album_midnights', name: 'Midnights', year: 2022, cover: 'https://cdn.example/midnights.png' },
              { id: 'album_reputation', name: 'Reputation', year: 2017, cover: 'https://cdn.example/reputation.png' },
              { id: 'album_taylor_swift', name: 'Taylor Swift', year: 2006, cover: 'https://cdn.example/debut.png' }
            ]
          }
        });
        return;
      }

      options.fail(new Error(`Unhandled request: ${options.url}`));
    }
  } as unknown as typeof wx;

  await import(new URL('../pages/song-list/index.ts?song-list-page-test', import.meta.url).href);

  assert.ok(pageConfig);
  pageConfig.setData = function setData(patch) {
    this.data = { ...this.data, ...patch };
  };
  await pageConfig.onLoad.call(pageConfig, {});

  assert.deepEqual(requestUrls.map((url) => url.replace(/^https?:\/\/[^/]+/, '')), ['/songs', '/albums']);
  assert.deepEqual(pageConfig.data.songs.map((item) => ({
    id: item.id,
    name: item.name,
    albumName: item.albumName,
    hasMv: item.hasMv
  })), [
    {
      id: 'song_anti_hero',
      name: 'Anti-Hero',
      albumName: 'Midnights',
      hasMv: true
    },
    {
      id: 'song_carolina',
      name: 'Carolina',
      albumName: 'Taylor Swift',
      hasMv: false
    },
    {
      id: 'song_ready_for_it',
      name: '...Ready For It?',
      albumName: 'Reputation',
      hasMv: true
    },
    {
      id: 'song_tim_mcgraw',
      name: 'Tim McGraw',
      albumName: 'Taylor Swift',
      hasMv: false
    }
  ]);
  assert.deepEqual(
    pageConfig.data.sections.map((section) => ({
      letter: section.letter,
      sectionId: section.sectionId,
      firstSongId: section.songs[0]?.id
    })),
    [
      { letter: 'A', sectionId: 'song-section-a', firstSongId: 'song_anti_hero' },
      { letter: 'C', sectionId: 'song-section-c', firstSongId: 'song_carolina' },
      { letter: 'R', sectionId: 'song-section-r', firstSongId: 'song_ready_for_it' },
      { letter: 'T', sectionId: 'song-section-t', firstSongId: 'song_tim_mcgraw' }
    ]
  );
  assert.deepEqual(
    pageConfig.data.letterIndexes.filter((item) => !item.disabled).map((item) => item.letter),
    ['A', 'C', 'R', 'T']
  );
  pageConfig.goLetter.call(pageConfig, {
    currentTarget: { dataset: { sectionId: pageConfig.data.sections[2]?.sectionId } }
  });
  assert.equal(pageConfig.data.scrollIntoView, pageConfig.data.sections[2]?.sectionId);
  assert.equal(pageConfig.data.isLoading, false);
  assert.equal(pageConfig.data.loadError, false);
});

test('singles list data prefers artist credit over release year for standalone songs', async () => {
  const requestUrls: string[] = [];
  clearContentStoreCache();

  (globalThis as typeof globalThis & { wx?: unknown }).wx = {
    ...(globalThis as unknown as { wx: typeof wx }).wx,
    request(options: {
      url: string;
      success: (result: { statusCode: number; data: unknown }) => void;
      fail: (error: Error) => void;
    }) {
      requestUrls.push(options.url);
      if (options.url.endsWith('/singles')) {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: [
              {
                id: 'song_the_joker_and_the_queen',
                name: 'The Joker and the Queen',
                year: 2022,
                artistCredit: 'Ed Sheeran feat. Taylor Swift',
                lyrics: []
              },
              {
                id: 'song_carolina',
                name: 'Carolina',
                year: 2022,
                artistCredit: 'Taylor Swift',
                lyrics: []
              }
            ]
          }
        });
        return;
      }

      if (options.url.endsWith('/albums')) {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: []
          }
        });
        return;
      }

      options.fail(new Error(`Unhandled request: ${options.url}`));
    }
  } as unknown as typeof wx;

  const songs = await loadSinglesListPage();

  assert.deepEqual(requestUrls.map((url) => url.replace(/^https?:\/\/[^/]+/, '')), ['/singles', '/albums']);
  assert.deepEqual(songs.map((item) => ({
    id: item.id,
    albumName: item.albumName,
    hasMv: item.hasMv
  })), [
    {
      id: 'song_the_joker_and_the_queen',
      albumName: 'Ed Sheeran feat. Taylor Swift',
      hasMv: false
    },
    {
      id: 'song_carolina',
      albumName: 'Taylor Swift',
      hasMv: false
    }
  ]);
});

test('album list sorts releases by year from newest to oldest', async () => {
  const requestUrls: string[] = [];
  clearContentStoreCache();

  (globalThis as typeof globalThis & { wx?: unknown }).wx = {
    ...(globalThis as unknown as { wx: typeof wx }).wx,
    request(options: {
      url: string;
      success: (result: { statusCode: number; data: unknown }) => void;
      fail: (error: Error) => void;
    }) {
      requestUrls.push(options.url);

      if (options.url.endsWith('/albums')) {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: [
              { id: 'album_fearless', name: 'Fearless', year: 2008, cover: 'https://cdn.example/fearless.png' },
              { id: 'album_midnights', name: 'Midnights', year: 2022, cover: 'https://cdn.example/midnights.png' },
              { id: 'album_red_tv', name: 'Red (Taylor\'s Version)', year: 2021, cover: 'https://cdn.example/red-tv.png' }
            ]
          }
        });
        return;
      }

      options.fail(new Error(`Unhandled request: ${options.url}`));
    }
  } as unknown as typeof wx;

  const albums = await loadAlbumList();

  assert.deepEqual(requestUrls.map((url) => url.replace(/^https?:\/\/[^/]+/, '')), ['/albums']);
  assert.deepEqual(
    albums.map((album) => ({ id: album.id, year: album.year })),
    [
      { id: 'album_midnights', year: 2022 },
      { id: 'album_red_tv', year: 2021 },
      { id: 'album_fearless', year: 2008 }
    ]
  );
});

test('favorites page loads remote songs and keeps local favorite order', async () => {
  type FavoritesPageConfig = {
    data: {
      favorites: Array<{ id: string; albumName: string; hasMv: boolean }>;
      isLoading: boolean;
      loadError: boolean;
    };
    setData: (patch: Partial<FavoritesPageConfig['data']>) => void;
    onShow: () => void | Promise<void>;
  };

  let pageConfig: FavoritesPageConfig | undefined;
  storage.set('favoriteSongIds', ['song_carolina', 'song_all_too_well', 'song_anti_hero']);
  clearContentStoreCache();

  (globalThis as typeof globalThis & { Page?: unknown }).Page = ((config: FavoritesPageConfig) => {
    pageConfig = config;
  }) as unknown as typeof Page;
  (globalThis as typeof globalThis & { wx?: unknown }).wx = {
    ...(globalThis as unknown as { wx: typeof wx }).wx,
    request(options: {
      url: string;
      success: (result: { statusCode: number; data: unknown }) => void;
      fail: (error: Error) => void;
    }) {
      if (options.url.endsWith('/songs')) {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: [
              { id: 'song_carolina', name: 'Carolina', year: 2022, artistCredit: 'Taylor Swift', lyrics: [] },
              { id: 'song_anti_hero', name: 'Anti-Hero', albumId: 'album_midnights', lyrics: [], mv: { title: 'Anti-Hero', cover: 'https://cdn.example/anti-hero.png', source: 'YouTube', duration: '5:10' } },
              { id: 'song_all_too_well', name: 'All Too Well', albumId: 'album_red', lyrics: [], mv: { title: 'All Too Well', cover: 'https://cdn.example/atw.png', source: 'YouTube', duration: '14:56' } }
            ]
          }
        });
        return;
      }

      if (options.url.endsWith('/albums')) {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: [
              { id: 'album_midnights', name: 'Midnights', year: 2022, cover: 'https://cdn.example/midnights.png' },
              { id: 'album_red', name: 'Red (Taylor\'s Version)', year: 2021, cover: 'https://cdn.example/red.png' }
            ]
          }
        });
        return;
      }

      options.fail(new Error(`Unhandled request: ${options.url}`));
    }
  } as unknown as typeof wx;

  await import(new URL('../pages/favorites/index.ts?favorites-page-test', import.meta.url).href);

  assert.ok(pageConfig);
  pageConfig.setData = function setData(patch) {
    this.data = { ...this.data, ...patch };
  };
  await pageConfig.onShow.call(pageConfig);

  assert.deepEqual(pageConfig.data.favorites.map((item) => ({
    id: item.id,
    albumName: item.albumName,
    hasMv: item.hasMv
  })), [
    {
      id: 'song_carolina',
      albumName: 'Taylor Swift',
      hasMv: false
    },
    {
      id: 'song_all_too_well',
      albumName: 'Red (Taylor\'s Version)',
      hasMv: true
    },
    {
      id: 'song_anti_hero',
      albumName: 'Midnights',
      hasMv: true
    }
  ]);
  assert.equal(pageConfig.data.isLoading, false);
  assert.equal(pageConfig.data.loadError, false);
});

test('song list and favorites templates do not depend on local-only placeholder copy', () => {
  const songListTemplate = readFileSync(new URL('../pages/song-list/index.wxml', import.meta.url), 'utf8');
  const favoritesTemplate = readFileSync(new URL('../pages/favorites/index.wxml', import.meta.url), 'utf8');
  const albumTemplate = readFileSync(new URL('../pages/album/index.wxml', import.meta.url), 'utf8');

  assert.match(songListTemplate, /wx:for="{{sections}}"/);
  assert.match(favoritesTemplate, /wx:for="{{favorites}}"/);
  assert.doesNotMatch(albumTemplate, /track\.displayName/);
  assert.match(albumTemplate, /track\.song\.name/);
});
