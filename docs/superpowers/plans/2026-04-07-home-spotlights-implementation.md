# Home Spotlights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page's manually maintained single spotlight with a `/home`-style auto-generated `spotlights` list derived from album and tour time windows.

**Architecture:** Keep the home page on a single aggregation entry point by moving spotlight generation into `utils/homeSelectors.ts`, where album and tour source data are transformed into a semantic `HomeSpotlight[]`. The page layer renders a list and maps `HomeSpotlightType` enum values to display copy without directly depending on album or tour lists.

**Tech Stack:** WeChat Mini Program native pages, TypeScript, WXML/WXSS, local mock data, `tsx --test`, `tsc --noEmit`

---

## File Map

- Modify: `types/home.ts`
  Defines `HomeSpotlightType`, semantic `HomeSpotlight`, and `HomeFeed.spotlights`.
- Modify: `types/album.ts`
  Adds album announcement and release dates used by spotlight aggregation.
- Modify: `types/tour.ts`
  Adds tour announcement date used by spotlight aggregation.
- Modify: `data/home.ts`
  Removes `homeSpotlights` and keeps only editorial home data such as era cards.
- Modify: `data/albums.ts`
  Seeds spotlight-capable album records with `announcementDate` and `releaseDate`.
- Modify: `data/tours.ts`
  Seeds spotlight-capable tour records with `announcementDate`.
- Modify: `utils/homeSelectors.ts`
  Becomes the mock `/home` aggregation layer for `spotlights + eras + news`.
- Modify: `pages/home/index.ts`
  Switches page state from a nullable single spotlight to a spotlight list and exposes copy mapping helpers.
- Modify: `pages/home/index.wxml`
  Renders the home spotlight module as a list of cards using the shared action dataset.
- Test: `tests/home-module.test.ts`
  Covers new spotlight generation windows, sorting, empty states, display mapping, and template expectations.
- Modify: `docs/data.md`
  Updates selector and data ownership notes for spotlight aggregation.
- Modify: `docs/api.md`
  Updates the home contract from `spotlight` to `spotlights`.

### Task 1: Reshape Home, Album, and Tour Types

**Files:**
- Modify: `types/home.ts`
- Modify: `types/album.ts`
- Modify: `types/tour.ts`
- Test: `tests/home-module.test.ts`

- [ ] **Step 1: Write the failing type-level test expectations in the home test**

```ts
import { HomeSpotlightType } from '../types/home';

test('home feed exposes a spotlight list and semantic spotlight types', () => {
  const feed = getHomeFeed('2026-04-07');

  assert.ok(Array.isArray(feed.spotlights));
  assert.equal(feed.spotlights[0]?.type, HomeSpotlightType.AlbumPreview);
});
```

- [ ] **Step 2: Run the focused home test to verify it fails**

Run: `npm run test:home`
Expected: FAIL with a TypeScript import or property error such as `Module '../types/home' has no exported member 'HomeSpotlightType'` or `Property 'spotlights' does not exist`.

- [ ] **Step 3: Update the shared types to match the spec**

```ts
export enum HomeSpotlightType {
  AlbumPreview = 'album_preview',
  AlbumReleaseWeek = 'album_release_week',
  TourPreview = 'tour_preview',
  TourOngoing = 'tour_ongoing'
}

export interface HomeSpotlight {
  id: string;
  type: HomeSpotlightType;
  entityId: string;
  name: string;
  cover: string;
  startDate: string;
  endDate: string;
  action: HomeAction;
}

export interface HomeFeed {
  spotlights: HomeSpotlight[];
  eras: HomeEraCard[];
  news: NewsItem[];
}
```

```ts
export interface Album {
  id: string;
  name: string;
  year: number;
  cover: string;
  announcementDate?: string;
  releaseDate?: string;
}
```

```ts
export interface Tour {
  id: string;
  name: string;
  year: number;
  status: TourStatus;
  cover: string;
  description: string;
  announcementDate?: string;
  startDate: string;
  endDate: string;
  rangeLabel: string;
  setlists: TourSetlistVersion[];
}
```

