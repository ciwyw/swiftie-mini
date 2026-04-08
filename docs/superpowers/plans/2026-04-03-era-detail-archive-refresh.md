# Era Detail Archive Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Era detail page into an archive-first experience with a swipeable looks gallery, concrete honors/achievements, curated revisit videos, and a simplified milestone timeline.

**Architecture:** Stabilize the new archive-first contract in the era and library domain types first, then seed local mock data and rebuild `utils/eraSelectors.ts` so the page controller only consumes prepared view-model fields. Once the data shape is locked, refresh the Era page markup and state to support Chinese section titles and an honors half-sheet without introducing new routes or backend dependencies.

**Tech Stack:** WeChat Mini Program native pages, TypeScript, WXML, WXSS, `tsx --test`, `tsc --noEmit`

---

**Git note:** `/Users/bytedance/projects/swiftie-mini` is not currently a Git repository, so the normal “commit after each task” step is replaced with an explicit verification checkpoint.

## File Structure

- Modify: `tests/era-module.test.ts`
  Replace the old “展厅策展版” assertions with the new archive-first contract and add page-controller coverage for the honors half-sheet and revisit modal copy.
- Modify: `tests/library-module.test.ts`
  Add the new `Performance.kind` field to the in-test mock performance so the library suite keeps compiling.
- Modify: `types/era.ts`
  Remove unused exhibit fields, add `EraHonorItem`, add `revisit`, and expose selector-ready honor preview fields.
- Modify: `types/library.ts`
  Extend `Performance` with `kind: 'live' | 'interview' | 'special'`.
- Modify: `data/performances.ts`
  Add `kind` to every existing item and seed at least one `special` and one `interview` record for the Era archive page.
- Modify: `data/eraExhibits.ts`
  Drop `signatureVisuals`, `impact`, `listenWatch.albumId`, and `songIds`; add `eraHonors`, `revisit.performanceIds`, simplified `signatureLooks`, and milestone seeds with the required three core phases.
- Modify: `utils/eraSelectors.ts`
  Resolve the new data shape into `featuredHonors`, `remainingHonors`, and `performances` while preserving route actions and missing-reference filtering.
- Modify: `pages/era/detail/index.ts`
  Add honors sheet state and new tap handlers; remove the old performance-only modal copy path.
- Modify: `pages/era/detail/index.wxml`
  Replace the old six-block exhibition layout with Hero / 代表造型 / 时代荣誉 / 时代回看 / 关键节点 and add the honors half-sheet markup.
- Modify: `pages/era/detail/index.wxss`
  Restyle the page for the horizontal looks gallery, compact honor cards, revisit cards, and bottom sheet.
- Modify: `pages/era/detail/index.json`
  Update the page title to match the archive-first Chinese naming.

### Task 1: Lock The Archive-First Contract With Failing Tests

**Files:**
- Modify: `tests/era-module.test.ts`
- Modify: `tests/library-module.test.ts`
- Modify: `types/era.ts`
- Modify: `types/library.ts`

- [ ] **Step 1: Rewrite the era contract tests so they describe the new page shape**

Replace the old selector assertions in `tests/era-module.test.ts` with this archive-first coverage:

```ts
test('getEraExhibitDetailById resolves the Midnights archive contract', () => {
  const detail = getEraExhibitDetailById('era_midnights');

  assert.ok(detail);
  assert.equal(detail?.album?.id, 'album_midnights');
  assert.deepEqual(detail?.signatureLooks[0], {
    id: 'look_midnights_glitter',
    title: '亮片与深夜秀场感造型',
    image: '/assets/images/albums/album-midnights.png'
  });
  assert.deepEqual(
    detail?.featuredHonors.map((item) => item.id),
    [
      'honor_midnights_pop_vocal_album',
      'honor_midnights_hot_100_top_ten',
      'honor_midnights_billboard_200'
    ]
  );
  assert.equal(detail?.remainingHonors.length, 1);
  assert.deepEqual(
    detail?.performances.map((item) => ({ id: item.id, kind: item.kind })),
    [{ id: 'performance_iheart_anti_hero', kind: 'live' }]
  );
  assert.equal(detail?.milestones[0]?.title, '官宣专辑');
  assert.equal(detail?.milestones[1]?.title, '单曲打单');
  assert.equal(detail?.milestones[2]?.title, '专辑发布');
});

test('getEraExhibitDetailById keeps the archive shape when references are missing', () => {
  const detail = getEraExhibitDetailById('era_taylor_swift');

  assert.ok(detail);
  assert.deepEqual(detail?.performances, []);
  assert.equal(detail?.featuredHonors.length, 3);
  assert.equal(detail?.remainingHonors.length, 0);
  assert.equal(detail?.signatureLooks[0]?.title, '卷发与原木吉他');
});

test('era exhibit seeds stay aligned with homepage ids and archive requirements', () => {
  assert.equal(eraExhibits.length, 7);
  assert.deepEqual(
    eraExhibits.map((item) => item.id),
    homeEraCards.map((item) => item.id)
  );

  eraExhibits.forEach((item) => {
    assert.ok(item.eraHonors.length >= 3);
    assert.equal(item.milestones[0]?.title, '官宣专辑');
    assert.equal(item.milestones[1]?.title, '单曲打单');
    assert.equal(item.milestones[2]?.title, '专辑发布');
  });
});
```

- [ ] **Step 2: Update the library test helper object for the new `Performance.kind` requirement**

Patch the in-test `tourPerformance` in `tests/library-module.test.ts` so the library suite compiles once `Performance.kind` becomes required:

```ts
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
```

- [ ] **Step 3: Run the era suite to verify the new contract fails**

Run: `npm run test:era`

Expected: FAIL with missing properties like `featuredHonors`, `remainingHonors`, and `Performance.kind`, plus assertions that still expect the removed `songs`, `signatureVisuals`, or `impact` contract.

- [ ] **Step 4: Replace the old exhibit and performance type definitions with the archive-first types**

Update `types/library.ts` and `types/era.ts` to this shape:

```ts
export interface Performance {
  id: string;
  title: string;
  songIds: string[];
  kind: 'live' | 'interview' | 'special';
  domain: 'library' | 'tour';
  eventName: string;
  year: number;
  cover: string;
  source: string;
  duration: string;
  summary: string;
}
```

```ts
import { Album } from './album';
import { Performance } from './library';

export interface EraRouteAction {
  route: string;
  query?: string;
}

export interface EraHero {
  yearLabel: string;
  intro: string;
  cover: string;
  themeColor: string;
}

export interface EraSignatureLook {
  id: string;
  image: string;
  title?: string;
}

export interface EraMilestone {
  id: string;
  dateLabel: string;
  title: string;
  summary: string;
  type: 'release' | 'performance' | 'award' | 'moment';
  action?: EraRouteAction;
}

export interface EraHonorItem {
  id: string;
  type: 'award' | 'achievement';
  year: number;
  organization: string;
  title: string;
  result: string;
  note?: string;
}

export interface EraRevisitRefs {
  performanceIds: string[];
}

export interface EraExhibit {
  id: string;
  albumId: string;
  eraName: string;
  hero: EraHero;
  signatureLooks: EraSignatureLook[];
  milestones: EraMilestone[];
  eraHonors: EraHonorItem[];
  revisit: EraRevisitRefs;
}

export interface EraExhibitDetail extends Omit<EraExhibit, 'revisit'> {
  album: (Album & { action: EraRouteAction }) | null;
  featuredHonors: EraHonorItem[];
  remainingHonors: EraHonorItem[];
  performances: Performance[];
}
```

- [ ] **Step 5: Run the era suite again to confirm the remaining failures are now data and selector gaps**

Run: `npm run test:era`

