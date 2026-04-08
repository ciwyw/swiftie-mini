# Tour Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the tour tab into a mock-data-driven mini-program flow covering tour home, tour detail, show detail, ticket checklist, and video upload.

**Architecture:** Keep the existing native WeChat mini-program structure and extend it with focused tour-domain data files, selectors, and storage helpers. Put logic-heavy behavior in TypeScript helpers that can be unit-tested, then keep each page script thin so WXML/WXSS mostly handles rendering and interaction wiring.

**Tech Stack:** WeChat Mini Program, TypeScript, WXML, WXSS, local mock data, `wx.navigateTo`, `wx.setStorageSync`, Node test runner via `tsx`

---

## File Structure

### Create

- `package.json` — local scripts for tour-module tests and type-checking
- `tests/tour-module.test.ts` — unit coverage for selectors, derived status rules, and checklist storage
- `data/shows.ts` — show mock records keyed by `tourId`
- `data/videos.ts` — mock UGC video records keyed by `showId`
- `data/showGuides.ts` — `showId`-based ticket info, tips, venue guide, and surprise songs
- `pages/tour/detail/index.json` — navigation title and `empty-state` component registration
- `pages/tour/detail/index.ts` — tour detail controller
- `pages/tour/detail/index.wxml` — tour detail layout
- `pages/tour/detail/index.wxss` — tour detail styles
- `pages/show/detail/index.json` — navigation title and `empty-state` component registration
- `pages/show/detail/index.ts` — show detail controller
- `pages/show/detail/index.wxml` — show detail layout
- `pages/show/detail/index.wxss` — show detail styles
- `pages/guide/index.json` — navigation title
- `pages/guide/index.ts` — checklist controller
- `pages/guide/index.wxml` — checklist layout
- `pages/guide/index.wxss` — checklist styles
- `pages/video/upload/index.json` — navigation title
- `pages/video/upload/index.ts` — upload form controller
- `pages/video/upload/index.wxml` — upload form layout
- `pages/video/upload/index.wxss` — upload form styles

### Modify

- `app.json` — register new page routes and replace the legacy tour detail page path
- `README.md` — correct local run path and mention the new tour flow
- `data/tours.ts` — expand tour fields to include `status`, `cover`, and `description`
- `pages/tour/index.json` — keep `info-card` and adjust title if needed
- `pages/tour/index.ts` — load derived home status and richer tour card data
- `pages/tour/index.wxml` — render status card, timeline cards, and placeholder sections
- `pages/tour/index.wxss` — add card/list styling for the new home layout
- `types/tour.ts` — expand tour-domain interfaces and shared derived-view-model types
- `utils/constants.ts` — add route constants and storage keys
- `utils/selectors.ts` — add show/video/guide queries and derived display helpers
- `utils/storage.ts` — add guide checklist persistence helpers

### Leave Untouched Until Final Cleanup

- `pages/tourDetail/index.*` — keep during implementation for reference, then remove from routing once `pages/tour/detail` is verified

---

### Task 1: Add Tooling and Lock the Tour-Domain Contract

**Files:**
- Create: `package.json`
- Create: `tests/tour-module.test.ts`
- Modify: `types/tour.ts`
- Modify: `utils/constants.ts`

- [ ] **Step 1: Write the failing contract tests**