- [ ] **Step 4: Run the home test again to verify the type shape compiles**

Run: `npm run test:home`
Expected: FAIL later in selector assertions that still reference `feed.spotlight` or legacy `kind` and `isActive`.

- [ ] **Step 5: Commit the type reshaping**

```bash
git add types/home.ts types/album.ts types/tour.ts tests/home-module.test.ts
git commit -m "refactor: reshape home spotlight types"
```

### Task 2: Seed Mock Data and Build Spotlight Aggregation

**Files:**
- Modify: `data/home.ts`
- Modify: `data/albums.ts`
- Modify: `data/tours.ts`
- Modify: `utils/homeSelectors.ts`
- Test: `tests/home-module.test.ts`

- [ ] **Step 1: Replace the old single-spotlight tests with date-window coverage**

```ts
test('home feed returns both album and tour spotlights in descending window-start order', () => {
  const feed = getHomeFeed('2026-04-07');

  assert.deepEqual(
    feed.spotlights.map((item) => item.type),
    [HomeSpotlightType.AlbumPreview, HomeSpotlightType.TourOngoing]
  );
  assert.equal(feed.spotlights[0]?.action.route, ROUTES.album);
  assert.equal(feed.spotlights[0]?.action.query, 'id=album_midnights');
  assert.equal(feed.spotlights[1]?.action.route, ROUTES.tourDetail);
  assert.equal(feed.spotlights[1]?.action.query, 'id=tour_eras');
});

test('home feed returns release-week album spotlight during the first seven days after release', () => {
  const feed = getHomeFeed('2026-05-03');

  assert.deepEqual(feed.spotlights.map((item) => item.type), [HomeSpotlightType.AlbumReleaseWeek]);
});

test('home feed returns an empty spotlight list when no album or tour window is active', () => {
  const feed = getHomeFeed('2027-01-01');

  assert.deepEqual(feed.spotlights, []);
});
```

- [ ] **Step 2: Run the home test to verify the new aggregation coverage fails**

Run: `npm run test:home`
Expected: FAIL because `getHomeFeed()` still returns a single `spotlight`, `data/home.ts` still exports `homeSpotlights`, and no date-driven generation exists.

- [ ] **Step 3: Seed the minimal mock fields and implement the aggregation helpers**

```ts
export const albums: Album[] = [
  {
    id: 'album_midnights',
    name: 'Midnights',
    year: 2026,
    cover: '/assets/images/albums/album-midnights.png',
    announcementDate: '2026-04-01',
    releaseDate: '2026-04-30'
  }
];
```

```ts
export const tours: Tour[] = [
  {
    id: 'tour_eras',
    name: 'The Eras Tour',
    year: 2026,
    status: 'ongoing',
    cover: '/assets/images/ui/avatar-placeholder.png',
    description: 'A career-spanning stadium tour covering every album era.',
    announcementDate: '2026-01-15',
    startDate: '2026-03-01',
    endDate: '2026-08-30',
    rangeLabel: '2026.3 - 2026.8',
    setlists: [
      {
        id: 'standard',
        label: 'Standard Setlist',
        songs: ['Miss Americana & the Heartbreak Prince', 'Cruel Summer', 'The Man']
      }
    ]
  }
];
```

```ts
function getTodayIso(today?: string): string {
  return today ?? new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function isWithinRange(today: string, startDate: string, endDate: string): boolean {
  return today >= startDate && today <= endDate;
}

export function getAlbumSpotlights(today?: string): HomeSpotlight[] {
  const now = getTodayIso(today);

  return albums.flatMap((album) => {
    if (!album.announcementDate || !album.releaseDate) {
      return [];
    }

    if (now >= album.announcementDate && now < album.releaseDate) {
      return [{
        id: `spotlight_${album.id}_preview`,
        type: HomeSpotlightType.AlbumPreview,
        entityId: album.id,
        name: album.name,
        cover: album.cover,
        startDate: album.announcementDate,
        endDate: album.releaseDate,
        action: { type: 'navigateTo', route: ROUTES.album, query: `id=${album.id}` }
      }];
    }

    const releaseWeekEnd = addDays(album.releaseDate, 6);
    if (isWithinRange(now, album.releaseDate, releaseWeekEnd)) {
      return [{
        id: `spotlight_${album.id}_release_week`,
        type: HomeSpotlightType.AlbumReleaseWeek,
        entityId: album.id,
        name: album.name,
        cover: album.cover,
        startDate: album.releaseDate,
        endDate: releaseWeekEnd,
        action: { type: 'navigateTo', route: ROUTES.album, query: `id=${album.id}` }
      }];
    }

    return [];
  });
}
```

