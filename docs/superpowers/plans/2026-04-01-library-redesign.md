# Library Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the library tab into an entry-first content hub with dedicated songs, live performances, documentaries, collections, and favorites flows while keeping MV attached to songs.

**Architecture:** Keep the existing mini-program page structure, but separate new library-domain mock data and selectors from tour-domain video data. Use thin page controllers backed by pure selector/helper functions so the new library flows can be covered by Node-side tests and verified with TypeScript plus WeChat manual QA.

**Tech Stack:** WeChat Mini Program native pages, TypeScript, WXML, WXSS, local mock data in `data/`, storage helpers in `utils/storage.ts`, Node `tsx --test`, `tsc --noEmit`

> **Execution note:** This plan intentionally omits git commit steps because the current project context explicitly disallows git operations and the workspace is not a git repository.

---

## File Structure

### Files to Modify

- `app.json`
  Register the new non-tab pages so the library hub can navigate into songs, performances, documentaries, collections, and favorites.
- `package.json`
  Add a dedicated library test script instead of reusing the tour-only script.
- `types/song.ts`
  Extend `Song` to hold optional MV metadata while preserving the current lyric structure.
- `data/songs.ts`
  Add MV metadata to selected songs used in the first-pass library experience.
- `pages/library/index.ts`
  Replace the current album-plus-song list assembly with entry-card data.
- `pages/library/index.wxml`
  Replace the long lists with hub cards.
- `pages/library/index.wxss`
  Style the hub layout.
- `pages/album/index.ts`
  Support both album-list mode and album-detail mode, and expose MV availability in album song rows.
- `pages/album/index.wxml`
  Render either the album list or the selected album detail, and add `MV` labels to songs that have attached video.
- `pages/song/index.ts`
  Load MV and related non-tour performances for the selected song.
- `pages/song/index.wxml`
  Render the new `视频内容` module and keep it hidden when empty.
- `pages/song/index.wxss`
  Add styles for the new video content block.
- `pages/profile/index.ts`
  Replace the full favorites list with a summary card and navigation entry.
- `pages/profile/index.wxml`
  Remove the inline favorites list and add the summary/entry UI.
- `pages/profile/index.wxss`
  Style the new summary block.
- `utils/constants.ts`
  Add route constants for all new library pages.

### Files to Create

- `types/library.ts`
  Shared types for performances, documentaries, collections, collection items, and library hub entries.
- `data/performances.ts`
  Non-tour live performance mock data.
- `data/documentaries.ts`
  Long-form content mock data.
- `data/collections.ts`
  Mood and editorial collection mock data.
- `utils/librarySelectors.ts`
  Pure selectors/helpers for the new library domain.
- `tests/library-module.test.ts`
  Automated coverage for selectors and derived view data.
- `pages/song-list/index.json`
- `pages/song-list/index.ts`
- `pages/song-list/index.wxml`
- `pages/song-list/index.wxss`
  Dedicated full song list page.
- `pages/performance/index.json`
- `pages/performance/index.ts`
- `pages/performance/index.wxml`
- `pages/performance/index.wxss`
  Non-tour live performance list page.
- `pages/documentary/index.json`
- `pages/documentary/index.ts`
- `pages/documentary/index.wxml`
- `pages/documentary/index.wxss`
  Documentary list page.
- `pages/collection/index.json`
- `pages/collection/index.ts`
- `pages/collection/index.wxml`
- `pages/collection/index.wxss`
  Collection index page grouped by mood/scenario/editorial.
- `pages/collection/detail/index.json`
- `pages/collection/detail/index.ts`
- `pages/collection/detail/index.wxml`
- `pages/collection/detail/index.wxss`
  Collection detail page resolving mixed content items.
- `pages/favorites/index.json`
- `pages/favorites/index.ts`
- `pages/favorites/index.wxml`
- `pages/favorites/index.wxss`
  Dedicated favorites page.

### Shared Responsibilities

- Keep all tour-domain `Video` reads in `utils/selectors.ts`.
- Keep all library-domain reads in `utils/librarySelectors.ts`.
- Do not create a standalone MV page; render MV through `Song` data only.
- Keep page controllers thin: fetch data in `onLoad`/`onShow`, render pre-shaped data, and avoid embedding filtering logic directly in WXML.

## Task 1: Add Library Domain Types, Mock Data, and Selector Tests