Expected: FAIL because `data/eraExhibits.ts` and `utils/eraSelectors.ts` still provide the old fields, but TypeScript should no longer fail on missing type definitions.

- [ ] **Step 6: Verification checkpoint**

Run: `npm run test:library`

Expected: FAIL only where production data has not yet added `kind`; the temporary test helper change should compile cleanly.

### Task 2: Seed Archive Data And Rebuild The Selector

**Files:**
- Modify: `data/performances.ts`
- Modify: `data/eraExhibits.ts`
- Modify: `utils/eraSelectors.ts`
- Modify: `tests/era-module.test.ts`
- Modify: `tests/library-module.test.ts`

- [ ] **Step 1: Seed `Performance.kind` and the revisit-only library records**

Update `data/performances.ts` so every library record includes `kind`, and add at least one `special` plus one `interview` item that the Era page can surface:

```ts
export const performances: Performance[] = [
  {
    id: 'performance_grammys_all_too_well',
    title: 'All Too Well (10 Minute Version)',
    songIds: ['song_all_too_well'],
    kind: 'live',
    domain: 'library',
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
    kind: 'live',
    domain: 'library',
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
    kind: 'live',
    domain: 'library',
    eventName: 'BBC Radio 1 Live Lounge',
    year: 2019,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'BBC',
    duration: '3:58',
    summary: 'A tighter live-band arrangement that fans often revisit as a standout non-tour cut.'
  },
  {
    id: 'performance_long_pond_session',
    title: 'folklore: the long pond studio sessions',
    songIds: ['song_mirrorball'],
    kind: 'special',
    domain: 'library',
    eventName: 'Disney+ Special',
    year: 2020,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'Disney+',
    duration: '1:46:00',
    summary: 'An intimate session film that became the defining revisit artifact for folklore.'
  },
  {
    id: 'performance_midnights_release_interview',
    title: 'Midnights Release Week Interview',
    songIds: ['song_anti_hero'],
    kind: 'interview',
    domain: 'library',
    eventName: 'iHeartRadio Interview',
    year: 2022,
    cover: '/assets/images/ui/avatar-placeholder.png',
    source: 'iHeartRadio',
    duration: '12:40',
    summary: 'A release-week conversation focused on the album’s sleepless-night concept.'
  }
];
```

- [ ] **Step 2: Reshape `data/eraExhibits.ts` to the new archive-first schema**

Apply the same structural transformation to all seven era objects:

- Remove `signatureVisuals`
- Remove `impact`
- Remove `listenWatch`
- Trim every `signatureLooks` item to `{ id, image, title? }`
- Add `eraHonors`
- Add `revisit: { performanceIds: [...] }`
- Ensure the first three milestones are `官宣专辑` / `单曲打单` / `专辑发布`

Use this `era_midnights` excerpt as the target shape:

```ts
{
  id: 'era_midnights',
  albumId: 'album_midnights',
  eraName: 'Midnights',
  hero: {
    yearLabel: '2022 Midnights Era',
    intro: '午夜蓝、清醒独白、镜像自省与既华丽又不安的深夜思绪。',
    cover: '/assets/images/albums/album-midnights.png',
    themeColor: '#324765'
  },
  signatureLooks: [
    {
      id: 'look_midnights_glitter',
      title: '亮片与深夜秀场感造型',
      image: '/assets/images/albums/album-midnights.png'
    },
    {
      id: 'look_midnights_retro',
      title: '复古午夜妆造',
      image: '/assets/images/ui/avatar-placeholder.png'
    }
  ],
  milestones: [
    {
      id: 'midnights_announce',
      dateLabel: '2022',
      title: '官宣专辑',
      summary: '从概念阶段就明确了“午夜思绪”这一核心设定。',
      type: 'release',
      action: albumAction('album_midnights')
    },
    {
      id: 'midnights_anti_hero',
      dateLabel: 'Lead Single',
      title: '单曲打单',
      summary: 'Anti-Hero 把这一 Era 最直接的自我剖白推到最前面。',
      type: 'release',
      action: songAction('song_anti_hero')
    },
    {
      id: 'midnights_album',
      dateLabel: 'Album Release',
      title: '专辑发布',
      summary: '华丽感与脆弱感并行，成为 Midnights 最有辨识度的组合。',
      type: 'release',
      action: albumAction('album_midnights')
    },
    {
      id: 'midnights_iheart',
      dateLabel: '2023 iHeart',
      title: '电视舞台延续时代视觉',
      summary: '这场演出把 Midnights 的配色和舞台氛围继续推到了电视语境。',
      type: 'performance'
    }
  ],
  eraHonors: [
    {
      id: 'honor_midnights_pop_vocal_album',
      type: 'award',
      year: 2024,
      organization: 'Grammy Awards',
      title: 'Best Pop Vocal Album',
      result: 'Won'
    },
    {
      id: 'honor_midnights_hot_100_top_ten',
      type: 'achievement',
      year: 2022,
      organization: 'Billboard Hot 100',
      title: '前十占十',
      result: '历史首位'
    },
    {
      id: 'honor_midnights_billboard_200',
      type: 'achievement',
      year: 2022,
      organization: 'Billboard 200',
      title: '首周空降冠军',
      result: 'No.1'
    },
    {
      id: 'honor_midnights_ifpi',
      type: 'achievement',
      year: 2023,
      organization: 'IFPI',
      title: 'Global Album Chart',
      result: 'Year-End No.1'
    }
  ],
  revisit: {
    performanceIds: ['performance_iheart_anti_hero', 'performance_midnights_release_interview']
  }
}
```

For `era_folklore`, use `performance_long_pond_session` in `revisit.performanceIds`; for `era_red`, keep `performance_grammys_all_too_well` and `performance_bbc_holy_ground`. Other eras can keep an empty revisit array until more mock videos exist.

- [ ] **Step 3: Rebuild `getEraExhibitDetailById` around honors preview and revisit filtering**

Replace `utils/eraSelectors.ts` with this selector shape:

```ts
import { eraExhibits } from '../data/eraExhibits';
import { performances } from '../data/performances';
import { EraExhibitDetail } from '../types/era';
import { ROUTES } from './constants';
import { getAlbumById } from './selectors';

export function getEraExhibitDetailById(id: string): EraExhibitDetail | undefined {
  const exhibit = eraExhibits.find((item) => item.id === id);
  if (!exhibit) {
    return undefined;
  }

  const album = getAlbumById(exhibit.albumId);
  const revisitPerformances = exhibit.revisit.performanceIds
    .map((performanceId) =>
      performances.find((item) => item.domain === 'library' && item.id === performanceId)
    )
    .filter((performance): performance is NonNullable<typeof performance> => Boolean(performance))
    .map((performance) => ({ ...performance, songIds: [...performance.songIds] }));

  return {
    ...exhibit,
    hero: { ...exhibit.hero },
    signatureLooks: exhibit.signatureLooks.map((item) => ({ ...item })),
    milestones: exhibit.milestones.map((item) => ({
      ...item,
      action: item.action ? { ...item.action } : undefined
    })),
    eraHonors: exhibit.eraHonors.map((item) => ({ ...item })),
    featuredHonors: exhibit.eraHonors.slice(0, 3).map((item) => ({ ...item })),
    remainingHonors: exhibit.eraHonors.slice(3).map((item) => ({ ...item })),
    album: album
      ? {
          ...album,
          action: {
            route: ROUTES.album,
            query: `id=${album.id}`
          }
        }
      : null,
    performances: revisitPerformances
  };
}
```

- [ ] **Step 4: Run the targeted test suites and make them pass**

Run:

```bash
npm run test:era
npm run test:library
```

Expected: PASS. The era suite should now prove the archive-first selector contract, and the library suite should pass with `Performance.kind` in both seeded data and the in-test mock object.