```ts
export function getTourSpotlights(today?: string): HomeSpotlight[] {
  const now = getTodayIso(today);

  return tours.flatMap((tour) => {
    if (!tour.announcementDate) {
      return [];
    }

    if (now >= tour.announcementDate && now < tour.startDate) {
      return [{
        id: `spotlight_${tour.id}_preview`,
        type: HomeSpotlightType.TourPreview,
        entityId: tour.id,
        name: tour.name,
        cover: tour.cover,
        startDate: tour.announcementDate,
        endDate: tour.startDate,
        action: { type: 'navigateTo', route: ROUTES.tourDetail, query: `id=${tour.id}` }
      }];
    }

    if (isWithinRange(now, tour.startDate, tour.endDate)) {
      return [{
        id: `spotlight_${tour.id}_ongoing`,
        type: HomeSpotlightType.TourOngoing,
        entityId: tour.id,
        name: tour.name,
        cover: tour.cover,
        startDate: tour.startDate,
        endDate: tour.endDate,
        action: { type: 'navigateTo', route: ROUTES.tourDetail, query: `id=${tour.id}` }
      }];
    }

    return [];
  });
}

function getSpotlightPriority(type: HomeSpotlightType): number {
  switch (type) {
    case HomeSpotlightType.AlbumPreview:
      return 0;
    case HomeSpotlightType.TourPreview:
      return 1;
    case HomeSpotlightType.AlbumReleaseWeek:
      return 2;
    case HomeSpotlightType.TourOngoing:
      return 3;
  }
}

function compareHomeSpotlights(a: HomeSpotlight, b: HomeSpotlight): number {
  if (a.startDate !== b.startDate) {
    return b.startDate.localeCompare(a.startDate);
  }

  return getSpotlightPriority(a.type) - getSpotlightPriority(b.type);
}

export function getHomeSpotlights(today?: string): HomeSpotlight[] {
  return [...getAlbumSpotlights(today), ...getTourSpotlights(today)].sort(compareHomeSpotlights);
}

export function getHomeFeed(today?: string): HomeFeed {
  return {
    spotlights: getHomeSpotlights(today),
    eras: getHomeEras(),
    news: getHomeNews()
  };
}
```

- [ ] **Step 4: Run the home test again to verify aggregation behavior passes**

Run: `npm run test:home`
Expected: PASS for the new selector assertions and FAIL only if page/template tests still expect a single `spotlight`.

- [ ] **Step 5: Commit the data and selector aggregation**

```bash
git add data/home.ts data/albums.ts data/tours.ts utils/homeSelectors.ts tests/home-module.test.ts
git commit -m "feat: derive home spotlights from album and tour data"
```

### Task 3: Render Spotlight Cards as a List on the Home Page

**Files:**
- Modify: `pages/home/index.ts`
- Modify: `pages/home/index.wxml`
- Test: `tests/home-module.test.ts`

- [ ] **Step 1: Add failing page and template assertions for list rendering**