**Files:**
- Create: `types/library.ts`
- Create: `data/performances.ts`
- Create: `data/documentaries.ts`
- Create: `data/collections.ts`
- Create: `utils/librarySelectors.ts`
- Create: `tests/library-module.test.ts`
- Modify: `types/song.ts`
- Modify: `data/songs.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing selector test suite**

Create `tests/library-module.test.ts` with these first tests:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCollectionById,
  getCollectionSections,
  getLibraryHubEntries,
  getPerformanceList,
  getSongListItems,
  getSongVideoSection
} from '../utils/librarySelectors';
import { ROUTES } from '../utils/constants';

test('library hub exposes the six primary destinations in product order', () => {
  const entries = getLibraryHubEntries();

  assert.deepEqual(
    entries.map((entry) => entry.id),
    ['albums', 'songs', 'performances', 'documentaries', 'collections', 'favorites']
  );
  assert.equal(entries[1]?.route, ROUTES.songList);
  assert.equal(entries[4]?.route, ROUTES.collectionList);
});

test('song list items expose album names and mv availability', () => {
  const song = getSongListItems().find((item) => item.id === 'song_anti_hero');

  assert.equal(song?.albumName, 'Midnights');
  assert.equal(song?.hasMv, true);
});

test('song video section returns mv plus related non-tour performances only', () => {
  const section = getSongVideoSection('song_all_too_well');

  assert.equal(section.mv?.title, 'All Too Well: The Short Film');
  assert.deepEqual(
    section.performances.map((item) => item.eventName),
    ['Grammy Awards']
  );
});

test('performance list excludes tour fan-cam videos', () => {
  const performanceIds = getPerformanceList().map((item) => item.id);

  assert.deepEqual(performanceIds, [
    'performance_grammys_all_too_well',
    'performance_iheart_anti_hero',
    'performance_bbc_holy_ground'
  ]);
});

test('collection sections separate mood collections from editorial collections', () => {
  const sections = getCollectionSections();

  assert.deepEqual(sections.map((section) => section.type), ['mood', 'scenario', 'editorial']);
  assert.equal(sections[0]?.items[0]?.id, 'collection_late_night_lyrics');
});

test('collection detail resolves mixed content items', () => {
  const collection = getCollectionById('collection_award_show_highlights');

  assert.equal(collection?.items[0]?.type, 'performance');
  assert.equal(collection?.items[1]?.type, 'mv');
  assert.equal(collection?.items[2]?.type, 'documentary');
});
```

- [ ] **Step 2: Run the new test file and confirm it fails on missing library selectors**

Run:

```bash
npx tsx --test tests/library-module.test.ts
```

Expected:

```text
FAIL tests/library-module.test.ts
Cannot find module '../utils/librarySelectors'
```

- [ ] **Step 3: Add the new types and seed mock data**

Create `types/library.ts`:

```ts
export interface Performance {
  id: string;
  title: string;
  songIds: string[];
  eventName: string;
  year: number;
  cover: string;
  source: string;
  duration: string;
  summary: string;
}

export interface Documentary {
  id: string;
  title: string;
  year: number;
  category: 'documentary' | 'concert-film' | 'special';
  cover: string;
  platform: string;
  duration: string;
  summary: string;
  relatedSongIds: string[];
}

export type CollectionItemRef =
  | { type: 'song'; songId: string }
  | { type: 'mv'; songId: string }
  | { type: 'performance'; performanceId: string }
  | { type: 'documentary'; documentaryId: string };

export interface Collection {
  id: string;
  title: string;
  type: 'mood' | 'scenario' | 'editorial';
  description: string;
  cover: string;
  items: CollectionItemRef[];
}

export interface LibraryHubEntry {
  id: 'albums' | 'songs' | 'performances' | 'documentaries' | 'collections' | 'favorites';
  title: string;
  subtitle: string;
  route: string;
}
```

Update `types/song.ts`:

```ts
export interface SongMvAsset {
  title: string;
  cover: string;
  source: string;
  duration: string;
}

export interface LyricLine {
  en: string;
  zh: string;
}

export interface Song {
  id: string;
  name: string;
  albumId: string;
  lyrics: LyricLine[];
  mv?: SongMvAsset;
}
```

Update the matching songs in `data/songs.ts` by adding the `mv` object while leaving the existing lyric arrays unchanged:

```ts
{
  id: 'song_all_too_well',
  name: 'All Too Well',
  albumId: 'album_red',
  mv: {
    title: 'All Too Well: The Short Film',
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'YouTube',
    duration: '14:56'
  },
  lyrics: [
    { en: 'I walked through the door with you, the air was cold.', zh: '我和你走进门，空气微凉。' },
    { en: 'And I know it\'s long gone and that magic\'s not here no more.', zh: '我知道一切早已远去，魔法也不再。' },
    { en: 'Time won\'t fly, it\'s like I\'m paralyzed by it.', zh: '时间没有飞逝，我像被它困住。' },
    { en: 'I remember it all too well.', zh: '我把一切都记得太清楚。' }
  ]
},
{
  id: 'song_anti_hero',
  name: 'Anti-Hero',
  albumId: 'album_midnights',
  mv: {
    title: 'Anti-Hero (Official Music Video)',
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'YouTube',
    duration: '5:10'
  },
  lyrics: [
    { en: 'I have this thing where I get older but just never wiser.', zh: '我总在变老，却似乎从未更睿智。' },
    { en: 'It\'s me, hi, I\'m the problem, it\'s me.', zh: '是我，嗨，问题就在我身上。' },
    { en: 'At tea time, everybody agrees.', zh: '下午茶时分，所有人都同意。' },
    { en: 'I should not be left to my own devices.', zh: '我不该被放任独自面对自己。' }
  ]
}
```

Create `data/performances.ts`:

