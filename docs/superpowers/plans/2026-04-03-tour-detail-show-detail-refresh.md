# Tour Detail And Show Detail Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the tour detail and show detail experience so tours expose a date range and official setlists, shows are grouped by country and city, cancelled shows are non-clickable, and show detail fields come from structured ticket and venue data instead of hard-coded prose.

**Architecture:** Expand the tour domain model first, then rebuild selector outputs so page controllers only consume prepared view-model data. After the data contract is stable, update the two tour pages to render the new hierarchy and structured sections while preserving existing routes and local-mock boundaries.

**Tech Stack:** WeChat Mini Program native pages, TypeScript, WXML, WXSS, `tsx --test`, `tsc --noEmit`

---

**Git note:** `/Users/bytedance/projects/swiftie-mini` is not currently a Git repository, so the normal “commit after each task” step is replaced with an explicit verification checkpoint.

## File Structure

- Modify: `tests/tour-module.test.ts`
  Add failing tests for new tour range, setlists, grouped show lists, cancelled show clickability, and structured guide data.
- Modify: `types/tour.ts`
  Expand the tour, show, and show guide contracts for range labels, setlists, guests, surprise songs, and structured ticket and venue fields.
- Modify: `data/tours.ts`
  Add range metadata and one-or-many official setlist versions per tour.
- Modify: `data/shows.ts`
  Add `country`, `cancelled` support, and move surprise guests / surprise songs onto `Show`.
- Modify: `data/showGuides.ts`
  Replace prose arrays with structured ticket and venue fields.
- Modify: `utils/selectors.ts`
  Add shared status-text helpers, clickability rules, and grouped country/city/show derivation for the tour detail page.
- Modify: `pages/tour/detail/index.ts`
  Swap the flat show list for grouped view-model data and remove the guide entry point.
- Modify: `pages/tour/detail/index.wxml`
  Render range label, setlists, and collapsible country groups.
- Modify: `pages/tour/detail/index.wxss`
  Style setlist cards, country toggles, city headers, disabled rows, and guest summaries.
- Modify: `pages/show/detail/index.ts`
  Remove tip/venue folding state, consume structured guide fields, and read surprise content from `Show`.
- Modify: `pages/show/detail/index.wxml`
  Render structured ticket and venue fields plus optional guest/song blocks.
- Modify: `pages/show/detail/index.wxss`
  Style the new summary card and key-value sections without the removed fold interactions.

### Task 1: Lock The Domain Contract With Failing Tests

**Files:**
- Modify: `tests/tour-module.test.ts:1-140`
- Modify: `types/tour.ts:1-55`

- [ ] **Step 1: Write the failing tests for the new tour and show contract**

Add these assertions to `tests/tour-module.test.ts` so the data contract is pinned before implementation:

```ts
import {
  getActiveTour,
  getShowById,
  getShowGuideByShowId,
  getShowStatusText,
  getTourStatusText,
  getTimelineTours,
  getTourById,
  getTourProgress,
  getTourShowGroupsByTourId,
  getVideosByShowId,
  isShowClickable
} from '../utils/selectors';

test('getTourById returns range label and multiple setlists when available', () => {
  const tour = getTourById('tour_eras');

  assert.equal(tour?.rangeLabel, '2023.3 - 2024.12');
  assert.equal(tour?.setlists.length, 2);
  assert.equal(tour?.setlists[0]?.label, 'Standard Setlist');
});

test('getShowById returns country, guests, and surprise songs from the show record', () => {
  const show = getShowById('show_singapore_n1');

  assert.equal(show?.country, 'Singapore');
  assert.deepEqual(show?.surpriseGuests, [{ name: 'Sabrina Carpenter' }]);
  assert.deepEqual(show?.surpriseSongs, [
    { songId: 'song_tim_mcgraw', name: 'Tim McGraw' },
    { songId: 'song_mirrorball', name: 'mirrorball' }
  ]);
});

test('getShowGuideByShowId returns structured ticket and venue fields', () => {
  const guide = getShowGuideByShowId('show_vancouver_n1');

  assert.equal(guide?.ticketPlatform, 'Ticketmaster');
  assert.equal(guide?.saleTime, '2024-10-01 11:00');
  assert.deepEqual(guide?.ticketTiers[0], {
    name: 'Lower Bowl',
    price: 'CAD 289'
  });
  assert.equal(typeof guide?.address, 'string');
});

test('getShowStatusText maps all four show states', () => {
  assert.equal(getShowStatusText('upcoming'), '待开始');
  assert.equal(getShowStatusText('ongoing'), '进行中');
  assert.equal(getShowStatusText('ended'), '已结束');
  assert.equal(getShowStatusText('cancelled'), '已取消');
});

test('getTourStatusText maps all tour states', () => {
  assert.equal(getTourStatusText('ongoing'), '进行中');
  assert.equal(getTourStatusText('ended'), '已结束');
  assert.equal(getTourStatusText('break'), '空档期');
});

test('isShowClickable returns false only for cancelled shows', () => {
  assert.equal(isShowClickable({ status: 'cancelled' } as never), false);
  assert.equal(isShowClickable({ status: 'upcoming' } as never), true);
});

test('getTourShowGroupsByTourId groups shows by country then city', () => {
  const groups = getTourShowGroupsByTourId('tour_eras');

  assert.equal(groups[0]?.country, 'Japan');
  assert.equal(groups[0]?.cities[0]?.city, 'Tokyo');
  assert.equal(groups[0]?.cities[0]?.shows[0]?.statusText, '已结束');
});

test('getTourProgress still counts total shows when cancelled entries exist', () => {
  const progress = getTourProgress([
    {
      id: 's1',
      tourId: 'tour_eras',
      country: 'Japan',
      city: 'Tokyo',
      venue: 'Tokyo Dome',
      date: '2024-02-10',
      status: 'ended'
    },
    {
      id: 's2',
      tourId: 'tour_eras',
      country: 'Canada',
      city: 'Toronto',
      venue: 'Rogers Centre',
      date: '2024-11-22',
      status: 'cancelled'
    }
  ]);

  assert.deepEqual(progress, { completed: 1, total: 2, percent: 50 });
});
```

