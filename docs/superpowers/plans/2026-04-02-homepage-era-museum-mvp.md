# Homepage Era Museum MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current home tab with a lightweight “dynamic hero + Era horizontal cards + news summary” experience that removes today-recommend plumbing and prepares the page for a future aggregated `/home` API.

**Architecture:** Keep the home-tab page controller thin by introducing a dedicated home-domain data contract and selector layer. Store mock spotlight and Era-card metadata in `data/home.ts`, shape it through `utils/homeSelectors.ts`, and let `pages/home/index.*` focus on rendering and tap handling only. Defer the full Era exhibition page to a later plan; in this MVP, Era cards can route into the existing album detail page as the first exhibition landing point.

**Tech Stack:** WeChat Mini Program native pages, TypeScript, WXML, WXSS, local mock data in `data/`, selector helpers in `utils/`, Node `tsx --test`, `tsc --noEmit`

> **Execution note:** Skip all git add/commit/branch steps while executing this plan because `/Users/bytedance/projects/swiftie-mini` is not currently a git repository.

---

## Scope Check

This plan only covers the homepage MVP from the approved spec:

- top `spotlight` hero
- horizontal `eras` card rail
- trimmed `news` summary
- removal of `todayRecommendId` and today-recommend UI
- docs updates for the new homepage contract

It intentionally does **not** implement a dedicated Era exhibition page. The first clickable destination for an Era card remains the existing album detail route so this plan can ship a coherent, testable MVP on its own.

## File Structure

### Create

- `types/home.ts` — shared home-domain interfaces for `spotlight`, `eras`, and action targets
- `data/home.ts` — local mock spotlight record plus ordered Era-card records
- `utils/homeSelectors.ts` — pure selectors that aggregate home data into a page-ready shape
- `tests/home-module.test.ts` — automated coverage for the home-domain selector contract

### Modify

- `package.json` — add a dedicated `test:home` script
- `app.ts` — remove obsolete `todayRecommendId` global state
- `pages/home/index.ts` — replace today-recommend loading with `getHomeFeed()` consumption and generic tap handling
- `pages/home/index.wxml` — swap the current recommendation/news/buttons layout for hero, horizontal Era rail, and trimmed news summary
- `pages/home/index.wxss` — add hero and horizontal-card styling; remove recommendation-specific rules
- `docs/context.md` — update the homepage feature summary
- `docs/architecture.md` — document the new home selector entry point and the simplified `app.ts` responsibility
- `docs/data.md` — add the new home-domain mock/types/selector files
- `docs/api.md` — record the future aggregated homepage contract (`spotlight + eras + news`)

### Leave Untouched in This Plan

- `pages/album/index.*` — reused as the first Era-card destination, but not redesigned here
- `data/albums.ts` — keep album data as-is for this MVP
- `types/news.ts` and `data/news.ts` — continue using the existing news contract

---

### Task 1: Add the Home-Domain Contract and Selector Tests

**Files:**
- Create: `types/home.ts`
- Create: `data/home.ts`
- Create: `utils/homeSelectors.ts`
- Create: `tests/home-module.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing home selector tests**

Create `tests/home-module.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { homeSpotlights } from '../data/home';
import {
  getHomeEras,
  getHomeFeed,
  getHomeSpotlight
} from '../utils/homeSelectors';
import { ROUTES } from '../utils/constants';

test('home feed exposes the active spotlight and trims news to three items', () => {
  const feed = getHomeFeed();

  assert.equal(feed.spotlight?.id, 'spotlight_eras_tour');
  assert.equal(feed.eras.length, 7);
  assert.equal(feed.news.length, 3);
  assert.equal(feed.news[0]?.id, 'news_1');
});

test('home spotlight returns null when no configured item is active', () => {
  const previousFlags = homeSpotlights.map((item) => item.isActive);

  homeSpotlights.forEach((item) => {
    item.isActive = false;
  });

  try {
    assert.equal(getHomeSpotlight(), null);
  } finally {
    homeSpotlights.forEach((item, index) => {
      item.isActive = previousFlags[index] ?? false;
    });
  }
});