```ts
// tests/tour-module.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getShowDetailSections,
  getTourHomeStatus,
  getTourProgress
} from '../utils/selectors';
import {
  getGuideChecklistByTourId,
  toggleGuideChecklistItem
} from '../utils/storage';

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

test('getTourHomeStatus returns ongoing when any show is ongoing', () => {
  const result = getTourHomeStatus([
    { id: 'show_a', tourId: 'tour_eras', city: 'Tokyo', venue: 'Tokyo Dome', date: '2024-02-10', status: 'ongoing' }
  ]);

  assert.equal(result.label, '正在进行中');
});

test('getTourProgress counts ended shows and rounds percentage', () => {
  const progress = getTourProgress([
    { id: 's1', tourId: 'tour_eras', city: 'Tokyo', venue: 'Tokyo Dome', date: '2024-02-10', status: 'ended' },
    { id: 's2', tourId: 'tour_eras', city: 'Singapore', venue: 'National Stadium', date: '2024-03-08', status: 'upcoming' }
  ]);

  assert.deepEqual(progress, { completed: 1, total: 2, percent: 50 });
});

test('getShowDetailSections keeps tips for ongoing shows and surprise songs for ended shows', () => {
  assert.deepEqual(getShowDetailSections('ongoing'), {
    showTicketInfo: true,
    showTips: true,
    showVenueGuide: true,
    showSurpriseSongs: false
  });

  assert.deepEqual(getShowDetailSections('ended'), {
    showTicketInfo: true,
    showTips: false,
    showVenueGuide: false,
    showSurpriseSongs: true
  });
});

test('toggleGuideChecklistItem stores ids per tour bucket', () => {
  storage.clear();

  assert.deepEqual(getGuideChecklistByTourId('tour_eras'), []);
  assert.deepEqual(toggleGuideChecklistItem('tour_eras', 'register_account'), ['register_account']);
  assert.deepEqual(toggleGuideChecklistItem('tour_eras', 'register_account'), []);
});
```

- [ ] **Step 2: Run the tests to capture the missing exports**

Run: `npm run test:tour`  
Expected: FAIL with missing `package.json` or missing exports from `utils/selectors` / `utils/storage`

- [ ] **Step 3: Add the local scripts and shared type/constants contract**

```json
{
  "name": "swiftie-mini",
  "private": true,
  "scripts": {
    "test:tour": "tsx --test tests/tour-module.test.ts",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "tsx": "^4.19.3",
    "typescript": "^5.8.3"
  }
}
```

```ts
// types/tour.ts
export type TourStatus = 'ongoing' | 'ended' | 'break';
export type ShowStatus = 'upcoming' | 'ongoing' | 'ended';

export interface Tour {
  id: string;
  name: string;
  year: number;
  status: TourStatus;
  cover: string;
  description: string;
}

export interface Show {
  id: string;
  tourId: string;
  city: string;
  venue: string;
  date: string;
  status: ShowStatus;
}

export interface Video {
  id: string;
  showId: string;
  title: string;
  cover: string;
  song?: string;
}

export interface ShowGuide {
  showId: string;
  ticketInfo: string[];
  tips: string[];
  venueGuide: string[];
  surpriseSongs: string[];
}

export interface TourHomeStatus {
  label: '正在进行中' | '已结束' | '空档期';
  desc: string;
}

export interface TourProgress {
  completed: number;
  total: number;
  percent: number;
}
```

```ts
// utils/constants.ts
export const STORAGE_KEYS = {
  favoriteSongIds: 'favoriteSongIds',
  userProfileCache: 'userProfileCache',
  tourGuideChecklist: 'tourGuideChecklist'
} as const;

export const ROUTES = {
  library: '/pages/library/index',
  tour: '/pages/tour/index',
  tourDetail: '/pages/tour/detail/index',
  showDetail: '/pages/show/detail/index',
  guide: '/pages/guide/index',
  videoUpload: '/pages/video/upload/index',
  album: '/pages/album/index',
  song: '/pages/song/index'
} as const;
```

- [ ] **Step 4: Install dev dependencies and rerun the tests**

Run: `npm install`  
Expected: packages installed and `package-lock.json` created

Run: `npm run test:tour`  
Expected: FAIL only on missing selector/storage implementations

- [ ] **Step 5: Commit the foundation contract**

```bash
git add package.json package-lock.json tests/tour-module.test.ts types/tour.ts utils/constants.ts
git commit -m "test: add tour module contracts"
```

### Task 2: Implement Mock Data, Derived Helpers, and Checklist Storage