```ts
import { Performance } from '../types/library';

export const performances: Performance[] = [
  {
    id: 'performance_grammys_all_too_well',
    title: 'All Too Well (10 Minute Version)',
    songIds: ['song_all_too_well'],
    eventName: 'Grammy Awards',
    year: 2024,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'CBS',
    duration: '10:13',
    summary: 'A stripped-back award-show stage built around the 10-minute arrangement.'
  },
  {
    id: 'performance_iheart_anti_hero',
    title: 'Anti-Hero',
    songIds: ['song_anti_hero'],
    eventName: 'iHeartRadio Music Awards',
    year: 2023,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'FOX',
    duration: '4:27',
    summary: 'A televised performance built around the Midnights visual language.'
  },
  {
    id: 'performance_bbc_holy_ground',
    title: 'Holy Ground',
    songIds: ['song_holy_ground'],
    eventName: 'BBC Radio 1 Live Lounge',
    year: 2019,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'BBC',
    duration: '3:58',
    summary: 'A tighter live-band arrangement that fans often revisit as a standout non-tour cut.'
  }
];
```

Create `data/documentaries.ts`:

```ts
import { Documentary } from '../types/library';

export const documentaries: Documentary[] = [
  {
    id: 'documentary_miss_americana',
    title: 'Miss Americana',
    year: 2020,
    category: 'documentary',
    cover: '/assets/images/ui/avatar-placeholder.png',
    platform: 'Netflix',
    duration: '85 min',
    summary: 'A personal documentary focused on identity, pressure, and reinvention.',
    relatedSongIds: ['song_mirrorball', 'song_dear_reader']
  },
  {
    id: 'documentary_eras_tour_film',
    title: 'Taylor Swift | The Eras Tour',
    year: 2023,
    category: 'concert-film',
    cover: '/assets/images/ui/avatar-placeholder.png',
    platform: 'Disney+',
    duration: '169 min',
    summary: 'A feature-length concert film presenting the Eras Tour set in cinematic form.',
    relatedSongIds: ['song_love_story', 'song_anti_hero', 'song_long_live']
  }
];
```

Create `data/collections.ts`:

```ts
import { Collection } from '../types/library';

export const collections: Collection[] = [
  {
    id: 'collection_late_night_lyrics',
    title: '深夜循环',
    type: 'mood',
    description: '偏向抒情、内省和深夜耳机时刻的歌曲集合。',
    cover: '/assets/images/ui/avatar-placeholder.png',
    items: [
      { type: 'song', songId: 'song_all_too_well' },
      { type: 'song', songId: 'song_dear_reader' },
      { type: 'mv', songId: 'song_all_too_well' }
    ]
  },
  {
    id: 'collection_sing_along_moments',
    title: '大合唱时刻',
    type: 'scenario',
    description: '适合和全场一起喊出来的高情绪内容。',
    cover: '/assets/images/ui/avatar-placeholder.png',
    items: [
      { type: 'song', songId: 'song_long_live' },
      { type: 'song', songId: 'song_love_story' },
      { type: 'performance', performanceId: 'performance_iheart_anti_hero' }
    ]
  },
  {
    id: 'collection_award_show_highlights',
    title: '领奖台名场面',
    type: 'editorial',
    description: '奖项舞台、MV 和长内容混合而成的高光专题。',
    cover: '/assets/images/ui/avatar-placeholder.png',
    items: [
      { type: 'performance', performanceId: 'performance_grammys_all_too_well' },
      { type: 'mv', songId: 'song_anti_hero' },
      { type: 'documentary', documentaryId: 'documentary_miss_americana' }
    ]
  }
];
```

- [ ] **Step 4: Implement pure library selectors and add the test script**

Create `utils/librarySelectors.ts`:

```ts
import { albums } from '../data/albums';
import { collections } from '../data/collections';
import { documentaries } from '../data/documentaries';
import { performances } from '../data/performances';
import { songs } from '../data/songs';
import { Collection, Documentary, LibraryHubEntry, Performance } from '../types/library';
import { Song, SongMvAsset } from '../types/song';
import { ROUTES } from './constants';
import { getFavoriteSongIds } from './storage';

export interface SongListItem extends Song {
  albumName: string;
  hasMv: boolean;
}

export interface SongVideoSection {
  mv: SongMvAsset | null;
  performances: Performance[];
}

export interface CollectionSection {
  type: 'mood' | 'scenario' | 'editorial';
  title: string;
  items: Collection[];
}

export interface ResolvedCollectionItem {
  type: 'song' | 'mv' | 'performance' | 'documentary';
  id: string;
  title: string;
  subtitle: string;
}

export function getSongListItems(): SongListItem[] {
  return songs.map((song) => ({
    ...song,
    albumName: albums.find((album) => album.id === song.albumId)?.name ?? song.albumId,
    hasMv: Boolean(song.mv)
  }));
}

export function getLibraryHubEntries(): LibraryHubEntry[] {
  return [
    { id: 'albums', title: '专辑', subtitle: '按时代浏览全部专辑', route: ROUTES.album },
    { id: 'songs', title: '歌曲', subtitle: '完整歌曲列表与 MV 标记', route: ROUTES.songList },
    { id: 'performances', title: 'Live 表演', subtitle: '典礼、节目与特别舞台', route: ROUTES.performanceList },
    { id: 'documentaries', title: '纪录片', subtitle: '长内容与幕后特辑', route: ROUTES.documentaryList },
    { id: 'collections', title: '分类合集', subtitle: '情绪分类与编辑专题', route: ROUTES.collectionList },
    { id: 'favorites', title: '我的收藏', subtitle: '集中查看已收藏歌曲', route: ROUTES.favorites }
  ];
}

export function getPerformanceList(): Performance[] {
  return performances;
}

export function getDocumentaryList(): Documentary[] {
  return documentaries;
}

export function getSongVideoSection(songId: string): SongVideoSection {
  const song = songs.find((item) => item.id === songId) ?? null;

  return {
    mv: song?.mv ?? null,
    performances: performances.filter((item) => item.songIds.includes(songId)).slice(0, 2)
  };
}

export function getCollectionSections(): CollectionSection[] {
  return [
    { type: 'mood', title: '情绪分类', items: collections.filter((item) => item.type === 'mood') },
    { type: 'scenario', title: '场景分类', items: collections.filter((item) => item.type === 'scenario') },
    { type: 'editorial', title: '专题合集', items: collections.filter((item) => item.type === 'editorial') }
  ];
}

export function getCollectionById(id: string): (Collection & { items: ResolvedCollectionItem[] }) | undefined {
  const collection = collections.find((item) => item.id === id);
  if (!collection) {
    return undefined;
  }

  const items = collection.items.flatMap<ResolvedCollectionItem>((item) => {
    if (item.type === 'song') {
      const song = songs.find((candidate) => candidate.id === item.songId);
      return song ? [{ type: 'song', id: song.id, title: song.name, subtitle: 'Song' }] : [];
    }
    if (item.type === 'mv') {
      const song = songs.find((candidate) => candidate.id === item.songId && candidate.mv);
      return song?.mv
        ? [{ type: 'mv', id: song.id, title: song.mv.title, subtitle: song.name }]
        : [];
    }
    if (item.type === 'performance') {
      const performance = performances.find((candidate) => candidate.id === item.performanceId);
      return performance
        ? [{ type: 'performance', id: performance.id, title: performance.title, subtitle: performance.eventName }]
        : [];
    }
    const documentary = documentaries.find((candidate) => candidate.id === item.documentaryId);
    return documentary
      ? [{ type: 'documentary', id: documentary.id, title: documentary.title, subtitle: documentary.platform }]
      : [];
  });

  return { ...collection, items };
}

export function getFavoriteSongListItems(): SongListItem[] {
  const favoriteIds = getFavoriteSongIds();
  return getSongListItems().filter((item) => favoriteIds.includes(item.id));
}
```