test('home eras stay in museum order and point to album detail routes', () => {
  const eras = getHomeEras();

  assert.deepEqual(
    eras.map((item) => item.id),
    [
      'era_taylor_swift',
      'era_fearless',
      'era_speak_now',
      'era_red',
      'era_1989',
      'era_folklore',
      'era_midnights'
    ]
  );
  assert.equal(eras[0]?.action.type, 'navigateTo');
  assert.equal(eras[0]?.action.route, ROUTES.album);
  assert.equal(eras[0]?.action.id, 'album_taylor_swift');
});
```

- [ ] **Step 2: Run the tests to confirm the home layer is missing**

Run:

```bash
npx tsx --test tests/home-module.test.ts
```

Expected:

```text
FAIL tests/home-module.test.ts
Cannot find module '../data/home' or '../utils/homeSelectors'
```

- [ ] **Step 3: Add the home-domain types, mock data, selectors, and test script**

Create `types/home.ts`:

```ts
import { NewsItem } from './news';

export interface HomeAction {
  type: 'switchTab' | 'navigateTo';
  route: string;
  id?: string;
}

export type HomeSpotlightKind = 'album_release' | 'tour_event';

export interface HomeSpotlight {
  id: string;
  kind: HomeSpotlightKind;
  eyebrow: string;
  title: string;
  summary: string;
  ctaText: string;
  action: HomeAction;
  isActive: boolean;
}

export interface HomeEraCard {
  id: string;
  albumId: string;
  name: string;
  cover: string;
  themeColor: string;
  tagline: string;
  action: HomeAction;
}

export interface HomeFeed {
  spotlight: HomeSpotlight | null;
  eras: HomeEraCard[];
  news: NewsItem[];
}
```

Create `data/home.ts`:

```ts
import { ROUTES } from '../utils/constants';
import { HomeEraCard, HomeSpotlight } from '../types/home';

export const homeSpotlights: HomeSpotlight[] = [
  {
    id: 'spotlight_eras_tour',
    kind: 'tour_event',
    eyebrow: 'ON TOUR',
    title: 'The Eras Tour 正在进行',
    summary: '查看进行中巡演、场次状态与抢票助手入口。',
    ctaText: '查看巡演',
    action: {
      type: 'switchTab',
      route: ROUTES.tour
    },
    isActive: true
  }
];

export const homeEraCards: HomeEraCard[] = [
  {
    id: 'era_taylor_swift',
    albumId: 'album_taylor_swift',
    name: 'Taylor Swift',
    cover: '/assets/images/ui/avatar-placeholder.png',
    themeColor: '#d6c48f',
    tagline: '青涩、乡村、像第一封写给世界的自我介绍。',
    action: {
      type: 'navigateTo',
      route: ROUTES.album,
      id: 'album_taylor_swift'
    }
  },
  {
    id: 'era_fearless',
    albumId: 'album_fearless',
    name: 'Fearless',
    cover: '/assets/images/albums/album-fearless.png',
    themeColor: '#d4b15d',
    tagline: '金色光晕里的心动、成长与少女叙事。',
    action: {
      type: 'navigateTo',
      route: ROUTES.album,
      id: 'album_fearless'
    }
  },
  {
    id: 'era_speak_now',
    albumId: 'album_speak_now',
    name: 'Speak Now',
    cover: '/assets/images/ui/avatar-placeholder.png',
    themeColor: '#8d69c9',
    tagline: '紫色舞台、童话感与把心事说出口的勇气。',
    action: {
      type: 'navigateTo',
      route: ROUTES.album,
      id: 'album_speak_now'
    }
  },
  {
    id: 'era_red',
    albumId: 'album_red',
    name: 'Red',
    cover: '/assets/images/albums/album-red.png',
    themeColor: '#b44545',
    tagline: '炽热、失控、把爱与痛都写成高饱和记忆。',
    action: {
      type: 'navigateTo',
      route: ROUTES.album,
      id: 'album_red'
    }
  },
  {
    id: 'era_1989',
    albumId: 'album_1989',
    name: '1989',
    cover: '/assets/images/ui/avatar-placeholder.png',
    themeColor: '#7ab5d6',
    tagline: '城市霓虹、流行锋芒与彻底转身的自信。',
    action: {
      type: 'navigateTo',
      route: ROUTES.album,
      id: 'album_1989'
    }
  },
  {
    id: 'era_folklore',
    albumId: 'album_folklore',
    name: 'folklore',
    cover: '/assets/images/ui/avatar-placeholder.png',
    themeColor: '#7b7b7b',
    tagline: '树林、耳语和把故事写成传说的静谧时刻。',
    action: {
      type: 'navigateTo',
      route: ROUTES.album,
      id: 'album_folklore'
    }
  },
  {
    id: 'era_midnights',
    albumId: 'album_midnights',
    name: 'Midnights',
    cover: '/assets/images/albums/album-midnights.png',
    themeColor: '#324765',
    tagline: '午夜独白、蓝调霓虹和清醒到发亮的思绪。',
    action: {
      type: 'navigateTo',
      route: ROUTES.album,
      id: 'album_midnights'
    }
  }
];
```

Create `utils/homeSelectors.ts`:

```ts
import { homeEraCards, homeSpotlights } from '../data/home';
import { newsItems } from '../data/news';
import { HomeEraCard, HomeFeed, HomeSpotlight } from '../types/home';
import { NewsItem } from '../types/news';

