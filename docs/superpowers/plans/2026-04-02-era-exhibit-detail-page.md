# Era Exhibit Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new single-page Era exhibit detail experience that carries homepage Era cards into a curated long-scroll page with hero, signatures, milestones, listen/watch reuse, and lightweight impact data.

**Architecture:** Add a dedicated Era-domain mock/selector layer rather than extending the current album detail page. Keep exhibit-only editorial content in a new `data/eraExhibits.ts` contract, resolve reusable album/song/performance content through a focused `utils/eraSelectors.ts`, and keep the new page controller thin so WXML/WXSS own presentation while selectors own data composition.

**Tech Stack:** WeChat Mini Program native pages, TypeScript, WXML, WXSS, local mock data in `data/`, selector helpers in `utils/`, Node `tsx --test`, `tsc --noEmit`

> **Execution note:** Skip all git add/commit/branch steps while executing this plan because `/Users/bytedance/projects/swiftie-mini` is not currently a git repository.

---

## Scope Check

This plan covers one shippable subsystem: the first independent Era exhibit page and its homepage routing update.

Included:

- new Era exhibit domain types, mock data, and selector contract
- new `pages/era/detail/index` page
- homepage Era cards rerouted from album detail to the new exhibit page
- docs updates for route/data/architecture changes

Explicitly out of scope:

- redesigning `pages/album/index.*`
- building a dedicated performance detail page
- adding new MV/documentary flows
- turning the exhibit page into a tabbed or multi-page museum system

## File Structure

### Create

- `types/era.ts` — exhibit-domain types for hero, signatures, milestones, impact, listen/watch refs, and resolved exhibit detail
- `data/eraExhibits.ts` — editorial mock data for the seven homepage eras
- `utils/eraSelectors.ts` — exhibit lookup and resolution layer that combines editorial data with album/song/performance records
- `tests/era-module.test.ts` — selector and page-controller tests for the new exhibit experience
- `pages/era/detail/index.json` — page config and component registration
- `pages/era/detail/index.ts` — page controller for exhibit load, route actions, and performance modal reuse
- `pages/era/detail/index.wxml` — exhibit page layout
- `pages/era/detail/index.wxss` — exhibit page styling

### Modify

- `package.json` — add a dedicated `test:era` script
- `app.json` — register the new exhibit page route
- `utils/constants.ts` — add `ROUTES.eraDetail`
- `data/home.ts` — point Era cards at the new exhibit page
- `tests/home-module.test.ts` — update homepage route expectations for Era cards
- `docs/context.md` — update homepage note and add the new exhibit-page capability
- `docs/architecture.md` — document the new page and selector entry points
- `docs/data.md` — document the new exhibit-domain mock/types/selectors
- `docs/api.md` — add the new page parameter contract and future exhibit API guidance

### Reuse Without Redesign

- `pages/album/index.*` — keep as the album/song entry point inside `Listen / Watch`
- `utils/homeSelectors.ts` — keep homepage data composition intact except for route expectations already covered by `data/home.ts`
- `data/songs.ts` and `data/performances.ts` — reuse existing songs/live records in `Listen / Watch` rather than duplicating them inside exhibit data

---

### Task 1: Add the Era Exhibit Contract, Mock Data, and Selector Tests

**Files:**
- Create: `types/era.ts`
- Create: `data/eraExhibits.ts`
- Create: `utils/eraSelectors.ts`
- Create: `tests/era-module.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing exhibit selector tests**

Create `tests/era-module.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES } from '../utils/constants';
import { getEraExhibitDetailById } from '../utils/eraSelectors';

test('era exhibit detail resolves album, songs, performances, and milestone actions', () => {
  const exhibit = getEraExhibitDetailById('era_midnights');

  assert.equal(exhibit?.eraName, 'Midnights');
  assert.equal(exhibit?.album?.id, 'album_midnights');
  assert.deepEqual(
    exhibit?.songs.map((song) => song.id),
    ['song_anti_hero', 'song_dear_reader']
  );
  assert.deepEqual(
    exhibit?.performances.map((performance) => performance.id),
    ['performance_iheart_anti_hero']
  );
  assert.equal(exhibit?.milestones[0]?.action?.route, ROUTES.song);
  assert.equal(exhibit?.milestones[0]?.action?.query, 'id=song_anti_hero');
  assert.equal(exhibit?.signatureLooks.length, 2);
  assert.equal(exhibit?.signatureVisuals[0]?.type, 'color');
});

test('era exhibit detail returns undefined for unknown ids', () => {
  assert.equal(getEraExhibitDetailById('era_unknown'), undefined);
});

test('era exhibit detail filters missing references instead of throwing', () => {
  const exhibit = getEraExhibitDetailById('era_taylor_swift');

  assert.ok(exhibit);
  assert.equal(exhibit?.album?.id, 'album_taylor_swift');
  assert.deepEqual(exhibit?.songs.map((song) => song.id), ['song_tim_mcgraw']);
  assert.deepEqual(exhibit?.performances, []);
});
```

- [ ] **Step 2: Run the test to capture the missing exhibit layer**

Run:

```bash
npx tsx --test tests/era-module.test.ts
```

Expected:

```text
FAIL tests/era-module.test.ts
Cannot find module '../utils/eraSelectors'
```

- [ ] **Step 3: Add the era-domain types, seed data, selectors, and script**

Create `types/era.ts`:

```ts
import { Album } from './album';
import { Performance } from './library';
import { Song } from './song';

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
  title: string;
  image: string;
  summary: string;
  tag?: string;
}