Update `package.json`:

```json
{
  "scripts": {
    "test:tour": "tsx --test tests/tour-module.test.ts",
    "test:library": "tsx --test tests/library-module.test.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 5: Run the new library tests and confirm they pass**

Run:

```bash
npm run test:library
```

Expected:

```text
✔ library hub exposes the six primary destinations in product order
✔ song list items expose album names and mv availability
✔ song video section returns mv plus related non-tour performances only
✔ performance list excludes tour fan-cam videos
✔ collection sections separate mood collections from editorial collections
✔ collection detail resolves mixed content items
```

## Task 2: Register Routes and Build the Library Hub Data Flow

**Files:**
- Modify: `app.json`
- Modify: `utils/constants.ts`
- Modify: `pages/library/index.ts`
- Modify: `pages/library/index.wxml`
- Modify: `pages/library/index.wxss`
- Test: `tests/library-module.test.ts`

- [ ] **Step 1: Extend the test suite with a hub-entry smoke test that fails until routes are registered**

Add this test to `tests/library-module.test.ts`:

```ts
test('library hub entry routes map to dedicated non-tab pages', () => {
  const entries = getLibraryHubEntries();

  assert.deepEqual(
    entries.map((entry) => entry.route),
    [
      ROUTES.album,
      ROUTES.songList,
      ROUTES.performanceList,
      ROUTES.documentaryList,
      ROUTES.collectionList,
      ROUTES.favorites
    ]
  );
});
```

- [ ] **Step 2: Update the route constants and register the new pages**

Update `utils/constants.ts`:

```ts
export const ROUTES = {
  library: '/pages/library/index',
  tour: '/pages/tour/index',
  tourDetail: '/pages/tour/detail/index',
  showDetail: '/pages/show/detail/index',
  guide: '/pages/guide/index',
  videoUpload: '/pages/video/upload/index',
  album: '/pages/album/index',
  song: '/pages/song/index',
  songList: '/pages/song-list/index',
  performanceList: '/pages/performance/index',
  documentaryList: '/pages/documentary/index',
  collectionList: '/pages/collection/index',
  collectionDetail: '/pages/collection/detail/index',
  favorites: '/pages/favorites/index'
} as const;
```

Update `app.json`:

```json
{
  "pages": [
    "pages/home/index",
    "pages/library/index",
    "pages/album/index",
    "pages/song/index",
    "pages/song-list/index",
    "pages/performance/index",
    "pages/documentary/index",
    "pages/collection/index",
    "pages/collection/detail/index",
    "pages/favorites/index",
    "pages/tour/index",
    "pages/tour/detail/index",
    "pages/show/detail/index",
    "pages/guide/index",
    "pages/video/upload/index",
    "pages/profile/index"
  ]
}
```

- [ ] **Step 3: Replace the library page list logic with hub entries**

Update `pages/library/index.ts`:

```ts
import { LibraryHubEntry } from '../../types/library';
import { getLibraryHubEntries } from '../../utils/librarySelectors';

interface LibraryData {
  entries: LibraryHubEntry[];
}

