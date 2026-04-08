# Tour Tab Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the existing tour module so the home page uses a single ongoing-tour hero plus ended-tour timeline, the tour detail page hides progress and ticket-help affordances for ended tours, and the show detail page adds address, clickable Surprise Songs, richer UGC metadata, and a fixed bottom upload action.

**Architecture:** Keep the current mini-program page structure and refine it with richer local mock data plus small selector/view-model helpers. The revised behavior should remain mock-only, with page scripts preparing display-ready data so WXML stays mostly declarative.

**Tech Stack:** WeChat Mini Program, TypeScript, WXML, WXSS, local mock data, `wx.navigateTo`, `wx.setStorageSync`, Node test runner via `tsx`

---

## File Structure

### Modify

- `tests/tour-module.test.ts` — extend selector tests for the revised guide and song-link data shape
- `types/tour.ts` — add `address`, richer `Video`, and `SurpriseSong` support
- `data/shows.ts` — add venue addresses
- `data/videos.ts` — add uploader name and upload time
- `data/showGuides.ts` — convert `surpriseSongs` to linkable song objects and make it optional
- `data/songs.ts` — add any song records referenced by Surprise Songs that are currently missing
- `utils/selectors.ts` — add helpers for `activeTour`, `timelineTours`, linkable Surprise Songs, and status-driven tour detail sections
- `pages/tour/index.ts` — split home data into `activeTour` and `timelineTours`
- `pages/tour/index.wxml` — replace status card with hero + vertical timeline, remove placeholder sections
- `pages/tour/index.wxss` — style hero and timeline layout
- `pages/tour/detail/index.ts` — derive top status and hide ended-tour progress/help UI
- `pages/tour/detail/index.wxml` — conditionally render progress/help area and simplify ended-show rows
- `pages/tour/detail/index.wxss` — style top status and ended-tour list layout
- `pages/show/detail/index.ts` — include address, clickable Surprise Songs, footer upload CTA, and richer video meta
- `pages/show/detail/index.wxml` — render address, song links, uploader info, timestamp, and bottom-fixed action
- `pages/show/detail/index.wxss` — add footer-safe spacing and video meta styling

### Keep As-Is

- `pages/guide/index.*`
- `pages/video/upload/index.*`
- `utils/storage.ts`

### Explicit Constraint

- Do not perform any git operations. Skip all `git add`, `git commit`, `git status`, branch, or PR steps while executing this plan.

---

### Task 1: Revise Mock Data and Selector Contracts

**Files:**
- Modify: `tests/tour-module.test.ts`
- Modify: `types/tour.ts`
- Modify: `data/shows.ts`
- Modify: `data/videos.ts`
- Modify: `data/showGuides.ts`
- Modify: `data/songs.ts`
- Modify: `utils/selectors.ts`

- [ ] **Step 1: Write the failing tests for revised data contracts**

```ts
// tests/tour-module.test.ts
import {
  getActiveTour,
  getShowGuideByShowId,
  getTimelineTours
} from '../utils/selectors';

test('getActiveTour returns the single ongoing tour', () => {
  const tour = getActiveTour();

  assert.equal(tour?.id, 'tour_eras');
  assert.equal(tour?.status, 'ongoing');
});

test('getTimelineTours returns only ended tours sorted by year desc', () => {
  const timelineTours = getTimelineTours();

  assert.deepEqual(
    timelineTours.map((tour) => tour.id),
    ['tour_reputation', 'tour_1989']
  );
});

test('show guide exposes linkable surprise songs when present', () => {
  const guide = getShowGuideByShowId('show_singapore_n1');

  assert.deepEqual(guide?.surpriseSongs, [
    { songId: 'song_tim_mcgraw', name: 'Tim McGraw' },
    { songId: 'song_mirrorball', name: 'mirrorball' }
  ]);
});
```

- [ ] **Step 2: Run tests to verify the new contract fails**