```ts
test('home page refresh stores a spotlight list from the home feed', async () => {
  type HomePageConfig = {
    data: { spotlights: HomeSpotlight[] };
    refreshFeed: () => void;
  };

  let pageConfig: HomePageConfig | undefined;
  const setDataCalls: Array<Record<string, unknown>> = [];

  (globalThis as typeof globalThis & { Page?: unknown }).Page = ((config: HomePageConfig) => {
    pageConfig = {
      ...config,
      refreshFeed() {
        config.refreshFeed.call({
          setData: (payload: Record<string, unknown>) => setDataCalls.push(payload)
        });
      }
    };
  }) as unknown as typeof Page;

  await import(new URL('../pages/home/index.ts?home-refresh-test', import.meta.url).href);
  pageConfig?.refreshFeed();

  assert.ok(Array.isArray(setDataCalls[0]?.spotlights));
});

test('home template renders spotlight cards with item-based action datasets', () => {
  const template = readFileSync(new URL('../pages/home/index.wxml', import.meta.url), 'utf8');

  assert.match(template, /wx:if="{{spotlights.length}}"/);
  assert.match(template, /wx:for="{{spotlights}}"/);
  assert.match(template, /data-route="{{item\.action\.route}}"/);
});
```

- [ ] **Step 2: Run the home test to verify the page layer still assumes a single spotlight**

Run: `npm run test:home`
Expected: FAIL with `Property 'spotlights' does not exist` in page data or template assertions that cannot find `wx:for="{{spotlights}}"`.

- [ ] **Step 3: Update the page state and template to render a list**

```ts
interface HomeData {
  spotlights: HomeSpotlight[];
  eras: HomeEraCard[];
  news: NewsItem[];
}

Page({
  data: {
    spotlights: [],
    eras: [],
    news: []
  } as HomeData,

  refreshFeed() {
    const { spotlights, eras, news } = getHomeFeed();

    this.setData({
      spotlights,
      eras,
      news
    });
  }
});
```

```xml
<view wx:if="{{spotlights.length}}" class="spotlight-list">
  <view
    wx:for="{{spotlights}}"
    wx:key="id"
    class="hero-card card"
    data-type="{{item.action.type}}"
    data-route="{{item.action.route}}"
    data-query="{{item.action.query}}"
    bindtap="goAction"
  >
    <text class="hero-eyebrow">{{item.eyebrow}}</text>
    <text class="hero-title">{{item.title}}</text>
    <text class="hero-summary">{{item.summary}}</text>
    <text class="hero-cta">{{item.ctaText}}</text>
  </view>
</view>
```

- [ ] **Step 4: Run the home test again to verify list rendering and shared actions pass**

Run: `npm run test:home`
Expected: PASS for refresh and template coverage, with any remaining failures now limited to missing display-copy mapping.

- [ ] **Step 5: Commit the page list rendering**

```bash
git add pages/home/index.ts pages/home/index.wxml tests/home-module.test.ts
git commit -m "feat: render home spotlights as a list"
```

### Task 4: Map Spotlight Types to Home Display Copy

**Files:**
- Modify: `pages/home/index.ts`
- Modify: `tests/home-module.test.ts`

- [ ] **Step 1: Add a failing display-mapping test for the enum-based copy**

```ts
test('home page maps spotlight types to display copy', async () => {
  const module = await import(new URL('../pages/home/index.ts?home-copy-test', import.meta.url).href);
  const display = module.getHomeSpotlightDisplay({
    id: 'spotlight_album_midnights_preview',
    type: HomeSpotlightType.AlbumPreview,
    entityId: 'album_midnights',
    name: 'Midnights',
    cover: '/assets/images/albums/album-midnights.png',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    action: { type: 'navigateTo', route: ROUTES.album, query: 'id=album_midnights' }
  });

  assert.deepEqual(display, {
    eyebrow: 'ALBUM TEASER',
    title: 'Midnights 即将发布',
    summary: '查看专辑信息与相关内容入口。',
    ctaText: '查看专辑'
  });
});
```

- [ ] **Step 2: Run the home test to verify the display helper does not exist yet**

Run: `npm run test:home`
Expected: FAIL with `module.getHomeSpotlightDisplay is not a function` or an equivalent export error.

- [ ] **Step 3: Implement a page-local helper for display copy mapping**