Page({
  data: {
    entries: []
  } as LibraryData,

  onLoad() {
    this.setData({
      entries: getLibraryHubEntries()
    });
  },

  goEntry(event: { currentTarget: { dataset: { route: string } } }) {
    const route = event.currentTarget.dataset.route;
    wx.navigateTo({ url: route });
  }
});
```

Update `pages/library/index.wxml`:

```xml
<view class="container">
  <view class="card library-head">
    <text class="page-title">内容库</text>
    <text class="page-subtitle">从专辑、歌曲、表演、纪录片和合集进入内容世界。</text>
  </view>

  <view class="entry-grid">
    <view
      wx:for="{{entries}}"
      wx:key="id"
      class="card entry-card"
      data-route="{{item.route}}"
      bindtap="goEntry"
    >
      <text class="entry-title">{{item.title}}</text>
      <text class="entry-subtitle">{{item.subtitle}}</text>
      <text class="entry-arrow">查看 ></text>
    </view>
  </view>
</view>
```

Update `pages/library/index.wxss`:

```css
.library-head {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.entry-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24rpx;
}

.entry-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.entry-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #111111;
}

.entry-subtitle,
.entry-arrow {
  font-size: 26rpx;
  color: #6b7280;
}
```

- [ ] **Step 4: Run tests and typecheck**

Run:

```bash
npm run test:library
npm run typecheck
```

Expected:

```text
all library selector tests pass
Found 0 errors
```

## Task 3: Add Dedicated Songs, Performances, Documentaries, Collections, and Favorites Pages

**Files:**
- Create: `pages/song-list/index.json`
- Create: `pages/song-list/index.ts`
- Create: `pages/song-list/index.wxml`
- Create: `pages/song-list/index.wxss`
- Create: `pages/performance/index.json`
- Create: `pages/performance/index.ts`
- Create: `pages/performance/index.wxml`
- Create: `pages/performance/index.wxss`
- Create: `pages/documentary/index.json`
- Create: `pages/documentary/index.ts`
- Create: `pages/documentary/index.wxml`
- Create: `pages/documentary/index.wxss`
- Create: `pages/collection/index.json`
- Create: `pages/collection/index.ts`
- Create: `pages/collection/index.wxml`
- Create: `pages/collection/index.wxss`
- Create: `pages/collection/detail/index.json`
- Create: `pages/collection/detail/index.ts`
- Create: `pages/collection/detail/index.wxml`
- Create: `pages/collection/detail/index.wxss`
- Create: `pages/favorites/index.json`
- Create: `pages/favorites/index.ts`
- Create: `pages/favorites/index.wxml`
- Create: `pages/favorites/index.wxss`
- Test: `tests/library-module.test.ts`

- [ ] **Step 1: Extend the tests with collection-detail and favorites assertions**

Append to `tests/library-module.test.ts`:

```ts
import { getFavoriteSongListItems } from '../utils/librarySelectors';

test('favorites selector returns only stored songs with mv metadata preserved', () => {
  (globalThis as unknown as { wx: typeof wx }).wx.setStorageSync('favoriteSongIds', [
    'song_all_too_well',
    'song_anti_hero'
  ]);

  const favorites = getFavoriteSongListItems();

  assert.deepEqual(favorites.map((item) => item.id), ['song_all_too_well', 'song_anti_hero']);
  assert.equal(favorites[0]?.hasMv, true);
});
```

- [ ] **Step 2: Create the songs list and favorites pages**

Create `pages/song-list/index.ts`:

```ts
import { ROUTES } from '../../utils/constants';
import { SongListItem, getSongListItems } from '../../utils/librarySelectors';

interface SongListData {
  songs: SongListItem[];
}

Page({
  data: {
    songs: []
  } as SongListData,

  onLoad() {
    this.setData({ songs: getSongListItems() });
  },

  goSong(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.song}?id=${event.currentTarget.dataset.id}` });
  }
});
```

Create `pages/song-list/index.wxml`:

```xml
<view class="container">
  <view class="card">
    <text class="section-title">歌曲列表</text>
    <view wx:for="{{songs}}" wx:key="id" class="song-item" data-id="{{item.id}}" bindtap="goSong">
      <view class="song-copy">
        <text class="song-name">{{item.name}}</text>
        <text class="song-album">{{item.albumName}}</text>
      </view>
      <text wx:if="{{item.hasMv}}" class="song-tag">MV</text>
    </view>
  </view>
</view>
```

Create `pages/favorites/index.ts`:

```ts
import { ROUTES } from '../../utils/constants';
import { SongListItem, getFavoriteSongListItems } from '../../utils/librarySelectors';

interface FavoritesData {
  favorites: SongListItem[];
}

Page({
  data: {
    favorites: []
  } as FavoritesData,

  onShow() {
    this.setData({
      favorites: getFavoriteSongListItems()
    });
  },

  goSong(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.song}?id=${event.currentTarget.dataset.id}` });
  }
});
```

Create `pages/favorites/index.wxml`:

```xml
<view class="container">
  <view class="card">
    <text class="section-title">我的收藏</text>
    <empty-state wx:if="{{!favorites.length}}" title="还没有收藏歌曲" desc="去歌曲详情页点击收藏吧。"></empty-state>
    <view wx:else>
      <view wx:for="{{favorites}}" wx:key="id" class="song-item" data-id="{{item.id}}" bindtap="goSong">
        <view class="song-copy">
          <text class="song-name">{{item.name}}</text>
          <text class="song-album">{{item.albumName}}</text>
        </view>
        <text wx:if="{{item.hasMv}}" class="song-tag">MV</text>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 3: Create the performances, documentaries, and collections pages**