- [ ] **Step 2: Run the tour test suite to verify the new contract fails**

Run: `npm run test:tour`

Expected: FAIL with TypeScript or runtime errors for missing exports like `getShowStatusText`, missing `rangeLabel`, and the old `ShowGuide` shape.

- [ ] **Step 3: Update the domain types to match the approved design**

Replace the old interfaces in `types/tour.ts` with this structure:

```ts
export type TourStatus = 'ongoing' | 'ended' | 'break';
export type ShowStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';

export interface TourSetlistVersion {
  id: string;
  label: string;
  songs: string[];
}

export interface Tour {
  id: string;
  name: string;
  year: number;
  status: TourStatus;
  cover: string;
  description: string;
  startDate: string;
  endDate: string;
  rangeLabel: string;
  setlists: TourSetlistVersion[];
}

export interface SurpriseSong {
  songId: string;
  name: string;
}

export interface ShowGuest {
  name: string;
}

export interface Show {
  id: string;
  tourId: string;
  country: string;
  city: string;
  venue: string;
  date: string;
  status: ShowStatus;
  surpriseGuests?: ShowGuest[];
  surpriseSongs?: SurpriseSong[];
}

export interface TicketTier {
  name: string;
  price: string;
}

export interface ShowGuide {
  showId: string;
  ticketPlatform?: string;
  saleTime?: string;
  ticketTiers: TicketTier[];
  entryTime?: string;
  address: string;
  seatMapImage?: string;
  notes?: string[];
}
```

- [ ] **Step 4: Run the tour tests again to verify selectors and mocks are now the failing layer**

Run: `npm run test:tour`

Expected: FAIL because `data/tours.ts`, `data/shows.ts`, `data/showGuides.ts`, and `utils/selectors.ts` still return the old shape.

- [ ] **Step 5: Verification checkpoint**

Run: `npm run typecheck`

Expected: FAIL with type errors pointing at outdated mock files and page consumers; this confirms the new types are enforced before implementation continues.

### Task 2: Rebuild Mock Data And Selectors

**Files:**
- Modify: `data/tours.ts:1-28`
- Modify: `data/shows.ts:1-40`
- Modify: `data/showGuides.ts:1-41`
- Modify: `utils/selectors.ts:1-109`

- [ ] **Step 1: Fill the tour mock with range labels and official setlists**

Update `data/tours.ts` so each tour matches the new contract. Use this shape for `tour_eras`:

```ts
{
  id: 'tour_eras',
  name: 'The Eras Tour',
  year: 2023,
  status: 'ongoing',
  cover: '/assets/images/ui/avatar-placeholder.png',
  description: 'A career-spanning stadium tour covering every album era.',
  startDate: '2023-03-17',
  endDate: '2024-12-08',
  rangeLabel: '2023.3 - 2024.12',
  setlists: [
    {
      id: 'standard',
      label: 'Standard Setlist',
      songs: ['Miss Americana & the Heartbreak Prince', 'Cruel Summer', 'The Man']
    },
    {
      id: 'ttpd',
      label: 'TTPD Added Setlist',
      songs: ['But Daddy I Love Him', 'So High School', 'Who’s Afraid of Little Old Me?']
    }
  ]
}
```