**Files:**
- Modify: `data/tours.ts`
- Create: `data/shows.ts`
- Create: `data/videos.ts`
- Create: `data/showGuides.ts`
- Modify: `utils/selectors.ts`
- Modify: `utils/storage.ts`
- Test: `tests/tour-module.test.ts`

- [ ] **Step 1: Extend the failing tests with real tour-module expectations**

```ts
import { getShowGuideByShowId, getTourById } from '../utils/selectors';

test('getTourById returns the expanded tour record', () => {
  const tour = getTourById('tour_eras');
  assert.equal(tour?.cover, '/assets/images/ui/avatar-placeholder.png');
  assert.equal(tour?.status, 'ongoing');
});

test('getShowGuideByShowId returns surprise songs for ended shows', () => {
  const guide = getShowGuideByShowId('show_singapore_n1');
  assert.deepEqual(guide?.surpriseSongs, ['Tim McGraw', 'mirrorball']);
});
```

- [ ] **Step 2: Run the tests and confirm helper/data failures**

Run: `npm run test:tour`  
Expected: FAIL with missing `getTourById`, `getShowGuideByShowId`, or incorrect mock shape

- [ ] **Step 3: Implement the tour data and selectors**

```ts
// data/tours.ts
export const tours: Tour[] = [
  {
    id: 'tour_eras',
    name: 'The Eras Tour',
    year: 2023,
    status: 'ongoing',
    cover: '/assets/images/ui/avatar-placeholder.png',
    description: 'A career-spanning stadium tour covering every album era.'
  },
  {
    id: 'tour_reputation',
    name: 'Reputation Stadium Tour',
    year: 2018,
    status: 'ended',
    cover: '/assets/images/ui/avatar-placeholder.png',
    description: 'A dark-pop stadium era with snakes, fire, and massive sing-alongs.'
  },
  {
    id: 'tour_1989',
    name: 'The 1989 World Tour',
    year: 2015,
    status: 'ended',
    cover: '/assets/images/ui/avatar-placeholder.png',
    description: 'The global pop era tour built around 1989 and guest appearances.'
  }
];
```

```ts
// data/shows.ts
export const shows: Show[] = [
  { id: 'show_tokyo_n1', tourId: 'tour_eras', city: 'Tokyo', venue: 'Tokyo Dome', date: '2024-02-10', status: 'ended' },
  { id: 'show_singapore_n1', tourId: 'tour_eras', city: 'Singapore', venue: 'National Stadium', date: '2024-03-08', status: 'ended' },
  { id: 'show_vancouver_n1', tourId: 'tour_eras', city: 'Vancouver', venue: 'BC Place', date: '2024-12-06', status: 'ongoing' },
  { id: 'show_arlington_n1', tourId: 'tour_reputation', city: 'Arlington', venue: 'AT&T Stadium', date: '2018-10-05', status: 'ended' }
];
```

```ts
// data/videos.ts
export const videos: Video[] = [
  { id: 'video_tokyo_1', showId: 'show_tokyo_n1', title: 'Tokyo Dome fan cam', cover: '/assets/images/ui/avatar-placeholder.png', song: 'Enchanted' },
  { id: 'video_singapore_1', showId: 'show_singapore_n1', title: 'Singapore night one recap', cover: '/assets/images/ui/avatar-placeholder.png', song: 'Tim McGraw' },
  { id: 'video_vancouver_1', showId: 'show_vancouver_n1', title: 'Queue vlog before doors open', cover: '/assets/images/ui/avatar-placeholder.png' }
];
```

```ts
// data/showGuides.ts
export const showGuides: ShowGuide[] = [
  {
    showId: 'show_vancouver_n1',
    ticketInfo: ['开售平台：Ticketmaster', '建议提前登录并完成支付绑定'],
    tips: ['提前 30 分钟进入等待室', '准备多个设备和多个网络环境'],
    venueGuide: ['建议优先确认入场口', '预留安检时间并准备充电宝'],
    surpriseSongs: []
  },
  {
    showId: 'show_singapore_n1',
    ticketInfo: ['场次已结束，仅保留回顾信息'],
    tips: [],
    venueGuide: [],
    surpriseSongs: ['Tim McGraw', 'mirrorball']
  }
];
```