export interface EraSignatureVisual {
  id: string;
  label: string;
  type: 'color' | 'symbol';
  summary: string;
}

export interface EraMilestone {
  id: string;
  dateLabel: string;
  title: string;
  summary: string;
  type: 'release' | 'performance' | 'award' | 'moment';
  action?: EraRouteAction;
}

export interface EraImpactItem {
  id: string;
  label: string;
  value: string;
  summary: string;
}

export interface EraListenWatchRefs {
  albumId: string;
  songIds: string[];
  performanceIds: string[];
}

export interface EraExhibit {
  id: string;
  albumId: string;
  eraName: string;
  hero: EraHero;
  signatureLooks: EraSignatureLook[];
  signatureVisuals: EraSignatureVisual[];
  milestones: EraMilestone[];
  listenWatch: EraListenWatchRefs;
  impact: EraImpactItem[];
}

export interface EraExhibitDetail extends Omit<EraExhibit, 'listenWatch'> {
  album: (Album & { action: EraRouteAction }) | null;
  songs: Array<Song & { action: EraRouteAction }>;
  performances: Performance[];
}
```

Create `data/eraExhibits.ts` with helper actions plus all seven exhibits already shown on the homepage:

```ts
import { ROUTES } from '../utils/constants';
import { EraExhibit, EraRouteAction } from '../types/era';

function albumAction(albumId: string): EraRouteAction {
  return { route: ROUTES.album, query: `id=${albumId}` };
}

function songAction(songId: string): EraRouteAction {
  return { route: ROUTES.song, query: `id=${songId}` };
}