Run: `npm run test:tour`  
Expected: FAIL on missing `getActiveTour` / `getTimelineTours`, or on outdated `surpriseSongs` string arrays

- [ ] **Step 3: Implement the minimum data/type changes to satisfy the new contract**

```ts
// types/tour.ts
export interface SurpriseSong {
  songId: string;
  name: string;
}

export interface Show {
  id: string;
  tourId: string;
  city: string;
  venue: string;
  address: string;
  date: string;
  status: ShowStatus;
}

export interface Video {
  id: string;
  showId: string;
  title: string;
  cover: string;
  song?: string;
  userName: string;
  uploadTime: string;
}

export interface ShowGuide {
  showId: string;
  ticketInfo: string[];
  tips: string[];
  venueGuide: string[];
  surpriseSongs?: SurpriseSong[];
}
```

```ts
// utils/selectors.ts
export function getActiveTour(): Tour | undefined {
  return tours.find((tour) => tour.status === 'ongoing');
}

export function getTimelineTours(): Tour[] {
  return tours
    .filter((tour) => tour.status === 'ended')
    .sort((a, b) => b.year - a.year);
}
```

```ts
// data/showGuides.ts
{
  showId: 'show_singapore_n1',
  ticketInfo: ['场次已结束，仅保留回顾信息'],
  tips: [],
  venueGuide: [],
  surpriseSongs: [
    { songId: 'song_tim_mcgraw', name: 'Tim McGraw' },
    { songId: 'song_mirrorball', name: 'mirrorball' }
  ]
}
```

- [ ] **Step 4: Add the missing song mock records required by Surprise Songs**

```ts
// data/songs.ts
{
  id: 'song_tim_mcgraw',
  albumId: 'album_debut',
  name: 'Tim McGraw',
  duration: '3:52',
  lyricSnippet: 'When you think Tim McGraw',
  translation: '当你想起 Tim McGraw'
},
{
  id: 'song_mirrorball',
  albumId: 'album_folklore',
  name: 'mirrorball',
  duration: '3:28',
  lyricSnippet: 'I can change everything about me to fit in',
  translation: '我愿意改变自己的一切去融入其中'
}
```

- [ ] **Step 5: Run tests and type-check**

Run: `npm run test:tour`  
Expected: PASS with the revised selector and guide-shape tests green

Run: `npm run typecheck`  
Expected: PASS

### Task 2: Rebuild the Tour Home as Hero + Timeline

**Files:**
- Modify: `pages/tour/index.ts`
- Modify: `pages/tour/index.wxml`
- Modify: `pages/tour/index.wxss`

- [ ] **Step 1: Write the failing selector expectation for ended-only timeline data**

```ts
test('timeline tours exclude the ongoing tour hero entry', () => {
  const activeTour = getActiveTour();
  const timelineTours = getTimelineTours();

  assert.equal(timelineTours.some((tour) => tour.id === activeTour?.id), false);
});
```

- [ ] **Step 2: Run tests to ensure the timeline split is enforced before page changes**

Run: `npm run test:tour`  
Expected: PASS after Task 1, confirming the page work can rely on `getActiveTour()` and `getTimelineTours()`

- [ ] **Step 3: Replace home-page data and layout**

```ts
// pages/tour/index.ts
interface TimelineTour extends Tour {
  timelineLabel: string;
}

interface TourData {
  activeTour: Tour | null;
  timelineTours: TimelineTour[];
}

Page({
  data: {
    activeTour: null,
    timelineTours: []
  } as TourData,

  onLoad() {
    const activeTour = getActiveTour() ?? null;
    const timelineTours = getTimelineTours().map((tour) => ({
      ...tour,
      timelineLabel: `${tour.year}`
    }));

    this.setData({ activeTour, timelineTours });
  }
});
```