```ts
// utils/selectors.ts
export function getAllShows(): Show[] {
  return [...shows];
}

export function getTourById(id: string): Tour | undefined {
  return tours.find((tour) => tour.id === id);
}

export function getShowsByTourId(tourId: string): Show[] {
  return shows.filter((show) => show.tourId === tourId);
}

export function getShowById(id: string): Show | undefined {
  return shows.find((show) => show.id === id);
}

export function getVideosByShowId(showId: string): Video[] {
  return videos.filter((video) => video.showId === showId);
}

export function getShowGuideByShowId(showId: string): ShowGuide | undefined {
  return showGuides.find((guide) => guide.showId === showId);
}

export function getTourHomeStatus(allShows: Show[]): TourHomeStatus {
  if (allShows.some((show) => show.status === 'ongoing')) {
    return { label: '正在进行中', desc: '当前有巡演场次正在进行中。' };
  }

  if (allShows.some((show) => show.status === 'upcoming')) {
    return { label: '空档期', desc: '下一场演出尚未开始，先收藏攻略和视频。' };
  }

  return { label: '已结束', desc: '当前 mock 场次已全部结束。' };
}

export function getTourProgress(tourShows: Show[]): TourProgress {
  const total = tourShows.length;
  const completed = tourShows.filter((show) => show.status === 'ended').length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function getShowDetailSections(status: ShowStatus) {
  const isEnded = status === 'ended';
  return {
    showTicketInfo: true,
    showTips: !isEnded,
    showVenueGuide: !isEnded,
    showSurpriseSongs: isEnded
  };
}
```

```ts
// utils/storage.ts
type GuideChecklistMap = Record<string, string[]>;

export function getGuideChecklistMap(): GuideChecklistMap {
  const value = wx.getStorageSync<unknown>(STORAGE_KEYS.tourGuideChecklist);
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<GuideChecklistMap>((acc, [tourId, ids]) => {
    acc[tourId] = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
    return acc;
  }, {});
}

export function getGuideChecklistByTourId(tourId: string): string[] {
  return getGuideChecklistMap()[tourId] ?? [];
}

export function toggleGuideChecklistItem(tourId: string, itemId: string): string[] {
  const currentMap = getGuideChecklistMap();
  const currentItems = currentMap[tourId] ?? [];
  const nextItems = currentItems.includes(itemId)
    ? currentItems.filter((id) => id !== itemId)
    : [...currentItems, itemId];

  wx.setStorageSync(STORAGE_KEYS.tourGuideChecklist, {
    ...currentMap,
    [tourId]: nextItems
  });

  return nextItems;
}
```

- [ ] **Step 4: Run tests and type-check**

Run: `npm run test:tour`  
Expected: PASS for all selector/storage tests

Run: `npm run typecheck`  
Expected: PASS with no TypeScript errors

- [ ] **Step 5: Commit the domain layer**

```bash
git add data/tours.ts data/shows.ts data/videos.ts data/showGuides.ts utils/selectors.ts utils/storage.ts tests/tour-module.test.ts
git commit -m "feat: add tour module mock data and helpers"
```

### Task 3: Rebuild the Tour Home Page and Register New Routes

**Files:**
- Modify: `app.json`
- Modify: `pages/tour/index.json`
- Modify: `pages/tour/index.ts`
- Modify: `pages/tour/index.wxml`
- Modify: `pages/tour/index.wxss`

- [ ] **Step 1: Update page registration to point at the new detail routes**

```json
{
  "pages": [
    "pages/home/index",
    "pages/library/index",
    "pages/album/index",
    "pages/song/index",
    "pages/tour/index",
    "pages/tour/detail/index",
    "pages/show/detail/index",
    "pages/guide/index",
    "pages/video/upload/index",
    "pages/profile/index"
  ]
}
```