export const eraExhibits: EraExhibit[] = [
  {
    id: 'era_taylor_swift',
    albumId: 'album_taylor_swift',
    eraName: 'Taylor Swift',
    hero: {
      yearLabel: '2006 Debut Era',
      intro: '青涩、真诚、把卧室日记写成第一批被世界听见的歌。',
      cover: '/assets/images/ui/avatar-placeholder.png',
      themeColor: '#d6c48f'
    },
    signatureLooks: [
      {
        id: 'look_debut_curls',
        title: '卷发与原木吉他',
        image: '/assets/images/ui/avatar-placeholder.png',
        summary: '卷发、连衣裙和木吉他构成了早期最容易被记住的舞台形象。',
        tag: 'Debut'
      },
      {
        id: 'look_debut_awards',
        title: '青绿色典礼礼服',
        image: '/assets/images/ui/avatar-placeholder.png',
        summary: '早期颁奖礼造型延续了乡村少女感和清亮配色。',
        tag: 'Awards'
      }
    ],
    signatureVisuals: [
      { id: 'visual_teal', label: 'Teal', type: 'color', summary: '清亮蓝绿色调强化了初登场的青春感。' },
      { id: 'visual_guitar', label: 'Acoustic Guitar', type: 'symbol', summary: '木吉他是这一时期最稳定的自我表达符号。' }
    ],
    milestones: [
      { id: 'debut_announce', dateLabel: '2006', title: '首张同名专辑进入大众视野', summary: '从乡村新人到开始被主流音乐媒体注意。', type: 'release', action: albumAction('album_taylor_swift') },
      { id: 'debut_single', dateLabel: 'Lead Single', title: 'Tim McGraw 发布', summary: '最早建立个人叙事风格的代表作之一。', type: 'release', action: songAction('song_tim_mcgraw') },
      { id: 'debut_album', dateLabel: 'Album Release', title: '整专发行', summary: '以“写自己的故事”为核心建立早期歌手身份。', type: 'release', action: albumAction('album_taylor_swift') },
      { id: 'debut_breakout', dateLabel: 'Breakout', title: '青少年乡村受众快速积累', summary: '这一时期完成了最初的粉丝基盘搭建。', type: 'moment' }
    ],
    listenWatch: {
      albumId: 'album_taylor_swift',
      songIds: ['song_tim_mcgraw'],
      performanceIds: []
    },
    impact: [
      { id: 'impact_debut_songwriter', label: 'Identity', value: 'Teen Songwriter', summary: '最早被记住的标签是“会写自己故事的创作歌手”。' },
      { id: 'impact_debut_fans', label: 'Fanbase', value: 'Early Core', summary: '为之后每个 Era 的扩张打下了稳定受众基础。' }
    ]
  },
  {
    id: 'era_fearless',
    albumId: 'album_fearless',
    eraName: 'Fearless',
    hero: {
      yearLabel: '2008-2009 Fearless Era',
      intro: '金色、心动、童话感与把青春叙事推向主流的突破期。',
      cover: '/assets/images/albums/album-fearless.png',
      themeColor: '#d4b15d'
    },
    signatureLooks: [
      { id: 'look_fearless_gold_dress', title: '金色旋转礼服', image: '/assets/images/albums/album-fearless.png', summary: '流动感金色礼服几乎定义了 Fearless 的视觉记忆。', tag: 'Stage' },
      { id: 'look_fearless_curls', title: '自然卷发舞台造型', image: '/assets/images/ui/avatar-placeholder.png', summary: '延续早期卷发形象，同时更强调主流舞台感。', tag: 'Signature' }
    ],
    signatureVisuals: [
      { id: 'visual_fearless_gold', label: 'Golden Glow', type: 'color', summary: '金色是 Fearless 最直接的情绪入口。' },
      { id: 'visual_fearless_fairytale', label: 'Fairytale', type: 'symbol', summary: '童话式爱情叙事成为时代气质的核心。' }
    ],
    milestones: [
      { id: 'fearless_announce', dateLabel: 'Fearless', title: 'Fearless 时代开启', summary: '从新人期过渡到更明确的主流流行乡村姿态。', type: 'release', action: albumAction('album_fearless') },
      { id: 'fearless_love_story', dateLabel: 'Lead Single', title: 'Love Story 发布', summary: '用最具传唱度的单曲把青春叙事推到更大的舞台。', type: 'release', action: songAction('song_love_story') },
      { id: 'fearless_album', dateLabel: 'Album Release', title: '整专释出', summary: '时代气质、造型和故事表达开始形成完整品牌。', type: 'release', action: albumAction('album_fearless') },
      { id: 'fearless_breakthrough', dateLabel: 'Breakthrough', title: 'Fearless 成为主流突破点', summary: '这一时期让 Taylor 从潜力新人进入更广泛的大众视野。', type: 'award' }
    ],
    listenWatch: {
      albumId: 'album_fearless',
      songIds: ['song_love_story'],
      performanceIds: []
    },
    impact: [
      { id: 'impact_fearless_breakthrough', label: 'Breakthrough', value: 'Mainstream Leap', summary: 'Fearless 是她走向更大主流市场的决定性跳板。' },
      { id: 'impact_fearless_visual', label: 'Visual', value: 'Golden Era', summary: '金色与童话感成为粉丝记忆里最稳固的 Fearless 标签。' }
    ]
  },
  {
    id: 'era_speak_now',
    albumId: 'album_speak_now',
    eraName: 'Speak Now',
    hero: {
      yearLabel: '2010 Speak Now Era',
      intro: '更明确的自我表达、更浓的舞台戏剧感，以及把青春胜利写成宣言的一页。',
      cover: '/assets/images/ui/avatar-placeholder.png',
      themeColor: '#8d69c9'
    },
    signatureLooks: [
      { id: 'look_speak_now_purple_gown', title: '紫色长裙舞台造型', image: '/assets/images/ui/avatar-placeholder.png', summary: '紫色长裙几乎直接等于 Speak Now 的视觉身份。', tag: 'Stage' },
      { id: 'look_speak_now_storybook', title: '童话剧场感造型', image: '/assets/images/ui/avatar-placeholder.png', summary: '更浓的戏剧舞台感让这个时代像一本现场展开的故事书。', tag: 'Signature' }
    ],
    signatureVisuals: [
      { id: 'visual_speak_now_purple', label: 'Purple', type: 'color', summary: '紫色是 Speak Now 最稳定也最直接的时代入口。' },
      { id: 'visual_speak_now_story', label: 'Storybook Stage', type: 'symbol', summary: '舞台像故事书一样被一页页翻开。' }
    ],
    milestones: [
      { id: 'speak_now_announce', dateLabel: '2010', title: 'Speak Now 正式开启', summary: '时代气质转向更自信、更戏剧化的表达。', type: 'release', action: albumAction('album_speak_now') },
      { id: 'speak_now_album', dateLabel: 'Album Release', title: '整专释出', summary: '更强烈的个人表达推动了“自己发声”的时代主题。', type: 'release', action: albumAction('album_speak_now') },
      { id: 'speak_now_long_live', dateLabel: 'Fan Anthem', title: 'Long Live 成为时代代表之一', summary: '把胜利感、共同体和舞台记忆写成最具共鸣的宣言。', type: 'moment', action: songAction('song_long_live') },
      { id: 'speak_now_stage', dateLabel: 'Stage Identity', title: '舞台戏剧感被进一步强化', summary: '这也是后续大型巡演叙事的重要前奏。', type: 'performance' }
    ],
    listenWatch: {
      albumId: 'album_speak_now',
      songIds: ['song_long_live'],
      performanceIds: []
    },
    impact: [
      { id: 'impact_speak_now_voice', label: 'Theme', value: 'Speak Up', summary: '这一 Era 的核心是把情绪和立场更直接地说出来。' },
      { id: 'impact_speak_now_fans', label: 'Fan Memory', value: 'Long Live', summary: 'Long Live 逐渐成为粉丝共同体记忆里的关键歌曲。' }
    ]
  },
  {
    id: 'era_red',
    albumId: 'album_red',
    eraName: 'Red',
    hero: {
      yearLabel: '2012-2021 Red Era',
      intro: '炽热、失控、红唇与秋日记忆，让情绪浓度第一次变成时代主角。',
      cover: '/assets/images/albums/album-red.png',
      themeColor: '#b44545'
    },
    signatureLooks: [
      { id: 'look_red_hat', title: '贝雷帽与复古秋日穿搭', image: '/assets/images/albums/album-red.png', summary: '帽子、红唇和复古秋日感几乎成为 Red 的代名词。', tag: 'Signature' },
      { id: 'look_red_red_lip', title: '红唇舞台造型', image: '/assets/images/ui/avatar-placeholder.png', summary: '更成熟、更电影化的造型语言开始稳定下来。', tag: 'Stage' }
    ],
    signatureVisuals: [
      { id: 'visual_red_color', label: 'Red', type: 'color', summary: '最直接的视觉符号就是高饱和的红。' },
      { id: 'visual_red_autumn', label: 'Autumn Memory', type: 'symbol', summary: '围巾、落叶和旧回忆构成最典型的情绪意象。' }
    ],
    milestones: [
      { id: 'red_announce', dateLabel: '2012', title: 'Red 时代官宣', summary: '比前一个 Era 更复杂、更成熟的情绪开始成为主题。', type: 'release', action: albumAction('album_red') },
      { id: 'red_album', dateLabel: 'Album Release', title: 'Red 整专释出', summary: '风格跨度更大，也让情绪写作迈向更广泛的大众讨论。', type: 'release', action: albumAction('album_red') },
      { id: 'red_all_too_well', dateLabel: 'Legacy Track', title: 'All Too Well 成为时代标志', summary: '它逐渐从专辑曲目成长为整个 Era 的象征。', type: 'moment', action: songAction('song_all_too_well') },
      { id: 'red_grammys', dateLabel: '2024 Grammys', title: 'All Too Well Grammy 舞台', summary: '多年后回看，这场表演进一步巩固了 Red 的时代神话。', type: 'performance' }
    ],
    listenWatch: {
      albumId: 'album_red',
      songIds: ['song_all_too_well', 'song_holy_ground'],
      performanceIds: ['performance_grammys_all_too_well', 'performance_bbc_holy_ground']
    },
    impact: [
      { id: 'impact_red_emotion', label: 'Emotion', value: 'High Saturation', summary: 'Red 把“情绪浓度”本身做成了时代特征。' },
      { id: 'impact_red_legacy', label: 'Legacy', value: 'All Too Well', summary: '一首歌几乎成为整个 Era 的长期文化记忆。' }
    ]
  },
  {
    id: 'era_1989',
    albumId: 'album_1989',
    eraName: '1989',
    hero: {
      yearLabel: '2014 1989 Era',
      intro: '城市霓虹、宝丽来、流行锋芒与彻底转身的自信时刻。',
      cover: '/assets/images/ui/avatar-placeholder.png',
      themeColor: '#7ab5d6'
    },
    signatureLooks: [
      { id: 'look_1989_crop_set', title: '短上衣与两件套舞台造型', image: '/assets/images/ui/avatar-placeholder.png', summary: '更利落的流行明星造型标志着新阶段的开始。', tag: 'Stage' },
      { id: 'look_1989_city_pop', title: '城市感街拍造型', image: '/assets/images/ui/avatar-placeholder.png', summary: '更明确的都市感和时尚感成为 1989 的视觉标签。', tag: 'Street' }
    ],
    signatureVisuals: [
      { id: 'visual_1989_polaroid', label: 'Polaroid', type: 'symbol', summary: '宝丽来是 1989 最有辨识度的视觉符号。' },
      { id: 'visual_1989_blue', label: 'Sky Blue', type: 'color', summary: '清透的天蓝色塑造了这一 Era 的流行空气感。' }
    ],
    milestones: [
      { id: '1989_announce', dateLabel: '2014', title: '1989 官宣', summary: '时代重心正式转向更纯粹的流行表达。', type: 'release', action: albumAction('album_1989') },
      { id: '1989_album', dateLabel: 'Album Release', title: '整专释出', summary: '宝丽来、城市感和高完成度流行制作完成时代定型。', type: 'release', action: albumAction('album_1989') },
      { id: '1989_new_romantics', dateLabel: 'Fan Favorite', title: 'New Romantics 成为时代代表之一', summary: '这首歌延续了 1989 的都市青春气质。', type: 'moment', action: songAction('song_new_romantics') },
      { id: '1989_pop_shift', dateLabel: 'Identity Shift', title: '流行身份被彻底建立', summary: '这是从“跨界尝试”转为“新主身份”的关键阶段。', type: 'award' }
    ],
    listenWatch: {
      albumId: 'album_1989',
      songIds: ['song_new_romantics'],
      performanceIds: []
    },
    impact: [
      { id: 'impact_1989_pop', label: 'Shift', value: 'Full Pop Era', summary: '1989 是她流行身份最明确的一次成型。' },
      { id: 'impact_1989_visual', label: 'Visual', value: 'Polaroid Memory', summary: '视觉系统本身也成为 1989 被反复回忆的重要原因。' }
    ]
  },
  {
    id: 'era_folklore',
    albumId: 'album_folklore',
    eraName: 'folklore',
    hero: {
      yearLabel: '2020 folklore Era',
      intro: '树林、耳语、虚构叙事与把流行明星身份重新藏进故事里的时期。',
      cover: '/assets/images/ui/avatar-placeholder.png',
      themeColor: '#7b7b7b'
    },
    signatureLooks: [
      { id: 'look_folklore_knit', title: '针织开衫与灰调造型', image: '/assets/images/ui/avatar-placeholder.png', summary: '柔软、低饱和的服装构成了 folklore 的安静入口。', tag: 'Signature' },
      { id: 'look_folklore_forest', title: '森林感黑白视觉', image: '/assets/images/ui/avatar-placeholder.png', summary: '黑白或灰调森林影像强化了它的叙事氛围。', tag: 'Visual' }
    ],
    signatureVisuals: [
      { id: 'visual_folklore_forest', label: 'Forest', type: 'symbol', summary: '树林是 folklore 最核心的空间隐喻。' },
      { id: 'visual_folklore_grey', label: 'Soft Grey', type: 'color', summary: '低饱和灰调让整个 Era 更像一则传说。' }
    ],
    milestones: [
      { id: 'folklore_drop', dateLabel: 'Surprise Drop', title: 'folklore 突袭发布', summary: '发行方式与气质都和此前时代形成强烈反差。', type: 'release', action: albumAction('album_folklore') },
      { id: 'folklore_album', dateLabel: 'Album Release', title: '整专开启叙事转向', summary: '从私人日记向更角色化的叙事方式迈进。', type: 'release', action: albumAction('album_folklore') },
      { id: 'folklore_mirrorball', dateLabel: 'Standout Track', title: 'mirrorball 成为代表歌曲之一', summary: '既脆弱又自我表演的主题浓缩了这一 Era 的一部分灵魂。', type: 'moment', action: songAction('song_mirrorball') },
      { id: 'folklore_storytelling', dateLabel: 'Identity Shift', title: '故事化写作被进一步强化', summary: '这是她叙事能力被重新评价的重要节点。', type: 'award' }
    ],
    listenWatch: {
      albumId: 'album_folklore',
      songIds: ['song_mirrorball'],
      performanceIds: []
    },
    impact: [
      { id: 'impact_folklore_story', label: 'Writing', value: 'Storytelling Pivot', summary: 'folklore 让“角色叙事”成为新的讨论中心。' },
      { id: 'impact_folklore_mood', label: 'Mood', value: 'Muted World', summary: '低饱和、安静、文学感成为这一时代的共同记忆。' }
    ]
  },
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
      { id: 'look_midnights_glitter', title: '亮片与深夜秀场感造型', image: '/assets/images/albums/album-midnights.png', summary: '亮片、珠光和深夜秀场感构成了 Midnights 的主舞台气氛。', tag: 'Stage' },
      { id: 'look_midnights_retro', title: '复古午夜妆造', image: '/assets/images/ui/avatar-placeholder.png', summary: '复古轮廓配上深色调，让 Midnights 更像一间失眠的后台休息室。', tag: 'Signature' }
    ],
    signatureVisuals: [
      { id: 'visual_midnights_blue', label: 'Midnight Blue', type: 'color', summary: '深蓝色是 Midnights 最稳定的情绪底色。' },
      { id: 'visual_midnights_mirror', label: 'Self-Reflection', type: 'symbol', summary: '镜像、自我凝视和深夜独白是时代主轴。' }
    ],
    milestones: [
      { id: 'midnights_announce', dateLabel: '2022', title: 'Midnights 官宣', summary: '从概念阶段就明确了“午夜思绪”这一核心设定。', type: 'release', action: albumAction('album_midnights') },
      { id: 'midnights_anti_hero', dateLabel: 'Lead Single', title: 'Anti-Hero 发布', summary: '用最直接的自我剖白把 Era 核心主题推到最前面。', type: 'release', action: songAction('song_anti_hero') },
      { id: 'midnights_album', dateLabel: 'Album Release', title: '整专释出', summary: '华丽感与脆弱感并行，成为 Midnights 最有辨识度的组合。', type: 'release', action: albumAction('album_midnights') },
      { id: 'midnights_iheart', dateLabel: '2023 iHeart', title: 'Anti-Hero 电视舞台', summary: '这一场电视舞台延续了 Midnights 的视觉语言。', type: 'performance' }
    ],
    listenWatch: {
      albumId: 'album_midnights',
      songIds: ['song_anti_hero', 'song_dear_reader'],
      performanceIds: ['performance_iheart_anti_hero']
    },
    impact: [
      { id: 'impact_midnights_theme', label: 'Theme', value: 'Sleepless Self-Talk', summary: 'Midnights 把“深夜自我对话”做成了清晰的时代主题。' },
      { id: 'impact_midnights_visual', label: 'Visual', value: 'Midnight Blue', summary: '从配色到舞台，它都建立起了稳定的时代视觉识别。' }
    ]
  }
];
```

Create `utils/eraSelectors.ts`:

```ts
import { performances } from '../data/performances';
import { eraExhibits } from '../data/eraExhibits';
import { EraExhibitDetail } from '../types/era';
import { getAlbumById, getSongById } from './selectors';
import { ROUTES } from './constants';

