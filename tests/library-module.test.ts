import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getFavoriteSongListItems,
  getLibraryHubEntries,
  getPerformanceList,
  getSongListItems,
  getSongVideoSection
} from '../utils/librarySelectors';
import { ROUTES } from '../utils/constants';
import { performances } from '../data/performances';

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

test('library hub exposes the five primary destinations in product order', () => {
  const entries = getLibraryHubEntries();

  assert.deepEqual(
    entries.map((entry) => entry.id),
    ['albums', 'songs', 'performances', 'documentaries', 'favorites']
  );
  assert.equal(entries[1]?.route, ROUTES.songList);
  assert.equal(entries[4]?.route, ROUTES.favorites);
});

test('library hub entry routes map to dedicated non-tab pages', () => {
  const entries = getLibraryHubEntries();

  assert.deepEqual(
    entries.map((entry) => entry.route),
    [
      ROUTES.album,
      ROUTES.songList,
      ROUTES.performanceList,
      ROUTES.documentaryList,
      ROUTES.favorites
    ]
  );
});

test('song list items expose album names and mv availability', () => {
  const song = getSongListItems().find((item) => item.id === 'song_anti_hero');

  assert.equal(song?.albumName, 'Midnights');
  assert.equal(song?.hasMv, true);
});

test('song list items resolve remapped album labels', () => {
  const items = getSongListItems();

  assert.equal(items.find((item) => item.id === 'song_tim_mcgraw')?.albumName, 'Taylor Swift');
  assert.equal(items.find((item) => item.id === 'song_mirrorball')?.albumName, 'folklore');
  assert.equal(items.find((item) => item.id === 'song_long_live')?.albumName, 'Speak Now');
  assert.equal(items.find((item) => item.id === 'song_new_romantics')?.albumName, '1989');
});

test('song video section returns mv plus related non-tour performances only', () => {
  const section = getSongVideoSection('song_all_too_well');

  assert.equal(section.mv?.title, 'All Too Well: The Short Film');
  assert.deepEqual(
    section.performances.map((item) => item.eventName),
    ['Grammy Awards']
  );
});

test('song video section hides mv when the song has no video asset', () => {
  const section = getSongVideoSection('song_love_story');

  assert.equal(section.mv, null);
  assert.deepEqual(section.performances, []);
});

test('performance selectors honor the explicit library domain contract', () => {
  const tourPerformance = {
    id: 'performance_tour_fan_cam',
    title: 'All Too Well',
    songIds: ['song_all_too_well'],
    kind: 'live' as const,
    domain: 'tour' as const,
    eventName: 'Eras Tour',
    year: 2024,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'Fan Cam',
    duration: '10:00',
    summary: 'A tour recording that should stay out of the library selectors.'
  };

  performances.push(tourPerformance);

  try {
    const performanceIds = getPerformanceList().map((item) => item.id);

    assert.deepEqual(performanceIds, [
      'performance_grammys_all_too_well',
      'performance_iheart_anti_hero',
      'performance_bbc_holy_ground'
    ]);
    assert.ok(getPerformanceList().every((item) => item.domain === 'library'));
    assert.ok(getPerformanceList().every((item) => item.kind === 'live'));
    assert.deepEqual(getSongVideoSection('song_all_too_well').performances.map((item) => item.id), [
      'performance_grammys_all_too_well'
    ]);
  } finally {
    performances.pop();
  }
});

test('revisit-only special and interview records stay out of generic live surfaces', () => {
  assert.equal(performances.find((item) => item.id === 'performance_long_pond_session')?.kind, 'special');
  assert.equal(
    performances.find((item) => item.id === 'performance_midnights_release_interview')?.kind,
    'interview'
  );
  assert.ok(getPerformanceList().every((item) => item.id !== 'performance_long_pond_session'));
  assert.ok(
    getPerformanceList().every((item) => item.id !== 'performance_midnights_release_interview')
  );
  assert.ok(
    getSongVideoSection('song_anti_hero').performances.every(
      (item) => item.id !== 'performance_midnights_release_interview'
    )
  );
});

test('favorites selector returns stored songs in storage order with mv metadata preserved', () => {
  wx.setStorageSync('favoriteSongIds', ['song_anti_hero', 'song_all_too_well']);

  const favorites = getFavoriteSongListItems();

  assert.deepEqual(favorites.map((item) => item.id), ['song_anti_hero', 'song_all_too_well']);
  assert.equal(favorites[0]?.hasMv, true);
  assert.equal(favorites[1]?.hasMv, true);
});

test('favorite song list items stay empty when storage is empty', () => {
  wx.setStorageSync('favoriteSongIds', []);

  assert.deepEqual(getFavoriteSongListItems(), []);
});