For ended tours, keep a single `setlists` entry with a representative standard list and set a stable `rangeLabel`.

- [ ] **Step 2: Move show content fields onto `Show` and add grouping metadata**

Update `data/shows.ts` so each show includes `country`, and the content-specific fields live on the show instead of the guide:

```ts
{
  id: 'show_singapore_n1',
  tourId: 'tour_eras',
  country: 'Singapore',
  city: 'Singapore',
  venue: 'National Stadium',
  date: '2024-03-08',
  status: 'ended',
  surpriseGuests: [{ name: 'Sabrina Carpenter' }],
  surpriseSongs: [
    { songId: 'song_tim_mcgraw', name: 'Tim McGraw' },
    { songId: 'song_mirrorball', name: 'mirrorball' }
  ]
}
```

Also add one cancelled sample show under `tour_eras`, for example:

```ts
{
  id: 'show_toronto_cancelled',
  tourId: 'tour_eras',
  country: 'Canada',
  city: 'Toronto',
  venue: 'Rogers Centre',
  date: '2024-11-23',
  status: 'cancelled'
}
```

- [ ] **Step 3: Replace guide prose with structured ticket and venue fields**

Rewrite `data/showGuides.ts` entries to match the new `ShowGuide` shape:

```ts
{
  showId: 'show_vancouver_n1',
  ticketPlatform: 'Ticketmaster',
  saleTime: '2024-10-01 11:00',
  ticketTiers: [
    { name: 'Lower Bowl', price: 'CAD 289' },
    { name: 'Floor', price: 'CAD 499' }
  ],
  entryTime: '18:00',
  address: '777 Pacific Blvd, Vancouver, BC V6B 4Y8',
  seatMapImage: '/assets/images/ui/avatar-placeholder.png',
  notes: ['建议提前确认入场口', '场馆周边安检排队时间较长']
}
```

Ended shows can keep `ticketTiers: []` when specific prices are unavailable, but `address` should always be present.

- [ ] **Step 4: Implement the new selector helpers and grouped output**

Replace the old `getShowDetailSections` flow in `utils/selectors.ts` with shared helpers and grouped output:

```ts
export function getShowStatusText(status: ShowStatus): string {
  switch (status) {
    case 'upcoming':
      return '待开始';
    case 'ongoing':
      return '进行中';
    case 'ended':
      return '已结束';
    case 'cancelled':
      return '已取消';
  }
}

export function getTourStatusText(status: TourStatus): string {
  switch (status) {
    case 'ongoing':
      return '进行中';
    case 'ended':
      return '已结束';
    case 'break':
      return '空档期';
  }
}

export function isShowClickable(show: Pick<Show, 'status'>): boolean {
  return show.status !== 'cancelled';
}

export function getTourShowGroupsByTourId(tourId: string) {
  const tourShows = getShowsByTourId(tourId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const countryMap = new Map<string, Map<string, typeof tourShows>>();

  tourShows.forEach((show) => {
    const cityMap = countryMap.get(show.country) ?? new Map<string, typeof tourShows>();
    const cityShows = cityMap.get(show.city) ?? [];
    cityShows.push(show);
    cityMap.set(show.city, cityShows);
    countryMap.set(show.country, cityMap);
  });

  return Array.from(countryMap.entries()).map(([country, cityMap]) => ({
    country,
    cities: Array.from(cityMap.entries()).map(([city, cityShows]) => ({
      city,
      shows: cityShows.map((show) => ({
        ...show,
        statusText: getShowStatusText(show.status),
        clickable: isShowClickable(show),
        surpriseGuestSummary: show.surpriseGuests?.map((guest) => guest.name).join(' / ') ?? ''
      }))
    }))
  }));
}
```

Keep `getTourProgress` counting `ended` shows only and counting all records in `total`.

- [ ] **Step 5: Run the tour tests to verify data and selectors are now green**

Run: `npm run test:tour`

Expected: PASS for selector and mock-data assertions, or a much smaller failure surface limited to page imports still referencing removed helpers.

- [ ] **Step 6: Verification checkpoint**

Run: `npm run typecheck`