export function getEraExhibitDetailById(id: string): EraExhibitDetail | undefined {
  const exhibit = eraExhibits.find((item) => item.id === id);
  if (!exhibit) {
    return undefined;
  }

  const album = getAlbumById(exhibit.listenWatch.albumId);
  const songs = exhibit.listenWatch.songIds
    .map((songId) => getSongById(songId))
    .filter((song): song is NonNullable<typeof song> => Boolean(song))
    .map((song) => ({
      ...song,
      action: {
        route: ROUTES.song,
        query: `id=${song.id}`
      }
    }));

  const exhibitPerformances = exhibit.listenWatch.performanceIds
    .map((performanceId) =>
      performances.find((item) => item.domain === 'library' && item.id === performanceId)
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...exhibit,
    hero: { ...exhibit.hero },
    signatureLooks: exhibit.signatureLooks.map((item) => ({ ...item })),
    signatureVisuals: exhibit.signatureVisuals.map((item) => ({ ...item })),
    milestones: exhibit.milestones.map((item) => ({
      ...item,
      action: item.action ? { ...item.action } : undefined
    })),
    impact: exhibit.impact.map((item) => ({ ...item })),
    album: album
      ? {
          ...album,
          action: {
            route: ROUTES.album,
            query: `id=${album.id}`
          }
        }
      : null,
    songs,
    performances: exhibitPerformances
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
    "test:era": "tsx --test tests/era-module.test.ts",
    "test:tour": "tsx --test tests/tour-module.test.ts",
    "test:library": "tsx --test tests/library-module.test.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 4: Run the new exhibit test suite and type-check**

Run:

```bash
npm run test:era
npm run typecheck
```

Expected:

```text
PASS tests/era-module.test.ts
Found 0 errors
```

---

### Task 2: Register the Exhibit Page, Wire Homepage Era Cards, and Build the Long-Scroll Layout

**Files:**
- Modify: `app.json`
- Modify: `utils/constants.ts`
- Modify: `data/home.ts`
- Modify: `tests/home-module.test.ts`
- Modify: `tests/era-module.test.ts`
- Create: `pages/era/detail/index.json`
- Create: `pages/era/detail/index.ts`
- Create: `pages/era/detail/index.wxml`
- Create: `pages/era/detail/index.wxss`

- [ ] **Step 1: Write the failing routing and page-controller tests**

Update `tests/home-module.test.ts`:

```ts
test('home eras stay in museum order and point to era exhibit detail routes', () => {
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
  assert.equal(eras[0]?.action.route, ROUTES.eraDetail);
  assert.equal(eras[0]?.action.query, 'id=era_taylor_swift');
});
```

Extend `tests/era-module.test.ts` with a page-controller test:

```ts
test('era exhibit page loads data, routes generic query strings, and reuses performance modal copy', async () => {
  type EraPageConfig = {
    onLoad: (options: { id?: string }) => void;
    goRoute: (event: { currentTarget: { dataset: Record<string, unknown> } }) => void;
    openPerformance: (event: { currentTarget: { dataset: Record<string, string> } }) => void;
  };

  let pageConfig: EraPageConfig | undefined;
  const navigateToCalls: Array<{ url: string }> = [];
  const showModalCalls: Array<{ title: string; content: string }> = [];

  (globalThis as typeof globalThis & { Page?: unknown }).Page = ((config: EraPageConfig) => {
    pageConfig = config;
  }) as unknown as typeof Page;

  (globalThis as typeof globalThis & {
    wx?: {
      navigateTo: (options: { url: string }) => void;
      showModal: (options: { title: string; content: string; showCancel: boolean; confirmText: string }) => void;
    };
  }).wx = {
    navigateTo: (options) => {
      navigateToCalls.push(options);
    },
    showModal: (options) => {
      showModalCalls.push({ title: options.title, content: options.content });
    }
  };

  try {
    await import(new URL('../pages/era/detail/index.ts?era-page-test', import.meta.url).href);

    assert.ok(pageConfig);

    const ctx = {
      data: { exhibit: null, hasError: false },
      setData(update: Record<string, unknown>) {
        this.data = { ...this.data, ...update };
      }
    };

    pageConfig.onLoad.call(ctx, { id: 'era_midnights' });
    assert.equal((ctx.data as { hasError: boolean }).hasError, false);

    pageConfig.goRoute({
      currentTarget: {
        dataset: {
          route: ROUTES.song,
          query: 'id=song_anti_hero'
        }
      }
    });
    pageConfig.goRoute({ currentTarget: { dataset: {} } });
    pageConfig.openPerformance({
      currentTarget: {
        dataset: {
          title: 'Anti-Hero',
          subtitle: 'iHeartRadio Music Awards · 2023',
          meta: 'FOX · 4:27',
          summary: 'A televised performance built around the Midnights visual language.'
        }
      }
    });

    assert.deepEqual(navigateToCalls, [{ url: `${ROUTES.song}?id=song_anti_hero` }]);
    assert.equal(showModalCalls[0]?.title, '演出信息');
  } finally {
    delete (globalThis as { Page?: unknown }).Page;
    delete (globalThis as { wx?: unknown }).wx;
  }
});
```

- [ ] **Step 2: Run the tests to verify the new route and page are still missing**

Run:

```bash
npm run test:home
npm run test:era
```

Expected:

```text
FAIL on missing ROUTES.eraDetail and missing pages/era/detail/index.ts
```

- [ ] **Step 3: Register the route, point homepage cards to it, and build the new page**

Modify `utils/constants.ts`:

```ts
export const ROUTES = {
  library: '/pages/library/index',
  tour: '/pages/tour/index',
  tourDetail: '/pages/tour/detail/index',
  showDetail: '/pages/show/detail/index',
  guide: '/pages/guide/index',
  videoUpload: '/pages/video/upload/index',
  album: '/pages/album/index',
  eraDetail: '/pages/era/detail/index',
  song: '/pages/song/index',
  songList: '/pages/song-list/index',
  performanceList: '/pages/performance/index',
  documentaryList: '/pages/documentary/index',
  collectionList: '/pages/collection/index',
  collectionDetail: '/pages/collection/detail/index',
  favorites: '/pages/favorites/index'
} as const;
```

Modify `app.json` by inserting the new non-tab page:

```json
{
  "pages": [
    "pages/home/index",
    "pages/library/index",
    "pages/era/detail/index",
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

Modify `data/home.ts` so homepage cards route to the new exhibit page:

```ts
import { ROUTES } from '../utils/constants';
import { HomeEraCard, HomeSpotlight } from '../types/home';

function createHomeEraCard(input: Omit<HomeEraCard, 'action'>): HomeEraCard {
  return {
    ...input,
    action: {
      type: 'navigateTo',
      route: ROUTES.eraDetail,
      query: `id=${input.id}`
    }
  };
}
```

Create `pages/era/detail/index.json`:

```json
{
  "navigationBarTitleText": "Era 展厅",
  "usingComponents": {
    "empty-state": "/components/empty-state/index"
  }
}
```

Create `pages/era/detail/index.ts`:

```ts
import { EraExhibitDetail } from '../../../types/era';
import { getEraExhibitDetailById } from '../../../utils/eraSelectors';

interface EraPageData {
  exhibit: EraExhibitDetail | null;
  hasError: boolean;
}

interface RouteDataset {
  route?: string;
  query?: string;
}

interface PerformanceDataset {
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
    hasError: false
  } as EraPageData,

  onLoad(options: { id?: string }) {
    const exhibitId = options.id ?? '';
    const exhibit = getEraExhibitDetailById(exhibitId);

    if (!exhibit) {
      this.setData({ exhibit: null, hasError: true });
      return;
    }

    this.setData({
      exhibit,
      hasError: false
    });
  },

  goRoute(event: { currentTarget: { dataset: RouteDataset } }) {
    const { route, query } = event.currentTarget.dataset;
    if (!route) {
      return;
    }

    wx.navigateTo({
      url: query ? `${route}?${query}` : route
    });
  },

  openPerformance(event: { currentTarget: { dataset: PerformanceDataset } }) {
    const { title, subtitle, meta, summary } = event.currentTarget.dataset;

    showInfoModal('演出信息', [
      title,
      subtitle,
      meta,
      summary,
      '暂未接入独立演出页，这里先复用资料馆的可点击信息入口。'
    ]);
  }
});
```

Create `pages/era/detail/index.wxml`:

```xml
<view class="container">
  <empty-state wx:if="{{hasError}}" title="Era 不存在" desc="请返回首页重新选择。"></empty-state>

  <view wx:elif="{{exhibit}}">
    <view class="card hero-card">
      <view class="hero-accent" style="background: {{exhibit.hero.themeColor}};"></view>
      <image class="hero-cover" src="{{exhibit.hero.cover}}" mode="aspectFill"></image>
      <text class="hero-era">{{exhibit.eraName}}</text>
      <text class="hero-year">{{exhibit.hero.yearLabel}}</text>
      <text class="hero-intro">{{exhibit.hero.intro}}</text>
    </view>

    <view class="card">
      <text class="section-title">Signature Looks</text>
      <view class="looks-grid">
        <view wx:for="{{exhibit.signatureLooks}}" wx:key="id" class="look-card">
          <image class="look-image" src="{{item.image}}" mode="aspectFill"></image>
          <text class="look-title">{{item.title}}</text>
          <text wx:if="{{item.tag}}" class="look-tag">{{item.tag}}</text>
          <text class="look-summary">{{item.summary}}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="section-title">Signature Visuals</text>
      <view wx:for="{{exhibit.signatureVisuals}}" wx:key="id" class="visual-item">
        <text class="visual-label">{{item.label}}</text>
        <text class="visual-summary">{{item.summary}}</text>
      </view>
    </view>

    <view class="card">
      <text class="section-title">Milestone Timeline</text>
      <view wx:for="{{exhibit.milestones}}" wx:key="id" class="timeline-item">
        <text class="timeline-date">{{item.dateLabel}}</text>
        <text class="timeline-title">{{item.title}}</text>
        <text class="timeline-summary">{{item.summary}}</text>
        <text
          wx:if="{{item.action}}"
          class="timeline-action"
          data-route="{{item.action.route}}"
          data-query="{{item.action.query}}"
          bindtap="goRoute"
        >
          继续浏览
        </text>
      </view>
    </view>

    <view class="card">
      <text class="section-title">Listen / Watch</text>

      <view
        wx:if="{{exhibit.album}}"
        class="listen-entry"
        data-route="{{exhibit.album.action.route}}"
        data-query="{{exhibit.album.action.query}}"
        bindtap="goRoute"
      >
        <text class="listen-label">Album</text>
        <text class="listen-title">{{exhibit.album.name}}</text>
        <text class="listen-meta">{{exhibit.album.year}} 年</text>
      </view>

      <view
        wx:for="{{exhibit.songs}}"
        wx:key="id"
        class="listen-entry"
        data-route="{{item.action.route}}"
        data-query="{{item.action.query}}"
        bindtap="goRoute"
      >
        <text class="listen-label">Song</text>
        <text class="listen-title">{{item.name}}</text>
      </view>

      <view
        wx:for="{{exhibit.performances}}"
        wx:key="id"
        class="listen-entry"
        data-title="{{item.title}}"
        data-subtitle="{{item.eventName}} · {{item.year}}"
        data-meta="{{item.source}} · {{item.duration}}"
        data-summary="{{item.summary}}"
        bindtap="openPerformance"
      >
        <text class="listen-label">Live</text>
        <text class="listen-title">{{item.title}}</text>
        <text class="listen-meta">{{item.eventName}} · {{item.year}}</text>
      </view>
    </view>

    <view class="card">
      <text class="section-title">Impact</text>
      <view wx:for="{{exhibit.impact}}" wx:key="id" class="impact-item">
        <text class="impact-label">{{item.label}}</text>
        <text class="impact-value">{{item.value}}</text>
        <text class="impact-summary">{{item.summary}}</text>
      </view>
    </view>
  </view>