```ts
export interface HomeSpotlightDisplay {
  eyebrow: string;
  title: string;
  summary: string;
  ctaText: string;
}

export function getHomeSpotlightDisplay(spotlight: HomeSpotlight): HomeSpotlightDisplay {
  switch (spotlight.type) {
    case HomeSpotlightType.AlbumPreview:
      return {
        eyebrow: 'ALBUM TEASER',
        title: `${spotlight.name} 即将发布`,
        summary: '查看专辑信息与相关内容入口。',
        ctaText: '查看专辑'
      };
    case HomeSpotlightType.AlbumReleaseWeek:
      return {
        eyebrow: 'NEW RELEASE',
        title: `${spotlight.name} 发布中`,
        summary: '发布首周快捷入口，快速进入专辑页。',
        ctaText: '查看专辑'
      };
    case HomeSpotlightType.TourPreview:
      return {
        eyebrow: 'ON TOUR SOON',
        title: `${spotlight.name} 即将开始`,
        summary: '查看巡演信息、场次安排与详情入口。',
        ctaText: '查看巡演'
      };
    case HomeSpotlightType.TourOngoing:
      return {
        eyebrow: 'ON TOUR',
        title: `${spotlight.name} 进行中`,
        summary: '查看巡演进度、场次状态与快捷入口。',
        ctaText: '查看巡演'
      };
  }
}
```

```ts
refreshFeed() {
  const { spotlights, eras, news } = getHomeFeed();

  this.setData({
    spotlights: spotlights.map((item) => ({
      ...item,
      ...getHomeSpotlightDisplay(item)
    })),
    eras,
    news
  });
}
```

- [ ] **Step 4: Run the home test and typecheck to verify the enum mapping is complete**

Run: `npm run test:home`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit the display mapping**

```bash
git add pages/home/index.ts tests/home-module.test.ts
git commit -m "feat: map home spotlight types to display copy"
```

### Task 5: Sync Supporting Docs and Final Verification

**Files:**
- Modify: `docs/data.md`
- Modify: `docs/api.md`
- Test: `tests/home-module.test.ts`

- [ ] **Step 1: Add a failing documentation assertion that the home API doc uses `spotlights`**

```ts
test('home api docs describe the spotlights list contract', () => {
  const apiDoc = readFileSync(new URL('../docs/api.md', import.meta.url), 'utf8');

  assert.match(apiDoc, /spotlights/);
  assert.doesNotMatch(apiDoc, /spotlight 用于条件展示的首页事件 Hero/);
});
```

- [ ] **Step 2: Run the home test to verify the docs still describe the old single spotlight contract**

Run: `npm run test:home`
Expected: FAIL because `docs/api.md` still references `spotlight + eras + news`.

- [ ] **Step 3: Update the docs to match the implemented contract**

```md
- 当前首页聚合数据由 `spotlights + eras + news` 组成
- `spotlights` 用于条件展示的首页事件列表，允许为空数组
- 这三组数据目前都由本地 mock 和 selector 聚合得到
```

```md
- 如果首页改为服务端供数，优先设计 `GET /home`，返回 `spotlights`、`eras`、`news` 三个字段；其中 `spotlights` 允许为空数组
```

- [ ] **Step 4: Run the full verification for the touched surface**

Run: `npm run test:home`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit the docs and verified contract**

```bash
git add docs/data.md docs/api.md tests/home-module.test.ts
git commit -m "docs: align home spotlight contract"
```

## Self-Review

- Spec coverage:
  - Section 3 aggregation boundary is implemented in Task 2 and reinforced in Task 3 by keeping the page on `getHomeFeed()`.
  - Section 4 type and data model changes are covered in Tasks 1 and 2.
  - Section 5 windowing and sorting rules are covered in Task 2 test cases and selector implementation.
  - Section 6 copy mapping is covered in Task 4.
  - Sections 8 and 9 contract and empty-state behavior are covered in Tasks 2, 3, and 5.
- Placeholder scan:
  - No `TODO`, `TBD`, or “similar to above” references remain in tasks.
  - Each code-changing step includes concrete snippets or commands.
- Type consistency:
  - The plan consistently uses `HomeFeed.spotlights`, `HomeSpotlightType`, `getHomeFeed(today?)`, and `getHomeSpotlightDisplay`.