Expected: FAIL only in `pages/tour/detail/index.ts` and `pages/show/detail/index.ts` because they still consume the removed `address`, `ticketInfo`, and `getShowDetailSections` shape.

### Task 3: Rebuild The Tour Detail Page

**Files:**
- Modify: `pages/tour/detail/index.ts:1-77`
- Modify: `pages/tour/detail/index.wxml:1-41`
- Modify: `pages/tour/detail/index.wxss:1-93`

- [ ] **Step 1: Typecheck first to confirm the page is still bound to the old selector contract**

Run: `npm run typecheck`

Expected: FAIL in `pages/tour/detail/index.ts` because the page still expects a flat `shows` list and still exposes `openGuide`.

- [ ] **Step 2: Replace the page controller with grouped show state and country toggle state**

Refactor `pages/tour/detail/index.ts` around the new grouped selector and remove the guide route dependency:

```ts
import { Tour, TourProgress } from '../../../types/tour';
import { ROUTES } from '../../../utils/constants';
import {
  getShowStatusText,
  getTourById,
  getTourProgress,
  getTourStatusText,
  getTourShowGroupsByTourId,
  getShowsByTourId
} from '../../../utils/selectors';

interface TourShowGroup {
  country: string;
  expanded: boolean;
  cities: Array<{
    city: string;
    shows: Array<{
      id: string;
      venue: string;
      date: string;
      statusText: string;
      clickable: boolean;
      surpriseGuestSummary: string;
    }>;
  }>;
}

interface TourDetailData {
  tour: Tour | null;
  showGroups: TourShowGroup[];
  progress: TourProgress;
  hasError: boolean;
  isEndedTour: boolean;
  tourStatusText: string;
}

Page({
  data: {
    tour: null,
    showGroups: [],
    progress: { completed: 0, total: 0, percent: 0 },
    hasError: false,
    isEndedTour: false,
    tourStatusText: ''
  } as TourDetailData,

  onLoad(options: { id?: string }) {
    const tourId = options.id ?? '';
    const tour = getTourById(tourId);

    if (!tour) {
      this.setData({ hasError: true });
      return;
    }

    this.setData({
      tour,
      showGroups: getTourShowGroupsByTourId(tourId).map((group) => ({ ...group, expanded: false })),
      progress: getTourProgress(getShowsByTourId(tourId)),
      isEndedTour: tour.status === 'ended',
      tourStatusText: getTourStatusText(tour.status),
      hasError: false
    });
  },

  toggleCountry(event: { currentTarget: { dataset: { country: string } } }) {
    const { country } = event.currentTarget.dataset;
    this.setData({
      showGroups: this.data.showGroups.map((group) =>
        group.country === country ? { ...group, expanded: !group.expanded } : group
      )
    });
  },

  openShow(event: { currentTarget: { dataset: { id: string; clickable: boolean } } }) {
    if (!event.currentTarget.dataset.clickable) {
      return;
    }

    wx.navigateTo({ url: `${ROUTES.showDetail}?id=${event.currentTarget.dataset.id}` });
  }
});
```

- [ ] **Step 3: Rewrite the WXML to show range label, setlists, and nested country groups**

Replace the body of `pages/tour/detail/index.wxml` with a structure like:

```xml
<view class="card hero-card">
  <image class="hero-cover" src="{{tour.cover}}" mode="aspectFill"></image>
  <text class="hero-status">{{tourStatusText}}</text>
  <text class="hero-title">{{tour.name}}</text>
  <text class="hero-range">{{tour.rangeLabel}}</text>
  <text class="hero-desc">{{tour.description}}</text>
</view>

<view class="card progress-card" wx:if="{{!isEndedTour}}">
  <text class="section-title">巡演进度</text>
  <view class="progress-track">
    <view class="progress-fill" style="width: {{progress.percent}}%;"></view>
  </view>
  <text class="progress-copy">已完成 {{progress.completed}} / {{progress.total}} 场</text>
</view>

<view class="card">
  <text class="section-title">官方 Setlist</text>
  <view wx:for="{{tour.setlists}}" wx:key="id" class="setlist-block">
    <text class="setlist-label">{{item.label}}</text>
    <text wx:for="{{item.songs}}" wx:key="*this" class="setlist-song">{{index + 1}}. {{item}}</text>
  </view>
</view>

<view class="card">
  <text class="section-title">场次列表</text>
  <view wx:for="{{showGroups}}" wx:key="country" class="country-group">
    <view class="country-head" data-country="{{item.country}}" bindtap="toggleCountry">
      <text class="country-name">{{item.country}}</text>
      <text class="country-action">{{item.expanded ? '收起' : '展开'}}</text>
    </view>
    <view wx:if="{{item.expanded}}" class="country-body">
      <view wx:for="{{item.cities}}" wx:key="city" class="city-group">
        <text class="city-name">{{item.city}}</text>
        <view
          wx:for="{{item.shows}}"
          wx:key="id"
          class="show-item {{item.clickable ? '' : 'show-item-disabled'}}"
          data-id="{{item.id}}"
          data-clickable="{{item.clickable}}"
          bindtap="openShow"
        >
          <view class="show-row">
            <text class="show-date">{{item.date}}</text>
            <text class="show-status">{{item.statusText}}</text>
          </view>
          <text class="show-meta">{{item.venue}}</text>
          <text wx:if="{{item.surpriseGuestSummary}}" class="show-guest">嘉宾：{{item.surpriseGuestSummary}}</text>
        </view>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 4: Update styles for nested groups and disabled rows**

Extend `pages/tour/detail/index.wxss` with styles like:

```css
.hero-range,
.show-guest,
.country-action {
  display: block;
  margin-top: 10rpx;
  color: #666666;
  font-size: 24rpx;
}