</view>
```

Create `pages/era/detail/index.wxss`:

```css
.hero-card {
  overflow: hidden;
}

.hero-accent {
  height: 10rpx;
  margin: -24rpx -24rpx 20rpx;
}

.hero-cover {
  width: 100%;
  height: 280rpx;
  border-radius: 18rpx;
  background: #f2f2f2;
}

.hero-era {
  display: block;
  margin-top: 20rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: #111111;
}

.hero-year {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #7b7b7b;
}

.hero-intro {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #555555;
}

.section-title {
  display: block;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #111111;
}

.looks-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18rpx;
}

.look-card {
  padding: 18rpx;
  border-radius: 18rpx;
  background: #fafafa;
}

.look-image {
  width: 100%;
  height: 220rpx;
  border-radius: 14rpx;
  background: #f0f0f0;
}

.look-title {
  display: block;
  margin-top: 14rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.look-tag {
  display: inline-block;
  margin-top: 8rpx;
  font-size: 20rpx;
  color: #6b7280;
}

.look-summary,
.visual-summary,
.timeline-summary,
.impact-summary {
  display: block;
  margin-top: 10rpx;
  font-size: 23rpx;
  line-height: 1.6;
  color: #666666;
}

.visual-item,
.timeline-item,
.listen-entry,
.impact-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.visual-item:last-child,
.timeline-item:last-child,
.listen-entry:last-child,
.impact-item:last-child {
  border-bottom: 0;
}

.visual-label,
.timeline-title,
.listen-title,
.impact-value {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #111111;
}

.timeline-date,
.listen-label,
.impact-label,
.listen-meta {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: #8a8a8a;
}

.timeline-action {
  display: inline-block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #111111;
  border-bottom: 2rpx solid #111111;
}
```

- [ ] **Step 4: Run full verification after the new page and home routing are in place**

Run:

```bash
npm run test:home
npm run test:era
npm run test:library
npm run test:tour
npm run typecheck
```

Expected:

```text
All tests pass and TypeScript reports no errors.
```

Manual QA in WeChat DevTools:

- open the home tab and confirm Era cards now navigate to the new exhibit page
- open at least `era_midnights` and `era_red`
- verify missing ids show `empty-state`
- verify milestone links open existing song/album pages when `action` exists
- verify `Live` entries open the info modal instead of dead-tapping

---

### Task 3: Sync Project Docs to the New Era Exhibit Route and Data Contract

**Files:**
- Modify: `docs/context.md`
- Modify: `docs/architecture.md`
- Modify: `docs/data.md`
- Modify: `docs/api.md`

- [ ] **Step 1: Update context and architecture docs for the new page**

Update `docs/context.md`:

```md
### 首页

- 条件展示的首页事件 Hero
- Era 博物馆横滑卡片
- 最近动态摘要

说明：Era 卡片当前跳转到独立的 Era 展厅页，而不再复用专辑详情页。

### 资料馆 / Era 承接

- Era 展厅页：按时代查看 Hero、视觉符号、大事记和资料馆入口
```

Update `docs/architecture.md`:

```md
### 资料馆相关页面

- `pages/era/detail/index`
- `pages/album/index`
- `pages/song/index`
- `pages/song-list/index`
- `pages/performance/index`

## 目录职责

- `utils/eraSelectors.ts`：Era 展厅页专用聚合与派生

## 关键实现入口

### 首页与资料馆

- [pages/home/index.ts](/Users/bytedance/projects/swiftie-mini/pages/home/index.ts)：首页 Hero、Era 卡片与最近动态摘要聚合
- [pages/era/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/era/detail/index.ts)：Era 展厅页数据加载、跳转和展示聚合
```

- [ ] **Step 2: Update data and API docs for the new route + contract**

Update `docs/data.md`:

```md
### Era 展厅数据

- [data/eraExhibits.ts](/Users/bytedance/projects/swiftie-mini/data/eraExhibits.ts)

## 类型模型

- [types/era.ts](/Users/bytedance/projects/swiftie-mini/types/era.ts)：Era 展厅页类型

## Selector 与视图派生

- [utils/eraSelectors.ts](/Users/bytedance/projects/swiftie-mini/utils/eraSelectors.ts)：Era 展厅聚合与资料馆引用解析
```

Update `docs/api.md`:

```md
## 当前页面参数契约

- `pages/era/detail/index?id=<eraId>`：Era 展厅页
- `pages/album/index?id=<albumId>`：专辑详情态

## 页面数据接口约定

- Era 展厅页当前通过 `hero`、`signatureLooks`、`signatureVisuals`、`milestones`、`listenWatch`、`impact` 组织内容
- `listenWatch` 区块优先通过现有 `albumId`、`songIds`、`performanceIds` 复用资料馆数据

## 未来变更要求

- 如果 Era 展厅改为服务端供数，优先定义 `GET /eras/{id}`，返回 `hero`、`signatureLooks`、`signatureVisuals`、`milestones`、`listenWatch`、`impact`
```

- [ ] **Step 3: Re-run verification after the docs update**

Run:

```bash
npm run test:home
npm run test:era
npm run test:library
npm run test:tour
npm run typecheck
```

Expected:

```text
All tests remain green after the route/data/docs sync.
```

---

## Self-Review

### Spec Coverage

- `全新页面 + 单页长滚动` — implemented in Task 2 with `pages/era/detail/index.*`
- `Hero / Signature / Timeline / Listen / Watch / Impact` — implemented through Task 1 data contract and Task 2 page layout
- `策展壳 + 资料馆引用` — implemented in Task 1 via `data/eraExhibits.ts` + `utils/eraSelectors.ts`
- `Timeline 节点可选跳转` — implemented in Task 1 milestone actions and Task 2 `goRoute`
- `首页 Era 卡片改跳新页面` — implemented in Task 2 via `data/home.ts` and `ROUTES.eraDetail`
- `文档同步` — implemented in Task 3

### Placeholder Scan

- No `TODO` / `TBD`
- Every task uses exact file paths
- Every code-changing step includes concrete code and commands

### Type Consistency

- `EraRouteAction` is the single action shape used by milestones and resolved album/song actions
- `getEraExhibitDetailById()` is the only selector entry point used by the page controller
- `ROUTES.eraDetail` and `pages/era/detail/index?id=<eraId>` stay consistent across tests, routing, and docs