```xml
<!-- pages/tour/index.wxml -->
<view class="container">
  <view
    wx:if="{{activeTour}}"
    class="hero-card"
    data-id="{{activeTour.id}}"
    bindtap="goDetail"
  >
    <image class="hero-cover" src="{{activeTour.cover}}" mode="aspectFill"></image>
    <view class="hero-overlay">
      <text class="hero-status">进行中巡演</text>
      <text class="hero-title">{{activeTour.name}}</text>
    </view>
  </view>

  <view class="card timeline-card">
    <text class="section-title">已结束巡演时间轴</text>
    <view wx:for="{{timelineTours}}" wx:key="id" class="timeline-item" data-id="{{item.id}}" bindtap="goDetail">
      <view class="timeline-rail">
        <text class="timeline-year">{{item.timelineLabel}}</text>
        <text class="timeline-dot"></text>
        <text class="timeline-line" wx:if="{{index !== timelineTours.length - 1}}"></text>
      </view>
      <view class="timeline-content">
        <text class="timeline-title">{{item.name}}</text>
        <text class="timeline-desc">{{item.description}}</text>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 4: Remove the old placeholder sections and style the new layout**

Run: `npm run typecheck`  
Expected: PASS

Manual: in WeChat DevTools open `pages/tour/index`  
Expected:
- one clickable ongoing-tour hero at top
- no “精选视频” section
- no “Surprise Songs” section
- ended tours only appear in the vertical timeline

### Task 3: Make Tour Detail Status-Driven

**Files:**
- Modify: `pages/tour/detail/index.ts`
- Modify: `pages/tour/detail/index.wxml`
- Modify: `pages/tour/detail/index.wxss`

- [ ] **Step 1: Add the failing test for ended-tour status behavior**

```ts
import { getTourById } from '../utils/selectors';

test('ended tour remains ended in the detail view model source data', () => {
  const tour = getTourById('tour_reputation');
  assert.equal(tour?.status, 'ended');
});
```

- [ ] **Step 2: Run tests before the detail-page UI split**

Run: `npm run test:tour`  
Expected: PASS, confirming the mock tour status data is stable

- [ ] **Step 3: Update the detail page to hide progress/help for ended tours**

```ts
// pages/tour/detail/index.ts
interface ShowListItem extends Show {
  showStatusText: string;
}

interface TourDetailData {
  tour: Tour | null;
  shows: ShowListItem[];
  progress: TourProgress;
  hasError: boolean;
  isEndedTour: boolean;
  tourStatusText: string;
}
```

```xml
<!-- pages/tour/detail/index.wxml -->
<view class="card hero-card">
  <image class="hero-cover" src="{{tour.cover}}" mode="aspectFill"></image>
  <text class="hero-status">{{tourStatusText}}</text>
  <text class="hero-title">{{tour.name}}</text>
  <text class="hero-meta">{{tour.year}} 年</text>
  <text class="hero-desc">{{tour.description}}</text>
</view>

<view class="card progress-card" wx:if="{{!isEndedTour}}">
  <text class="section-title">巡演进度</text>
  <view class="progress-track">
    <view class="progress-fill" style="width: {{progress.percent}}%;"></view>
  </view>
  <text class="progress-copy">已完成 {{progress.completed}} / {{progress.total}} 场</text>
  <button class="primary-btn" bindtap="openGuide">打开抢票助手</button>
</view>

<view wx:for="{{shows}}" wx:key="id" class="show-item" data-id="{{item.id}}" bindtap="openShow">
  <text class="show-city">{{item.city}}</text>
  <text class="show-meta">{{item.date}} · {{item.venue}}</text>
  <text wx:if="{{!isEndedTour}}" class="show-status">{{item.showStatusText}}</text>