const HOME_NEWS_LIMIT = 3;

export function getHomeSpotlight(): HomeSpotlight | null {
  return homeSpotlights.find((item) => item.isActive) ?? null;
}

export function getHomeEras(): HomeEraCard[] {
  return homeEraCards;
}

export function getHomeNews(limit = HOME_NEWS_LIMIT): NewsItem[] {
  return [...newsItems]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function getHomeFeed(): HomeFeed {
  return {
    spotlight: getHomeSpotlight(),
    eras: getHomeEras(),
    news: getHomeNews()
  };
}
```

Modify `package.json`:

```json
{
  "name": "swiftie-mini",
  "private": true,
  "scripts": {
    "test:home": "tsx --test tests/home-module.test.ts",
    "test:tour": "tsx --test tests/tour-module.test.ts",
    "test:library": "tsx --test tests/library-module.test.ts",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^24.5.2",
    "tsx": "^4.19.3",
    "typescript": "^5.8.3"
  }
}
```

- [ ] **Step 4: Run the home tests and type-check with the new contract in place**

Run:

```bash
npm run test:home
```

Expected:

```text
PASS tests/home-module.test.ts
```

Run:

```bash
npm run typecheck
```

Expected:

```text
Found 0 errors
```

---

### Task 2: Rebuild the Home Tab Around the New Contract

**Files:**
- Modify: `app.ts`
- Modify: `pages/home/index.ts`
- Modify: `pages/home/index.wxml`
- Modify: `pages/home/index.wxss`

- [ ] **Step 1: Use the selector contract as the UI guardrail before editing the page**

Run:

```bash
npm run test:home
```

Expected:

```text
PASS tests/home-module.test.ts
```

This confirms the page can rely on `spotlight`, `eras`, and `news` without re-assembling data locally.

- [ ] **Step 2: Remove today-recommend global state and switch the page script to `getHomeFeed()`**

Update `app.ts`:

```ts
interface UserProfile {
  avatarUrl: string;
  nickName: string;
}

interface IAppOption {
  globalData: {
    userProfile: UserProfile;
  };
}

App<IAppOption>({
  globalData: {
    userProfile: {
      avatarUrl: '/assets/images/ui/avatar-placeholder.png',
      nickName: 'Swiftie'
    }
  }
});
```

Update `pages/home/index.ts`:

```ts
import { HomeEraCard, HomeSpotlight } from '../../types/home';
import { NewsItem } from '../../types/news';
import { getHomeFeed } from '../../utils/homeSelectors';

interface HomeData {
  spotlight: HomeSpotlight | null;
  eras: HomeEraCard[];
  news: NewsItem[];
}

interface HomeActionDataset {
  type: 'switchTab' | 'navigateTo';
  route: string;
  id?: string;
}

Page({
  data: {
    spotlight: null,
    eras: [],
    news: []
  } as HomeData,

  onShow() {
    this.setData(getHomeFeed());
  },

  goAction(event: { currentTarget: { dataset: HomeActionDataset } }) {
    const { type, route, id } = event.currentTarget.dataset;

    if (type === 'switchTab') {
      wx.switchTab({ url: route });
      return;
    }

    const url = id ? `${route}?id=${id}` : route;
    wx.navigateTo({ url });
  }
});
```

- [ ] **Step 3: Replace the current WXML/WXSS with hero, Era rail, and trimmed news**

Update `pages/home/index.wxml`:

```xml
<view class="container">
  <view
    wx:if="{{spotlight}}"
    class="hero-card"
    bindtap="goAction"
    data-type="{{spotlight.action.type}}"
    data-route="{{spotlight.action.route}}"
    data-id="{{spotlight.action.id}}"
  >
    <text class="hero-eyebrow">{{spotlight.eyebrow}}</text>
    <text class="hero-title">{{spotlight.title}}</text>
    <text class="hero-summary">{{spotlight.summary}}</text>
    <text class="hero-cta">{{spotlight.ctaText}}</text>
  </view>

  <view class="section-head">
    <text class="section-title">Era 博物馆</text>
    <text class="section-subtitle">左右滑动，选择你想进入的时代展厅。</text>
  </view>

  <scroll-view class="era-scroll" scroll-x enable-flex show-scrollbar="{{false}}">
    <view class="era-row">
      <view
        wx:for="{{eras}}"
        wx:key="id"
        class="era-card"
        bindtap="goAction"
        data-type="{{item.action.type}}"
        data-route="{{item.action.route}}"
        data-id="{{item.action.id}}"
      >
        <view class="era-accent" style="background: {{item.themeColor}};"></view>
        <image class="era-cover" src="{{item.cover}}" mode="aspectFill"></image>
        <text class="era-name">{{item.name}}</text>
        <text class="era-tagline">{{item.tagline}}</text>
      </view>
    </view>
  </scroll-view>

  <info-card title="最近动态" subtitle="保持一点更新感">
    <view wx:for="{{news}}" wx:key="id" class="news-item">
      <view class="news-top">
        <text class="news-title">{{item.title}}</text>
        <text class="news-tag">{{item.tag}}</text>
      </view>
      <text class="news-summary">{{item.summary}}</text>
      <text class="news-date">{{item.date}}</text>
    </view>
  </info-card>
</view>
```

Update `pages/home/index.wxss`:

```css
.hero-card {
  background: linear-gradient(135deg, #1f2d44, #415f8c);
  color: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.hero-eyebrow {
  display: block;
  font-size: 20rpx;
  letter-spacing: 2rpx;
  opacity: 0.82;
}

.hero-title {
  display: block;
  margin-top: 12rpx;
  font-size: 40rpx;
  font-weight: 700;
}

.hero-summary {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  opacity: 0.92;
}

.hero-cta {
  display: inline-block;
  margin-top: 18rpx;
  padding-bottom: 4rpx;
  font-size: 24rpx;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.72);
}

.section-head {
  margin-bottom: 16rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #111111;
}

.section-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #666666;
}

.era-scroll {
  margin: 0 -32rpx 24rpx;
  padding-left: 32rpx;
  white-space: nowrap;
}

.era-row {
  display: flex;
  padding-right: 32rpx;
}

.era-card {
  width: 280rpx;
  background: #ffffff;
  border-radius: 20rpx;
  margin-right: 18rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(17, 17, 17, 0.06);
}

.era-accent {
  height: 10rpx;
}

.era-cover {
  width: 100%;
  height: 220rpx;
  background: #f0f0f0;
}

.era-name {
  display: block;
  padding: 18rpx 18rpx 0;
  font-size: 28rpx;
  font-weight: 600;
  color: #111111;
}

.era-tagline {
  display: block;
  min-height: 108rpx;
  padding: 10rpx 18rpx 20rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #666666;
}

.news-item {
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.news-item:last-child {
  border-bottom: 0;
}

.news-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.news-title {
  font-size: 28rpx;
  font-weight: 500;
}

.news-tag {
  font-size: 20rpx;
  color: #666666;
}

.news-summary {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #666666;
}

.news-date {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9a9a9a;
}
```

- [ ] **Step 4: Run automated verification and manual QA for the rebuilt homepage**

Run:

```bash
npm run test:home
npm run test:library
npm run test:tour
npm run typecheck
```

Expected:

```text
All tests pass and TypeScript reports no errors.
```

Manual QA in WeChat DevTools:

- launch the app to `pages/home/index`
- confirm the old `今日推荐` block is gone
- confirm the hero appears once at the top
- confirm the Era rail scrolls horizontally and each card opens the expected album detail page
- confirm the news section still renders three rows and no longer competes with the top hero

---

### Task 3: Sync Project Docs to the New Homepage Contract

**Files:**
- Modify: `docs/context.md`
- Modify: `docs/architecture.md`
- Modify: `docs/data.md`
- Modify: `docs/api.md`

- [ ] **Step 1: Update the product/context docs so homepage scope matches the shipped MVP**

Update the homepage bullet list in `docs/context.md`:

```md
### 首页

- 条件展示的首页事件 Hero
- Era 博物馆横滑卡片
- 最近动态摘要
```

Update the homepage section in `docs/architecture.md`:

```md
## 应用入口

- [app.ts](/Users/bytedance/projects/swiftie-mini/app.ts)：挂载全局 `userProfile`

## 目录职责

- `utils/homeSelectors.ts`：首页模块专用聚合与视图派生

## 关键实现入口

### 首页与资料馆

- [pages/home/index.ts](/Users/bytedance/projects/swiftie-mini/pages/home/index.ts)：首页 Hero、Era 卡片与动态摘要聚合
```

- [ ] **Step 2: Document the new mock/types layer and future API contract**

Update `docs/data.md`:

```md
### 首页数据

- [data/home.ts](/Users/bytedance/projects/swiftie-mini/data/home.ts)

## 类型模型

- [types/home.ts](/Users/bytedance/projects/swiftie-mini/types/home.ts)：首页 Hero、Era 卡片与跳转动作类型

## Selector 与视图派生

- [utils/homeSelectors.ts](/Users/bytedance/projects/swiftie-mini/utils/homeSelectors.ts)：首页聚合与派生
```

Update `docs/api.md`:

```md
## 页面数据接口约定

- 首页建议统一收敛为聚合结构：`spotlight + eras + news`

## 未来变更要求

- 若引入首页真实 API，建议新增聚合接口：
  - `GET /home`
  - 返回字段：`spotlight`、`eras`、`news`
  - `spotlight` 允许为空，以支持“无重大事件时隐藏 Hero”的首页状态
```

- [ ] **Step 3: Re-run verification after docs updates so the code/docs change set is stable**

Run:

```bash
npm run test:home
npm run test:library
npm run test:tour
npm run typecheck
```

Expected:

```text
All tests stay green after the docs-aligned implementation.
```

---

## Self-Review

### Spec Coverage

- `动态头部 Hero` — implemented in Task 1 (`spotlight` contract) and Task 2 (top hero UI)
- `Era 横滑卡片` — implemented in Task 1 (`homeEraCards`) and Task 2 (horizontal card rail)
- `新闻摘要` — implemented in Task 1 (`getHomeNews()`) and Task 2 (trimmed news section)
- `移除今日推荐` — implemented in Task 2 (`app.ts` cleanup and page layout rewrite)
- `未来 API 聚合结构` — documented in Task 3 (`docs/api.md`)

### Placeholder Scan

- No `TODO` / `TBD`
- Every code-changing step includes concrete file paths and code
- Verification commands are explicit

### Type Consistency

- `HomeAction` is the shared action contract used by both `HomeSpotlight` and `HomeEraCard`
- `HomeFeed` returns `spotlight`, `eras`, and `news`, matching the approved spec wording
- The page layer consumes `getHomeFeed()` directly and does not rebuild data ad hoc