- [ ] **Step 5: Verification checkpoint**

Run: `npm run typecheck`

Expected: PASS. Any remaining errors at this point mean old page code still references removed fields like `signatureVisuals`, `songs`, or `impact`.

### Task 3: Refresh The Era Page Controller And Markup

**Files:**
- Modify: `tests/era-module.test.ts`
- Modify: `pages/era/detail/index.ts`
- Modify: `pages/era/detail/index.wxml`
- Modify: `pages/era/detail/index.json`

- [ ] **Step 1: Extend the page-controller test for honors sheet and revisit copy**

Update the page-controller portion of `tests/era-module.test.ts` so it expects the new state and handlers:

```ts
type EraDetailPageConfig = {
  data: {
    exhibit: ReturnType<typeof getEraExhibitDetailById> | null;
    hasError: boolean;
    isHonorSheetOpen: boolean;
  };
  setData: (patch: Partial<EraDetailPageConfig['data']>) => void;
  onLoad: (options: { id?: string }) => void;
  goRoute: (event: { currentTarget: { dataset: { route?: string; query?: string } } }) => void;
  openHonorSheet: () => void;
  closeHonorSheet: () => void;
  openRevisitItem: (event: {
    currentTarget: {
      dataset: {
        kindLabel: string;
        title: string;
        subtitle?: string;
        meta?: string;
        summary?: string;
      };
    };
  }) => void;
};

pageConfig.onLoad.call(pageConfig, { id: 'era_midnights' });
assert.equal(pageConfig.data.isHonorSheetOpen, false);
assert.equal(pageConfig.data.exhibit?.featuredHonors.length, 3);
assert.equal(pageConfig.data.exhibit?.remainingHonors.length, 1);

pageConfig.openHonorSheet.call(pageConfig);
assert.equal(pageConfig.data.isHonorSheetOpen, true);

pageConfig.closeHonorSheet.call(pageConfig);
assert.equal(pageConfig.data.isHonorSheetOpen, false);

pageConfig.openRevisitItem({
  currentTarget: {
    dataset: {
      kindLabel: '采访',
      title: 'Midnights Release Week Interview',
      subtitle: 'iHeartRadio Interview · 2022',
      meta: 'iHeartRadio · 12:40',
      summary: 'A release-week conversation focused on the album’s sleepless-night concept.'
    }
  }
});
```

Expect the modal assertion to change to:

```ts
assert.deepEqual(showModalCalls, [
  {
    title: '时代回看',
    content:
      '采访\nMidnights Release Week Interview\niHeartRadio Interview · 2022\niHeartRadio · 12:40\nA release-week conversation focused on the album’s sleepless-night concept.\n暂未接入完整内容页，这里先作为可点击入口。',
    showCancel: false,
    confirmText: '知道了'
  }
]);
```

- [ ] **Step 2: Run the era suite to confirm the page controller now fails on missing state and handlers**

Run: `npm run test:era`

Expected: FAIL with errors like `openHonorSheet is not a function`, `isHonorSheetOpen` missing from data, and old modal copy still using “演出信息”.

- [ ] **Step 3: Implement the new page state and interaction methods**

Update `pages/era/detail/index.ts` to this controller shape:

```ts
import { EraExhibitDetail } from '../../../types/era';
import { getEraExhibitDetailById } from '../../../utils/eraSelectors';

interface EraDetailData {
  exhibit: EraExhibitDetail | null;
  hasError: boolean;
  isHonorSheetOpen: boolean;
}

interface RouteDataset {
  route?: string;
  query?: string;
}

interface RevisitDataset {
  kindLabel: string;
  title: string;
  subtitle?: string;
  meta?: string;
  summary?: string;
}

function showInfoModal(title: string, lines: Array<string | undefined>) {
  const modal = wx as typeof wx & {
    showModal(options: { title: string; content: string; showCancel: boolean; confirmText: string }): void;
  };

  modal.showModal({
    title,
    content: lines.filter((line): line is string => Boolean(line)).join('\n'),
    showCancel: false,
    confirmText: '知道了'
  });
}

Page({
  data: {
    exhibit: null,
    hasError: false,
    isHonorSheetOpen: false
  } as EraDetailData,

  onLoad(options: { id?: string }) {
    const exhibitId = options.id;
    if (!exhibitId) {
      this.setData({ exhibit: null, hasError: true, isHonorSheetOpen: false });
      return;
    }

    const exhibit = getEraExhibitDetailById(exhibitId);
    if (!exhibit) {
      this.setData({ exhibit: null, hasError: true, isHonorSheetOpen: false });
      return;
    }

    this.setData({
      exhibit,
      hasError: false,
      isHonorSheetOpen: false
    });
  },

  goRoute(event: { currentTarget: { dataset: RouteDataset } }) {
    const { route, query } = event.currentTarget.dataset;
    if (!route) {
      return;
    }

    wx.navigateTo({ url: query ? `${route}?${query}` : route });
  },

  openHonorSheet() {
    this.setData({ isHonorSheetOpen: true });
  },

  closeHonorSheet() {
    this.setData({ isHonorSheetOpen: false });
  },

  stopSheetTap() {},

  openRevisitItem(event: { currentTarget: { dataset: RevisitDataset } }) {
    const { kindLabel, title, subtitle, meta, summary } = event.currentTarget.dataset;

    showInfoModal('时代回看', [
      kindLabel,
      title,
      subtitle,
      meta,
      summary,
      '暂未接入完整内容页，这里先作为可点击入口。'
    ]);
  }
});
```

- [ ] **Step 4: Replace the old WXML blocks with the archive-first layout**

Update `pages/era/detail/index.wxml` to this structure:

```xml
<view class="container">
  <empty-state
    wx:if="{{hasError}}"
    title="展厅不存在"
    desc="请返回首页重新选择想进入的 Era。"
  ></empty-state>

  <view wx:elif="{{exhibit}}" class="page-stack">
    <view class="card hero-card" style="background: linear-gradient(160deg, {{exhibit.hero.themeColor}}, #ffffff);">
      <text class="hero-eyebrow">{{exhibit.hero.yearLabel}}</text>
      <view class="hero-main">
        <image class="hero-cover" src="{{exhibit.hero.cover}}" mode="aspectFill"></image>
        <view class="hero-copy">
          <text class="hero-title">{{exhibit.eraName}}</text>
          <text class="hero-intro">{{exhibit.hero.intro}}</text>
          <view
            wx:if="{{exhibit.album}}"
            class="hero-link"
            data-route="{{exhibit.album.action.route}}"
            data-query="{{exhibit.album.action.query}}"
            bindtap="goRoute"
          >
            <text class="hero-link-label">进入专辑详情</text>
            <text class="hero-link-title">{{exhibit.album.name}}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card section-card">
      <text class="section-title">代表造型</text>
      <scroll-view class="looks-scroll" scroll-x enhanced show-scrollbar="false">
        <view class="looks-row">
          <view class="look-card" wx:for="{{exhibit.signatureLooks}}" wx:key="id">
            <image class="look-image" src="{{item.image}}" mode="aspectFill"></image>
            <text wx:if="{{item.title}}" class="look-title">{{item.title}}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="card section-card">
      <view class="section-head">
        <view>
          <text class="section-title">时代荣誉</text>
          <text class="section-subtitle">先看最重要的奖项和成就，再展开完整列表。</text>
        </view>
        <text
          wx:if="{{exhibit.remainingHonors.length}}"
          class="section-action"
          bindtap="openHonorSheet"
        >查看全部</text>
      </view>

      <view class="honor-list">
        <view class="honor-card" wx:for="{{exhibit.featuredHonors}}" wx:key="id">
          <text class="honor-tag">{{item.type === 'award' ? '奖项' : '成就'}}</text>
          <text class="honor-title">{{item.title}}</text>
          <text class="honor-meta">{{item.year}} · {{item.organization}}</text>
          <text class="honor-result">{{item.result}}</text>
          <text wx:if="{{item.note}}" class="honor-note">{{item.note}}</text>
        </view>
      </view>
    </view>

    <view class="card section-card" wx:if="{{exhibit.performances.length}}">
      <text class="section-title">时代回看</text>
      <text class="section-subtitle">只保留这个 Era 最值得重看的 live、采访和特别内容。</text>
      <view
        class="revisit-card tappable-card"
        wx:for="{{exhibit.performances}}"
        wx:key="id"
        data-kind-label="{{item.kind === 'live' ? 'Live' : item.kind === 'interview' ? '采访' : '特别节目'}}"
        data-title="{{item.title}}"
        data-subtitle="{{item.eventName}} · {{item.year}}"
        data-meta="{{item.source}} · {{item.duration}}"
        data-summary="{{item.summary}}"
        bindtap="openRevisitItem"
      >
        <text class="revisit-tag">{{item.kind === 'live' ? 'Live' : item.kind === 'interview' ? '采访' : '特别节目'}}</text>
        <text class="revisit-title">{{item.title}}</text>
        <text class="revisit-summary">{{item.summary}}</text>
        <text class="revisit-meta">{{item.eventName}} · {{item.year}}</text>
      </view>
    </view>

    <view class="card section-card">
      <text class="section-title">关键节点</text>
      <text class="section-subtitle">按时间回看这个 Era 是如何展开的。</text>
      <view class="timeline-list">
        <view class="timeline-item" wx:for="{{exhibit.milestones}}" wx:key="id">
          <view class="timeline-dot"></view>
          <view class="timeline-content">
            <text class="timeline-date">{{item.dateLabel}}</text>
            <text class="timeline-title">{{item.title}}</text>
            <text class="timeline-summary">{{item.summary}}</text>
            <view
              wx:if="{{item.action}}"
              class="timeline-action"
              data-route="{{item.action.route}}"
              data-query="{{item.action.query}}"
              bindtap="goRoute"
            >
              <text class="timeline-action-text">查看相关内容</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>

  <view wx:if="{{exhibit && isHonorSheetOpen}}" class="sheet-mask" bindtap="closeHonorSheet">
    <view class="sheet-panel" catchtap="stopSheetTap">
      <view class="sheet-handle"></view>
      <text class="sheet-title">时代荣誉</text>
      <view class="sheet-list">
        <view class="sheet-item" wx:for="{{exhibit.eraHonors}}" wx:key="id">
          <text class="honor-tag">{{item.type === 'award' ? '奖项' : '成就'}}</text>
          <text class="honor-title">{{item.title}}</text>
          <text class="honor-meta">{{item.year}} · {{item.organization}}</text>
          <text class="honor-result">{{item.result}}</text>
          <text wx:if="{{item.note}}" class="honor-note">{{item.note}}</text>
        </view>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 5: Update the page title to match the new product language**

Set `pages/era/detail/index.json` to:

```json
{
  "navigationBarTitleText": "Era 档案",
  "usingComponents": {
    "empty-state": "/components/empty-state/index"
  }
}
```

- [ ] **Step 6: Run the era suite again**

Run: `npm run test:era`

Expected: FAIL only on styling-independent issues, or PASS if the controller and markup changes are consistent with the new test contract.

- [ ] **Step 7: Verification checkpoint**

Run: `npm run typecheck`

Expected: PASS. If it fails here, the page still references removed properties from the old layout.

### Task 4: Restyle The Page And Finish Verification

**Files:**
- Modify: `pages/era/detail/index.wxss`
- Modify: `pages/era/detail/index.wxml`
- Modify: `pages/era/detail/index.ts`

- [ ] **Step 1: Replace the old section styles with archive-first WXSS**

Update `pages/era/detail/index.wxss` with these core styles:

```css
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.hero-card {
  overflow: hidden;
}