</view>
```

- [ ] **Step 4: Verify the status-driven branch**

Run: `npm run typecheck`  
Expected: PASS

Manual:
- open `tour_eras` detail and confirm progress + guide CTA are visible
- open `tour_reputation` detail and confirm progress + guide CTA are hidden
- in ended-tour detail confirm show rows do not repeat an “已结束” label

### Task 4: Enhance Show Detail with Address, Song Links, and Fixed Upload Footer

**Files:**
- Modify: `pages/show/detail/index.ts`
- Modify: `pages/show/detail/index.wxml`
- Modify: `pages/show/detail/index.wxss`

- [ ] **Step 1: Write the failing tests for enriched show detail data**

```ts
import { getShowById, getVideosByShowId } from '../utils/selectors';

test('show data includes a venue address', () => {
  const show = getShowById('show_singapore_n1');
  assert.equal(typeof show?.address, 'string');
  assert.equal(Boolean(show?.address), true);
});

test('video cards expose uploader metadata', () => {
  const video = getVideosByShowId('show_singapore_n1')[0];
  assert.equal(typeof video?.userName, 'string');
  assert.equal(typeof video?.uploadTime, 'string');
});
```

- [ ] **Step 2: Run tests and confirm missing address or uploader metadata**

Run: `npm run test:tour`  
Expected: FAIL on missing `address`, `userName`, or `uploadTime`

- [ ] **Step 3: Implement the minimal page/data changes**

```ts
// pages/show/detail/index.ts
interface ShowDetailData {
  show: (Show & { statusText: string }) | null;
  guide: ShowGuide | null;
  videos: Video[];
  tourName: string;
  hasError: boolean;
  expandedTips: boolean;
  expandedVenueGuide: boolean;
  sections: ShowSections;
}

goSong(event: { currentTarget: { dataset: { id: string } } }) {
  wx.navigateTo({ url: `${ROUTES.song}?id=${event.currentTarget.dataset.id}` });
}
```

```xml
<!-- pages/show/detail/index.wxml -->
<view class="card">
  <text class="show-title">{{show.city}}</text>
  <text class="show-meta">{{show.date}} · {{show.venue}}</text>
  <text class="show-address">{{show.address}}</text>
  <text class="status-tag">{{show.statusText}}</text>
  <text class="tour-name">{{tourName}}</text>
</view>

<view class="card" wx:if="{{sections.showSurpriseSongs && guide && guide.surpriseSongs && guide.surpriseSongs.length}}">
  <text class="section-title">Surprise Songs</text>
  <view
    wx:for="{{guide.surpriseSongs}}"
    wx:key="songId"
    class="song-link"
    data-id="{{item.songId}}"
    bindtap="goSong"
  >
    <text class="song-link-text">{{item.name}}</text>
  </view>
</view>

<view wx:for="{{videos}}" wx:key="id" class="video-item">
  <image class="video-cover" src="{{item.cover}}" mode="aspectFill"></image>
  <view class="video-copy">
    <text class="video-title">{{item.title}}</text>
    <text class="video-song" wx:if="{{item.song}}">{{item.song}}</text>
    <text class="video-meta">{{item.userName}} · {{item.uploadTime}}</text>
  </view>
</view>

<view class="upload-footer">
  <button class="upload-footer-btn" bindtap="openUpload">上传视频</button>
</view>
```

- [ ] **Step 4: Verify the richer show-detail behavior**

Run: `npm run test:tour`  
Expected: PASS

Run: `npm run typecheck`  
Expected: PASS

Manual:
- ended show with `surpriseSongs` displays clickable song rows
- ended show without `surpriseSongs` hides the whole module
- show header includes full address
- video cards show uploader name and upload time
- upload button stays fixed at page bottom and content does not sit underneath it

## Self-Review

- Spec coverage: revised hero/timeline home, status-driven tour detail, address field, optional `Surprise Songs`, linkable songs, richer UGC metadata, and fixed footer upload CTA each map to a dedicated task above.
- Placeholder scan: omitted all git/commit steps because the user explicitly forbade git operations; every remaining step includes concrete files, commands, and code anchors.
- Type consistency: `SurpriseSong`, `address`, `userName`, `uploadTime`, `getActiveTour`, and `getTimelineTours` are defined once and referenced consistently across data, selectors, and pages.