Create `pages/performance/index.ts`:

```ts
import { Performance } from '../../types/library';
import { getPerformanceList } from '../../utils/librarySelectors';

interface PerformanceData {
  performances: Performance[];
}

Page({
  data: {
    performances: []
  } as PerformanceData,

  onLoad() {
    this.setData({ performances: getPerformanceList() });
  }
});
```

Create `pages/documentary/index.ts`:

```ts
import { Documentary } from '../../types/library';
import { getDocumentaryList } from '../../utils/librarySelectors';

interface DocumentaryData {
  documentaries: Documentary[];
}

Page({
  data: {
    documentaries: []
  } as DocumentaryData,

  onLoad() {
    this.setData({ documentaries: getDocumentaryList() });
  }
});
```

Create `pages/collection/index.ts`:

```ts
import { ROUTES } from '../../utils/constants';
import { CollectionSection, getCollectionSections } from '../../utils/librarySelectors';

interface CollectionData {
  sections: CollectionSection[];
}

Page({
  data: {
    sections: []
  } as CollectionData,

  onLoad() {
    this.setData({ sections: getCollectionSections() });
  },

  goDetail(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.collectionDetail}?id=${event.currentTarget.dataset.id}` });
  }
});
```

Create `pages/collection/detail/index.ts`:

```ts
import { getCollectionById, ResolvedCollectionItem } from '../../../utils/librarySelectors';

interface CollectionDetailData {
  title: string;
  description: string;
  items: ResolvedCollectionItem[];
  hasError: boolean;
}

Page({
  data: {
    title: '',
    description: '',
    items: [],
    hasError: false
  } as CollectionDetailData,

  onLoad(options: { id?: string }) {
    const collection = options.id ? getCollectionById(options.id) : undefined;
    if (!collection) {
      this.setData({ hasError: true });
      return;
    }

    this.setData({
      title: collection.title,
      description: collection.description,
      items: collection.items,
      hasError: false
    });
  }
});
```

Create `pages/performance/index.wxml`:

```xml
<view class="container">
  <view class="card" wx:for="{{performances}}" wx:key="id">
    <text class="item-title">{{item.title}}</text>
    <text class="item-subtitle">{{item.eventName}} · {{item.year}}</text>
    <text class="item-summary">{{item.summary}}</text>
  </view>
</view>
```

Create `pages/documentary/index.wxml`:

```xml
<view class="container">
  <view class="card" wx:for="{{documentaries}}" wx:key="id">
    <text class="item-title">{{item.title}}</text>
    <text class="item-subtitle">{{item.platform}} · {{item.year}}</text>
    <text class="item-summary">{{item.summary}}</text>
  </view>
</view>
```

Create `pages/collection/index.wxml`:

```xml
<view class="container">
  <view class="card" wx:for="{{sections}}" wx:key="type">
    <text class="section-title">{{item.title}}</text>
    <view
      wx:for="{{item.items}}"
      wx:for-item="collection"
      wx:key="id"
      class="collection-item"
      data-id="{{collection.id}}"
      bindtap="goDetail"
    >
      <text class="item-title">{{collection.title}}</text>
      <text class="item-summary">{{collection.description}}</text>
    </view>
  </view>
</view>
```

Create `pages/collection/detail/index.wxml`:

```xml
<view class="container">
  <empty-state wx:if="{{hasError}}" title="合集不存在" desc="请返回合集页重新选择。"></empty-state>
  <view wx:else>
    <view class="card">
      <text class="section-title">{{title}}</text>
      <text class="item-summary">{{description}}</text>
    </view>
    <view class="card" wx:for="{{items}}" wx:key="id">
      <text class="item-tag">{{item.type}}</text>
      <text class="item-title">{{item.title}}</text>
      <text class="item-subtitle">{{item.subtitle}}</text>
    </view>
  </view>
</view>
```

Create page JSON files with these exact contents:

```json
// pages/song-list/index.json
{}

// pages/performance/index.json
{}

// pages/documentary/index.json
{}

// pages/collection/index.json
{}

// pages/favorites/index.json
{
  "usingComponents": {
    "empty-state": "/components/empty-state/index"
  }
}

// pages/collection/detail/index.json
{
  "usingComponents": {
    "empty-state": "/components/empty-state/index"
  }
}
```

Create shared minimal WXSS for the list pages:

```css
/* pages/song-list/index.wxss and pages/favorites/index.wxss */
.song-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #ececec;
}

.song-copy {
  flex: 1;
}

.song-name {
  display: block;
  font-size: 32rpx;
  color: #111111;
}