- [ ] **Step 2: Implement the richer tour home controller**

```ts
// pages/tour/index.ts
import { Tour, TourHomeStatus } from '../../types/tour';
import { ROUTES } from '../../utils/constants';
import { getAllShows, getTourHomeStatus, getTours } from '../../utils/selectors';

interface TourPageData {
  homeStatus: TourHomeStatus;
  tours: Tour[];
}

Page({
  data: {
    homeStatus: { label: '空档期', desc: '' },
    tours: []
  } as TourPageData,

  onLoad() {
    const tours = getTours();
    const homeStatus = getTourHomeStatus(getAllShows());
    this.setData({ tours, homeStatus });
  },

  goDetail(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.tourDetail}?id=${event.currentTarget.dataset.id}` });
  }
});
```

- [ ] **Step 3: Replace the WXML with status card, timeline cards, and placeholders**

```xml
<view class="container">
  <info-card title="巡演状态" subtitle="{{homeStatus.label}}" meta="{{homeStatus.desc}}">
    <view class="status-pill">{{homeStatus.label}}</view>
  </info-card>

  <info-card title="巡演时间轴" subtitle="Tap a tour to open details">
    <view
      wx:for="{{tours}}"
      wx:key="id"
      class="tour-card"
      data-id="{{item.id}}"
      bindtap="goDetail"
    >
      <view class="tour-cover"></view>
      <view class="tour-copy">
        <text class="tour-name">{{item.name}}</text>
        <text class="tour-meta">{{item.year}} · {{item.status}}</text>
      </view>
    </view>
  </info-card>

  <info-card title="精选视频">
    <text class="placeholder-text">饭拍精选区占位，后续可接真实列表。</text>
  </info-card>

  <info-card title="Surprise Songs">
    <text class="placeholder-text">Surprise Songs 回顾区占位。</text>
  </info-card>
</view>
```

- [ ] **Step 4: Style and smoke-test the page**

Run: `npm run typecheck`  
Expected: PASS

Manual: open WeChat DevTools on `pages/tour/index`  
Expected: top status card, tour timeline cards, and two placeholder sections are visible

- [ ] **Step 5: Commit the tour home route switch**

```bash
git add app.json pages/tour/index.json pages/tour/index.ts pages/tour/index.wxml pages/tour/index.wxss
git commit -m "feat: rebuild tour home page"
```

### Task 4: Build the New Tour Detail Page and Replace Legacy Navigation

**Files:**
- Create: `pages/tour/detail/index.json`
- Create: `pages/tour/detail/index.ts`
- Create: `pages/tour/detail/index.wxml`
- Create: `pages/tour/detail/index.wxss`
- Modify: `utils/selectors.ts`

- [ ] **Step 1: Add the detail-page data fetch and progress wiring**

```ts
// pages/tour/detail/index.ts
import { Show, Tour, TourProgress } from '../../../types/tour';
import { ROUTES } from '../../../utils/constants';
import { getTourById, getTourProgress, getShowsByTourId } from '../../../utils/selectors';

interface TourDetailData {
  tour: Tour | null;
  shows: Show[];
  progress: TourProgress;
  hasError: boolean;
}