.setlist-block {
  padding-top: 20rpx;
}

.setlist-label,
.country-name,
.city-name,
.show-date {
  display: block;
  color: #111111;
  font-size: 26rpx;
  font-weight: 600;
}

.country-head,
.show-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.country-group {
  padding-top: 20rpx;
}

.city-group {
  padding-top: 18rpx;
}

.show-item-disabled {
  opacity: 0.45;
}
```

Delete the `.primary-btn` rule if it becomes unused after removing the guide button.

- [ ] **Step 5: Run focused verification for the updated tour detail page**

Run: `npm run typecheck`

Expected: FAIL only in `pages/show/detail/index.ts` and `pages/show/detail/index.wxml`; the tour detail page should now compile cleanly.

- [ ] **Step 6: Verification checkpoint**

Run: `npm run test:tour`

Expected: PASS; no selector regressions while the tour page moves to the new grouped data.

### Task 4: Rebuild The Show Detail Page

**Files:**
- Modify: `pages/show/detail/index.ts:1-93`
- Modify: `pages/show/detail/index.wxml:1-72`
- Modify: `pages/show/detail/index.wxss:1-101`

- [ ] **Step 1: Typecheck to confirm the show detail page is the last outdated consumer**

Run: `npm run typecheck`

Expected: FAIL in `pages/show/detail/index.ts` because it still references `getShowDetailSections`, `guide.ticketInfo`, `guide.tips`, and `guide.surpriseSongs`.

- [ ] **Step 2: Simplify the page controller to a structured summary model**

Replace the fold-state logic in `pages/show/detail/index.ts` with a summary-focused controller:

```ts
import { Show, ShowGuide, Video } from '../../../types/tour';
import { ROUTES } from '../../../utils/constants';
import {
  getShowById,
  getShowGuideByShowId,
  getShowStatusText,
  getTourById,
  getVideosByShowId
} from '../../../utils/selectors';

interface ShowDetailData {
  show: (Show & { statusText: string }) | null;
  guide: ShowGuide | null;
  videos: Video[];
  tourName: string;
  hasError: boolean;
}