.song-album {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.song-tag {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #f3f4f6;
  font-size: 22rpx;
  color: #4b5563;
}
```

```css
/* pages/performance/index.wxss, pages/documentary/index.wxss, pages/collection/index.wxss, pages/collection/detail/index.wxss */
.item-title,
.section-title {
  display: block;
  font-size: 32rpx;
  color: #111111;
}

.item-subtitle,
.item-summary {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.collection-item + .collection-item {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #ececec;
}

.item-tag {
  display: inline-block;
  margin-bottom: 8rpx;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #f3f4f6;
  font-size: 22rpx;
  color: #4b5563;
}
```

- [ ] **Step 4: Run the library tests and typecheck again**

Run:

```bash
npm run test:library
npm run typecheck
```

Expected:

```text
all selector tests pass
Found 0 errors
```

## Task 4: Turn the Album Page Into a Browser + Detail Flow and Enrich Song Detail Video Content

**Files:**
- Modify: `pages/album/index.ts`
- Modify: `pages/album/index.wxml`
- Modify: `pages/album/index.wxss`
- Modify: `pages/song/index.ts`
- Modify: `pages/song/index.wxml`
- Modify: `pages/song/index.wxss`
- Test: `tests/library-module.test.ts`

- [ ] **Step 1: Add a failing test for song video sections**

Append this test:

```ts
test('song video section hides mv when the song has no video asset', () => {
  const section = getSongVideoSection('song_love_story');

  assert.equal(section.mv, null);
  assert.deepEqual(section.performances, []);
});
```

- [ ] **Step 2: Update the album page to support list mode and detail mode**

Update `pages/album/index.ts`:

```ts
import { getAlbums } from '../../utils/selectors';
import { SongListItem, getSongListItems } from '../../utils/librarySelectors';

interface AlbumData {
  albums: Album[];
  album: Album | null;
  songs: SongListItem[];
  hasError: boolean;
  isListMode: boolean;
}

Page({
  data: {
    albums: [],
    album: null,
    songs: [],
    hasError: false,
    isListMode: true
  } as AlbumData,

  onLoad(options: { id?: string }) {
    const albumId = options.id;
    if (!albumId) {
      this.setData({
        albums: getAlbums(),
        album: null,
        songs: [],
        hasError: false,
        isListMode: true
      });
      return;
    }

    const album = getAlbumById(albumId);
    if (!album) {
      this.setData({ hasError: true, isListMode: false });
      return;
    }

    this.setData({
      albums: [],
      album,
      songs: getSongListItems().filter((song) => song.albumId === albumId),
      hasError: false,
      isListMode: false
    });
  },

  goAlbum(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.album}?id=${event.currentTarget.dataset.id}` });
  }
});
```

Update `pages/album/index.wxml`:

```xml
<view class="container">
  <empty-state wx:if="{{hasError}}" title="专辑不存在" desc="请返回内容库重新选择。"></empty-state>

  <view wx:elif="{{isListMode}}">
    <view class="card">
      <text class="block-title">专辑列表</text>
      <view wx:for="{{albums}}" wx:key="id" class="album-row" data-id="{{item.id}}" bindtap="goAlbum">
        <image class="album-cover" src="{{item.cover}}" mode="aspectFill"></image>
        <view class="album-copy">
          <text class="album-title">{{item.name}}</text>
          <text class="album-year">{{item.year}} 年</text>
        </view>
      </view>
    </view>
  </view>

  <view wx:else>
    <view class="card album-head">
      <image class="album-cover" src="{{album.cover}}" mode="aspectFill"></image>
      <view>
        <text class="album-title">{{album.name}}</text>
        <text class="album-year">{{album.year}} 年</text>
      </view>
    </view>

    <view class="card">
      <text class="block-title">歌曲列表</text>
      <view wx:for="{{songs}}" wx:key="id" class="song-row" data-id="{{item.id}}" bindtap="goSong">
        <view class="song-copy">
          <text class="song-name">{{item.name}}</text>
          <text wx:if="{{item.hasMv}}" class="song-tag">MV</text>
        </view>
        <text class="song-arrow">></text>
      </view>
    </view>
  </view>
</view>
```

Add the minimal supporting styles in `pages/album/index.wxss`:

```css
.album-row,
.song-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #ececec;
}

.album-copy,
.song-copy {
  flex: 1;
}

.song-tag {
  display: inline-block;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #f3f4f6;
  font-size: 22rpx;
  color: #4b5563;
}
```

- [ ] **Step 3: Add the song-detail video section**

Update `pages/song/index.ts`:

```ts
import { Performance } from '../../types/library';
import { SongMvAsset } from '../../types/song';
import { getSongVideoSection } from '../../utils/librarySelectors';

interface SongData {
  song: Song | null;
  album: Album | null;
  hasError: boolean;
  isFavorite: boolean;
  showTranslation: boolean;
  mv: SongMvAsset | null;
  relatedPerformances: Performance[];
}

// inside onLoad after song is found:
const videoSection = getSongVideoSection(song.id);

this.setData({
  song,
  album,
  hasError: false,
  isFavorite: favoriteIds.includes(song.id),
  mv: videoSection.mv,
  relatedPerformances: videoSection.performances
});
```

Update `pages/song/index.wxml`:

```xml
<view class="card video-card" wx:if="{{mv || relatedPerformances.length}}">
  <text class="block-title">视频内容</text>

  <view wx:if="{{mv}}" class="video-item">
    <text class="video-tag">MV</text>
    <text class="video-title">{{mv.title}}</text>
    <text class="video-meta">{{mv.source}} · {{mv.duration}}</text>
  </view>

  <view
    wx:for="{{relatedPerformances}}"
    wx:key="id"
    class="video-item"
  >
    <text class="video-tag">Live</text>
    <text class="video-title">{{item.title}}</text>
    <text class="video-meta">{{item.eventName}} · {{item.year}}</text>
  </view>
</view>
```

Update `pages/song/index.wxss`:

```css
.video-card {
  margin-top: 24rpx;
}

.video-item + .video-item {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #ececec;
}

.video-tag {
  display: inline-block;
  margin-bottom: 8rpx;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #f3f4f6;
  font-size: 22rpx;
  color: #4b5563;
}
```

- [ ] **Step 4: Run the focused library tests and typecheck**

Run:

```bash
npm run test:library
npm run typecheck
```

Expected:

```text
all library selector tests pass
Found 0 errors
```

## Task 5: Move Favorites Out of Profile and Add Summary Navigation

**Files:**
- Modify: `pages/profile/index.ts`
- Modify: `pages/profile/index.wxml`
- Modify: `pages/profile/index.wxss`
- Modify: `tests/library-module.test.ts`

- [ ] **Step 1: Add a failing test for the favorites selector summary path**

Append:

```ts
test('favorite song list items stay empty when storage is empty', () => {
  (globalThis as unknown as { wx: typeof wx }).wx.setStorageSync('favoriteSongIds', []);

  assert.deepEqual(getFavoriteSongListItems(), []);
});
```

- [ ] **Step 2: Replace the profile favorites list with a summary card**

Update `pages/profile/index.ts`:

```ts
import { ROUTES } from '../../utils/constants';
import { SongListItem, getFavoriteSongListItems } from '../../utils/librarySelectors';

interface ProfileData {
  profile: UserProfile;
  favorites: SongListItem[];
}

goFavorites() {
  wx.navigateTo({ url: ROUTES.favorites });
}
```

Update `pages/profile/index.wxml`:

```xml
<view class="card">
  <text class="section-title">我的收藏</text>
  <text class="favorites-count">已收藏 {{favorites.length}} 首歌曲</text>
  <view wx:if="{{favorites.length}}" class="favorites-preview">
    <text class="favorites-preview-text">
      最近查看：{{favorites[0].name}}{{favorites.length > 1 ? ' 等' : ''}}
    </text>
  </view>
  <view class="favorites-entry" bindtap="goFavorites">
    <text class="favorites-entry-text">查看完整收藏列表</text>
    <text class="favorites-entry-arrow">></text>
  </view>
</view>
```

Update `pages/profile/index.wxss`:

```css
.favorites-count,
.favorites-preview-text {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #6b7280;
}

.favorites-entry {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

- [ ] **Step 3: Run tests and typecheck**

Run:

```bash
npm run test:library
npm run typecheck
```

Expected:

```text
all library selector tests pass
Found 0 errors
```

## Task 6: Final Verification and Manual QA

**Files:**
- Review only: `app.json`
- Review only: `pages/library/index.*`
- Review only: `pages/song-list/index.*`
- Review only: `pages/performance/index.*`
- Review only: `pages/documentary/index.*`
- Review only: `pages/collection/index.*`
- Review only: `pages/collection/detail/index.*`
- Review only: `pages/favorites/index.*`
- Review only: `pages/album/index.*`
- Review only: `pages/song/index.*`
- Review only: `pages/profile/index.*`

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm run test:tour
npm run test:library
npm run typecheck
```

Expected:

```text
all tour tests pass
all library tests pass
Found 0 errors
```

- [ ] **Step 2: Manually verify the library flows in WeChat DevTools**

Work through this checklist:

```text
1. Open 曲库 tab and confirm only entry cards appear.
2. Tap 专辑 and confirm album songs with MV show the MV badge.
3. Tap 歌曲 and confirm the full song list renders.
4. Open a song with MV and confirm the 视频内容 block appears.
5. Open a song without MV and confirm the 视频内容 block is hidden.
6. Tap Live 表演 and confirm only non-tour stage content appears.
7. Tap 纪录片 and confirm long-form content cards render.
8. Tap 分类合集, open each section, and confirm mixed item badges show correct types.
9. Favorite a song, visit 我的收藏 from both 曲库 and 我的, and confirm the same list renders.
10. Open a tour show detail page and confirm existing tour fan-cam videos still render unchanged.
```

- [ ] **Step 3: If a manual issue appears, fix the smallest responsible layer first**

Use this triage order:

```text
1. Selector output wrong -> fix utils/librarySelectors.ts or mock data.
2. Route wrong -> fix utils/constants.ts or app.json.
3. Page rendering wrong -> fix that page's ts/wxml/wxss only.
4. Existing tour behavior changed -> revert only the unrelated library-domain change that touched shared code.
```

## Self-Review

### Spec Coverage

- `曲库首页只留入口` -> Task 2
- `歌曲列表独立页面` -> Task 3
- `收藏列表独立页面` -> Task 3 and Task 5
- `MV 作为歌曲附属资产` -> Task 1 and Task 4
- `Live 表演独立频道` -> Task 1 and Task 3
- `纪录片独立频道` -> Task 1 and Task 3
- `分类合集两层结构` -> Task 1 and Task 3
- `曲库与巡演视频隔离` -> Task 1 and Task 6

### Placeholder Scan

- No `TBD` or `TODO` markers
- Each task names exact files
- Each task contains concrete commands and expected outcomes

### Type Consistency

- `Song` owns optional `mv`
- `Performance`, `Documentary`, and `Collection` live in `types/library.ts`
- Library pages read from `utils/librarySelectors.ts`
- Tour video reads remain in `utils/selectors.ts`