.hero-eyebrow,
.hero-link-label,
.hero-link-title,
.section-title,
.section-subtitle,
.section-action,
.look-title,
.honor-tag,
.honor-title,
.honor-meta,
.honor-result,
.honor-note,
.revisit-tag,
.revisit-title,
.revisit-summary,
.revisit-meta,
.timeline-date,
.timeline-title,
.timeline-summary,
.timeline-action-text,
.sheet-title {
  display: block;
}

.looks-scroll {
  margin-top: 20rpx;
  white-space: nowrap;
}

.looks-row {
  display: inline-flex;
  gap: 20rpx;
  padding-right: 32rpx;
}

.look-card {
  width: 280rpx;
  flex-shrink: 0;
}

.look-image {
  width: 280rpx;
  height: 360rpx;
  border-radius: 28rpx;
  background: #f3f4f6;
}

.look-title {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: #111111;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  align-items: flex-start;
}

.section-action {
  font-size: 24rpx;
  color: #324765;
}

.honor-list,
.timeline-list,
.sheet-list {
  margin-top: 20rpx;
}

.honor-card,
.revisit-card,
.sheet-item {
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f8fafc;
}

.honor-card + .honor-card,
.revisit-card + .revisit-card,
.sheet-item + .sheet-item,
.timeline-item + .timeline-item {
  margin-top: 20rpx;
}

.honor-tag,
.revisit-tag,
.timeline-date {
  font-size: 20rpx;
  color: #64748b;
}

.honor-title,
.revisit-title,
.timeline-title,
.sheet-title {
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #111111;
}

.honor-meta,
.honor-result,
.honor-note,
.revisit-summary,
.revisit-meta,
.timeline-summary,
.section-subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #667085;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 18rpx;
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  margin-top: 10rpx;
  border-radius: 999rpx;
  background: #324765;
  flex-shrink: 0;
}

.timeline-item::after {
  content: '';
  position: absolute;
  left: 7rpx;
  top: 28rpx;
  bottom: -22rpx;
  width: 2rpx;
  background: #d7dee7;
}

.timeline-item:last-child::after {
  display: none;
}

.sheet-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(15, 23, 42, 0.28);
}

.sheet-panel {
  width: 100%;
  max-height: 72vh;
  padding: 20rpx 24rpx 32rpx;
  border-radius: 32rpx 32rpx 0 0;
  background: #ffffff;
}

.sheet-handle {
  width: 88rpx;
  height: 8rpx;
  margin: 0 auto 16rpx;
  border-radius: 999rpx;
  background: #d7dee7;
}
```

Keep the existing responsive Hero rules at the bottom so the page still stacks cleanly on narrow screens.

- [ ] **Step 2: Run the era tests and typecheck together**

Run:

```bash
npm run test:era
npm run test:library
npm run typecheck
```

Expected: PASS across all three commands.

- [ ] **Step 3: Manual QA the archive-first experience in the Mini Program simulator**

Check these scenarios:

- Open `pages/era/detail/index?id=era_midnights` and confirm the order is `Hero -> 代表造型 -> 时代荣誉 -> 时代回看 -> 关键节点`
- Verify the Hero still links to the album detail page and no duplicate album card appears below
- Swipe `代表造型` horizontally and confirm each card only shows image plus optional title
- Tap `查看全部` in `时代荣誉` and confirm the half-sheet opens and closes from the backdrop
- Tap at least one `Live` and one `采访 / 特别节目` revisit item and confirm the modal copy uses `时代回看`
- Open `era_taylor_swift` and confirm missing revisit references still produce a stable page without crashes
- Open at least one other era with revisit content (`era_red` or `era_folklore`) and confirm the selector resolves the seeded items correctly

- [ ] **Step 4: Verification checkpoint**

Record the final command results and any manual QA notes in the task log before handing execution back to the user.