Page({
  data: {
    show: null,
    guide: null,
    videos: [],
    tourName: '',
    hasError: false
  } as ShowDetailData,

  onLoad(options: { id?: string }) {
    const showId = options.id ?? '';
    const show = getShowById(showId);

    if (!show) {
      this.setData({ hasError: true });
      return;
    }

    this.setData({
      show: { ...show, statusText: getShowStatusText(show.status) },
      guide: getShowGuideByShowId(showId) ?? null,
      videos: getVideosByShowId(showId),
      tourName: getTourById(show.tourId)?.name ?? '',
      hasError: false
    });
  },

  goSong(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.song}?id=${event.currentTarget.dataset.id}` });
  },

  openUpload() {
    if (!this.data.show) {
      return;
    }

    wx.navigateTo({ url: `${ROUTES.videoUpload}?showId=${this.data.show.id}` });
  }
});
```

- [ ] **Step 3: Rewrite the WXML around structured ticket, venue, guest, and song sections**

Replace the removed fold sections with key-value sections like:

```xml
<view class="card">
  <text class="show-title">{{show.venue}}</text>
  <text class="show-meta">{{show.date}} · {{show.city}} · {{show.country}}</text>
  <text class="status-tag">{{show.statusText}}</text>
  <text class="tour-name">{{tourName}}</text>
  <text wx:if="{{show.surpriseGuests && show.surpriseGuests.length}}" class="guest-copy">
    惊喜嘉宾：{{show.surpriseGuests[0].name}}
  </text>
</view>

<view class="card" wx:if="{{guide && (guide.ticketPlatform || guide.saleTime || guide.ticketTiers.length)}}">
  <text class="section-title">抢票信息</text>
  <view wx:if="{{guide.ticketPlatform}}" class="info-row">
    <text class="info-label">平台</text>
    <text class="info-value">{{guide.ticketPlatform}}</text>
  </view>
  <view wx:if="{{guide.saleTime}}" class="info-row">
    <text class="info-label">开售时间</text>
    <text class="info-value">{{guide.saleTime}}</text>
  </view>
  <view wx:for="{{guide.ticketTiers}}" wx:key="name" class="info-row">
    <text class="info-label">{{item.name}}</text>
    <text class="info-value">{{item.price}}</text>
  </view>
</view>

<view class="card" wx:if="{{guide}}">
  <text class="section-title">场馆信息</text>
  <view class="info-row">
    <text class="info-label">地址</text>
    <text class="info-value">{{guide.address}}</text>
  </view>
  <view wx:if="{{guide.entryTime}}" class="info-row">
    <text class="info-label">入场时间</text>
    <text class="info-value">{{guide.entryTime}}</text>
  </view>
  <image wx:if="{{guide.seatMapImage}}" class="seat-map" src="{{guide.seatMapImage}}" mode="aspectFill"></image>
  <text wx:for="{{guide.notes}}" wx:key="*this" class="bullet-line">- {{item}}</text>
</view>

<view class="card" wx:if="{{show.surpriseSongs && show.surpriseSongs.length}}">
  <text class="section-title">Surprise Songs</text>
  <view wx:for="{{show.surpriseSongs}}" wx:key="songId" class="song-link" data-id="{{item.songId}}" bindtap="goSong">
    <text class="song-link-text">{{item.name}}</text>
  </view>
</view>
```

Keep the existing video list and fixed upload footer.

- [ ] **Step 4: Replace fold styles with section and key-value styles**

Update `pages/show/detail/index.wxss` to remove `.fold-head` and add:

```css
.guest-copy,
.tour-name,
.show-meta,
.video-song,
.video-meta {
  display: block;
  margin-top: 10rpx;
  color: #666666;
  font-size: 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  padding-top: 16rpx;
}

.info-label {
  width: 180rpx;
  color: #666666;
  font-size: 24rpx;
}

.info-value {
  flex: 1;
  color: #111111;
  font-size: 24rpx;
  text-align: right;
}

.seat-map {
  width: 100%;
  height: 220rpx;
  margin-top: 18rpx;
  border-radius: 16rpx;
  background: #f1f1f1;
}
```

Retain the existing `.upload-footer` styles and video card styles.

- [ ] **Step 5: Run the full verification suite**

Run: `npm run test:tour`

Expected: PASS

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 6: Verification checkpoint**

Run: `npm run test:tour && npm run typecheck`

Expected: both commands pass cleanly with no remaining references to `openGuide`, `getShowDetailSections`, `guide.tips`, or `guide.venueGuide`.

### Task 5: Final Review Pass

**Files:**
- Review: `types/tour.ts`
- Review: `data/tours.ts`
- Review: `data/shows.ts`
- Review: `data/showGuides.ts`
- Review: `utils/selectors.ts`
- Review: `pages/tour/detail/index.ts`
- Review: `pages/tour/detail/index.wxml`
- Review: `pages/show/detail/index.ts`
- Review: `pages/show/detail/index.wxml`

- [ ] **Step 1: Review the generated UI against the approved scope**

Check that the code reflects all of these requirements:

```text
- tour detail shows range label
- tour detail keeps progress bar but removes guide button
- official setlists support one or many versions
- show list is country > city > show
- cancelled shows are visible but non-clickable
- show detail removes ticket tips and venue-guide prose
- surprise guests and surprise songs come from Show
```

- [ ] **Step 2: Run the final verification commands**

Run: `npm run test:tour`

Expected: PASS

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Capture known non-goals before handoff**

Record these non-goals in the final implementation summary so they are not mistaken for regressions:

```text
- no redesign of the guide page itself
- no setlistVersionLabel field
- no tour statistics summary
- no song-detail links from tour-level setlists
```