Page({
  data: {
    tour: null,
    shows: [],
    progress: { completed: 0, total: 0, percent: 0 },
    hasError: false
  } as TourDetailData,

  onLoad(options: { id?: string }) {
    const id = options.id ?? '';
    const tour = getTourById(id);
    const shows = getShowsByTourId(id);

    if (!tour) {
      this.setData({ hasError: true });
      return;
    }

    this.setData({
      tour,
      shows,
      progress: getTourProgress(shows),
      hasError: false
    });
  },

  openGuide() {
    if (!this.data.tour) return;
    wx.navigateTo({ url: `${ROUTES.guide}?tourId=${this.data.tour.id}` });
  },

  openShow(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.showDetail}?id=${event.currentTarget.dataset.id}` });
  }
});
```

- [ ] **Step 2: Render the detail layout and hook up navigation**

```xml
<view class="container">
  <empty-state wx:if="{{hasError}}" title="巡演不存在" desc="请返回巡演列表重新选择。"></empty-state>

  <view wx:elif="{{tour}}">
    <view class="card hero-card">
      <view class="hero-cover"></view>
      <text class="hero-title">{{tour.name}}</text>
      <text class="hero-meta">{{tour.year}} · {{tour.status}}</text>
      <text class="hero-desc">{{tour.description}}</text>
    </view>

    <view class="card progress-card">
      <text class="section-title">巡演进度</text>
      <view class="progress-track">
        <view class="progress-fill" style="width: {{progress.percent}}%;"></view>
      </view>
      <text class="progress-copy">已完成 {{progress.completed}} / {{progress.total}} 场</text>
      <button class="primary-btn" bindtap="openGuide">打开抢票助手</button>
    </view>

    <view class="card">
      <text class="section-title">官摄视频</text>
      <text class="link-text">官方视频链接占位</text>
    </view>

    <view class="card">
      <text class="section-title">场次列表</text>
      <view wx:for="{{shows}}" wx:key="id" class="show-row" data-id="{{item.id}}" bindtap="openShow">
        <text class="show-city">{{item.city}}</text>
        <text class="show-meta">{{item.date}} · {{item.venue}}</text>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 3: Verify new detail routing and keep the old page out of app routing**

Run: `npm run typecheck`  
Expected: PASS

Manual: from `pages/tour/index`, tap a tour card  
Expected: navigation lands on `/pages/tour/detail/index?id=...` and the old `/pages/tourDetail/index` route is no longer in `app.json`

- [ ] **Step 4: Commit the new tour detail page**

```bash
git add pages/tour/detail/index.json pages/tour/detail/index.ts pages/tour/detail/index.wxml pages/tour/detail/index.wxss utils/selectors.ts
git commit -m "feat: add new tour detail page"
```

### Task 5: Build the Show Detail Page with Status-Driven Sections

**Files:**
- Create: `pages/show/detail/index.json`
- Create: `pages/show/detail/index.ts`
- Create: `pages/show/detail/index.wxml`
- Create: `pages/show/detail/index.wxss`
- Modify: `utils/selectors.ts`
- Test: `tests/tour-module.test.ts`

- [ ] **Step 1: Add a focused test for the show-detail section rules**

```ts
test('ended shows still keep ticket info but hide tips and venue guide', () => {
  assert.deepEqual(getShowDetailSections('ended'), {
    showTicketInfo: true,
    showTips: false,
    showVenueGuide: false,
    showSurpriseSongs: true
  });
});
```

- [ ] **Step 2: Run tests before wiring the page**

Run: `npm run test:tour`  
Expected: PASS, proving the status rules are locked before UI wiring

- [ ] **Step 3: Implement the show detail page around the derived section flags**

```ts
// pages/show/detail/index.ts
import { Show, ShowGuide, Video } from '../../../types/tour';
import { ROUTES } from '../../../utils/constants';
import {
  getShowById,
  getShowDetailSections,
  getShowGuideByShowId,
  getTourById,
  getVideosByShowId
} from '../../../utils/selectors';

interface ShowDetailData {
  show: Show | null;
  guide: ShowGuide | null;
  videos: Video[];
  tourName: string;
  hasError: boolean;
  expandedTips: boolean;
  expandedVenueGuide: boolean;
  sections: {
    showTicketInfo: boolean;
    showTips: boolean;
    showVenueGuide: boolean;
    showSurpriseSongs: boolean;
  };
}
```

```xml
<view class="container">
  <empty-state wx:if="{{hasError}}" title="场次不存在" desc="请返回巡演详情重新选择场次。"></empty-state>

  <view wx:elif="{{show}}">
    <view class="card">
      <text class="title">{{show.city}}</text>
      <text class="subtitle">{{show.date}} · {{show.venue}}</text>
      <text class="status-tag">{{show.status}}</text>
      <text class="subtitle">{{tourName}}</text>
    </view>

    <view class="card" wx:if="{{sections.showTicketInfo && guide}}">
      <text class="section-title">抢票信息</text>
      <text wx:for="{{guide.ticketInfo}}" wx:key="*this" class="bullet-line">- {{item}}</text>
    </view>

    <view class="card" wx:if="{{sections.showTips && guide}}">
      <view class="fold-header" bindtap="toggleTips">
        <text class="section-title">抢票技巧</text>
      </view>
      <view wx:if="{{expandedTips}}">
        <text wx:for="{{guide.tips}}" wx:key="*this" class="bullet-line">- {{item}}</text>
      </view>
    </view>

    <view class="card" wx:if="{{sections.showVenueGuide && guide}}">
      <view class="fold-header" bindtap="toggleVenueGuide">
        <text class="section-title">场馆攻略</text>
      </view>
      <view wx:if="{{expandedVenueGuide}}">
        <text wx:for="{{guide.venueGuide}}" wx:key="*this" class="bullet-line">- {{item}}</text>
      </view>
    </view>

    <view class="card" wx:if="{{sections.showSurpriseSongs && guide}}">
      <text class="section-title">Surprise Songs</text>
      <text wx:for="{{guide.surpriseSongs}}" wx:key="*this" class="bullet-line">- {{item}}</text>
    </view>

    <view class="card">
      <view class="video-head">
        <text class="section-title">饭拍视频</text>
        <button size="mini" bindtap="openUpload">上传视频</button>
      </view>
      <view wx:for="{{videos}}" wx:key="id" class="video-item">
        <view class="video-cover"></view>
        <text class="video-title">{{item.title}}</text>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 4: Type-check and manually verify both status branches**

Run: `npm run typecheck`  
Expected: PASS

Manual:
- open an `ongoing` or `upcoming` show and confirm ticket info, tips, venue guide, and videos render
- open an `ended` show and confirm ticket info + Surprise Songs + videos render, while tips and venue guide are hidden

- [ ] **Step 5: Commit the show detail page**

```bash
git add pages/show/detail/index.json pages/show/detail/index.ts pages/show/detail/index.wxml pages/show/detail/index.wxss tests/tour-module.test.ts utils/selectors.ts
git commit -m "feat: add status driven show detail page"
```

### Task 6: Build the Guide and Upload Pages

**Files:**
- Create: `pages/guide/index.json`
- Create: `pages/guide/index.ts`
- Create: `pages/guide/index.wxml`
- Create: `pages/guide/index.wxss`
- Create: `pages/video/upload/index.json`
- Create: `pages/video/upload/index.ts`
- Create: `pages/video/upload/index.wxml`
- Create: `pages/video/upload/index.wxss`
- Modify: `utils/storage.ts`

- [ ] **Step 1: Add checklist and upload controllers**

```ts
// pages/guide/index.ts
const GUIDE_STEPS = [
  { title: 'Step 1', items: [{ id: 'register_account', label: '注册账号' }, { id: 'bind_payment', label: '绑定支付' }] },
  { title: 'Step 2', items: [{ id: 'enter_early', label: '提前进入' }, { id: 'multi_device', label: '多设备' }] },
  { title: 'Step 3', items: [{ id: 'waitlist', label: '候补' }, { id: 'resale', label: '转售' }] }
];
```

```ts
// pages/video/upload/index.ts
interface UploadData {
  showId: string;
  title: string;
  song: string;
  selectedVideo: boolean;
}

Page({
  data: {
    showId: '',
    title: '',
    song: '',
    selectedVideo: false
  } as UploadData,

  onLoad(options: { showId?: string }) {
    this.setData({ showId: options.showId ?? '' });
  },

  mockPickVideo() {
    this.setData({ selectedVideo: true });
  },

  submit() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }

    wx.showToast({ title: '上传成功（模拟）', icon: 'success' });
  }
});
```

- [ ] **Step 2: Build the guide and upload layouts**

```xml
<!-- pages/guide/index.wxml -->
<view class="container">
  <view class="card" wx:for="{{steps}}" wx:key="title">
    <text class="section-title">{{item.title}}</text>
    <view wx:for="{{item.items}}" wx:key="id" class="check-row" data-id="{{item.id}}" bindtap="toggleItem">
      <text class="checkbox">{{checkedIds.includes(item.id) ? '✓' : '○'}}</text>
      <text>{{item.label}}</text>
    </view>
  </view>
</view>
```

```xml
<!-- pages/video/upload/index.wxml -->
<view class="container">
  <view class="card">
    <button bindtap="mockPickVideo">{{selectedVideo ? '已选择视频（模拟）' : '选择视频（模拟）'}}</button>
  </view>

  <view class="card">
    <input placeholder="请输入标题" value="{{title}}" bindinput="onTitleInput" />
    <input placeholder="歌曲（可选）" value="{{song}}" bindinput="onSongInput" />
    <button class="primary-btn" bindtap="submit">提交</button>
  </view>
</view>
```

- [ ] **Step 3: Verify checklist persistence and upload success toast**

Run: `npm run typecheck`  
Expected: PASS

Manual:
- open `/pages/guide/index?tourId=tour_eras`, toggle two items, leave and re-enter, expected checked state persists
- open `/pages/video/upload/index?showId=show_vancouver_n1`, submit with empty title and expect validation toast, then submit with a title and expect success toast

- [ ] **Step 4: Commit the secondary pages**

```bash
git add pages/guide/index.json pages/guide/index.ts pages/guide/index.wxml pages/guide/index.wxss pages/video/upload/index.json pages/video/upload/index.ts pages/video/upload/index.wxml pages/video/upload/index.wxss utils/storage.ts
git commit -m "feat: add guide and upload pages"
```

### Task 7: Final Integration Cleanup and Verification

**Files:**
- Modify: `README.md`
- Modify: `pages/tour/index.wxss`
- Modify: `pages/tour/detail/index.wxss`
- Modify: `pages/show/detail/index.wxss`
- Modify: `pages/guide/index.wxss`
- Modify: `pages/video/upload/index.wxss`

- [ ] **Step 1: Tighten styling and document the new flow**

```md
## 巡演模块

- 巡演首页：顶部状态区 + 巡演时间轴
- 巡演详情：进度条、官摄占位、场次列表
- 场次详情：根据状态展示抢票模块或 Surprise Songs
- 抢票助手：本地持久化 Checklist
- 上传视频：纯 mock 表单提交流程
```

- [ ] **Step 2: Run the complete verification pass**

Run: `npm run test:tour`  
Expected: PASS

Run: `npm run typecheck`  
Expected: PASS

Manual:
- verify `pages/tour/index -> pages/tour/detail -> pages/show/detail -> pages/video/upload` navigation works
- verify `pages/tour/detail -> pages/guide/index` navigation works
- verify no page depends on a remote API

- [ ] **Step 3: Commit the final polish**

```bash
git add README.md pages/tour/index.wxss pages/tour/detail/index.wxss pages/show/detail/index.wxss pages/guide/index.wxss pages/video/upload/index.wxss
git commit -m "docs: polish tour tab redesign"
```

## Self-Review

- Spec coverage: all five PRD pages, mock data structures, route changes, `show/detail` status-driven rendering, checklist persistence, and upload simulation each map to at least one task above.
- Placeholder scan: removed `TODO`-style language; every task includes concrete files, commands, and code anchors.
- Type consistency: `Tour`, `Show`, `Video`, `ShowGuide`, `TourHomeStatus`, `TourProgress`, `getShowDetailSections`, and checklist helper names are used consistently across tasks.
