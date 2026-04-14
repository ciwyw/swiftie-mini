import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clearContentStoreCache } from '../services/contentStore';

test('era detail page controller loads remote archive state and opens honor/revisit interactions', async () => {
  type EraDetailPageConfig = {
    data: {
      exhibit: {
        featuredHonors: Array<{ id: string }>;
        remainingHonors: Array<{ id: string }>;
      } | null;
      hasError: boolean;
      isHonorSheetOpen: boolean;
    };
    setData: (patch: Partial<EraDetailPageConfig['data']>) => void;
    onLoad: (options: { id?: string }) => void | Promise<void>;
    goRoute: (event: { currentTarget: { dataset: { route?: string; query?: string } } }) => void;
    openHonorSheet: () => void;
    closeHonorSheet: () => void;
    openRevisitItem: (event: {
      currentTarget: {
        dataset: {
          kind: 'live' | 'interview' | 'special';
          title: string;
          subtitle?: string;
          meta?: string;
          summary?: string;
        };
      };
    }) => void;
  };

  clearContentStoreCache();

  const runtimeGlobal = globalThis as typeof globalThis & {
    Page?: typeof Page;
    wx?: typeof wx;
  };
  const originalPage = runtimeGlobal.Page;
  const originalWx = runtimeGlobal.wx;
  const showModalCalls: Array<{
    title: string;
    content: string;
    showCancel: boolean;
    confirmText: string;
  }> = [];
  const navigateToCalls: Array<{ url: string }> = [];
  const requestUrls: string[] = [];
  let pageConfig: EraDetailPageConfig | undefined;
  const eraPayload = {
    id: 'era_midnights',
    albumId: 'album_midnights',
    eraName: 'Midnights',
    hero: {
      intro: '午夜蓝、清醒独白、镜像自省与既华丽又不安的深夜思绪。',
      cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/albums/album-midnights.png',
      themeColor: '#324765'
    },
    signatureLooks: [
      {
        id: 'look_midnights_glitter',
        title: '亮片与深夜秀场感造型',
        image: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/albums/album-midnights.png'
      },
      {
        id: 'look_midnights_retro',
        title: '复古午夜妆造',
        image: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/ui/avatar-placeholder.png'
      }
    ],
    milestones: [
      {
        id: 'midnights_announce',
        title: '官宣专辑',
        summary: '从概念阶段就明确了“午夜思绪”这一核心设定。',
        type: 'release',
        action: { route: '/pages/album/index', query: 'id=album_midnights' }
      },
      {
        id: 'midnights_anti_hero',
        title: '单曲打单',
        summary: 'Anti-Hero 把这一 Era 最直接的自我剖白推到最前面。',
        type: 'release',
        action: { route: '/pages/song/index', query: 'id=song_anti_hero' }
      },
      {
        id: 'midnights_album',
        title: '专辑发布',
        summary: '华丽感与脆弱感并行，成为 Midnights 最有辨识度的组合。',
        type: 'release',
        action: { route: '/pages/album/index', query: 'id=album_midnights' }
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
  };
  const albumPayload = {
    id: 'album_midnights',
    name: 'Midnights',
    year: 2022,
    cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/albums/album-midnights.png'
  };
  const performancesPayload = [
    {
      id: 'performance_iheart_anti_hero',
      title: 'Anti-Hero',
      songIds: ['song_anti_hero'],
      kind: 'live',
      domain: 'library',
      eventName: 'iHeartRadio Music Awards',
      year: 2023,
      cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/ui/avatar-placeholder.png',
      source: 'FOX',
      duration: '4:27',
      summary: 'A televised performance built around the Midnights visual language.'
    },
    {
      id: 'performance_midnights_release_interview',
      title: 'Midnights Release Week Interview',
      songIds: ['song_anti_hero'],
      kind: 'interview',
      domain: 'library',
      eventName: 'iHeartRadio Interview',
      year: 2022,
      cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/ui/avatar-placeholder.png',
      source: 'iHeartRadio',
      duration: '12:40',
      summary: 'A release-week conversation focused on the album’s sleepless-night concept.'
    }
  ];

  runtimeGlobal.Page = ((config: EraDetailPageConfig) => {
    pageConfig = config;
  }) as typeof Page;
  runtimeGlobal.wx = {
    navigateTo(options: { url: string }) {
      navigateToCalls.push(options);
    },
    request(options: {
      url: string;
      method?: string;
      success?: (result: { statusCode: number; data: unknown }) => void;
      fail?: (error: Error) => void;
    }) {
      requestUrls.push(options.url);

      if (options.url.endsWith('/eras/era_midnights')) {
        options.success?.({ statusCode: 200, data: { code: 0, data: eraPayload } });
        return;
      }

      if (options.url.endsWith('/albums/album_midnights')) {
        options.success?.({ statusCode: 200, data: { code: 0, data: albumPayload } });
        return;
      }

      if (options.url.endsWith('/performances')) {
        options.success?.({ statusCode: 200, data: { code: 0, data: performancesPayload } });
        return;
      }

      if (options.url.endsWith('/eras/era_unknown')) {
        options.success?.({ statusCode: 200, data: { code: 0, data: null } });
        return;
      }

      options.fail?.(new Error(`Unhandled request: ${options.url}`));
    },
    showModal(options: {
      title: string;
      content: string;
      showCancel: boolean;
      confirmText: string;
    }) {
      showModalCalls.push(options);
    }
  } as unknown as typeof wx;

  try {
    await import('../pages/era/detail/index');
    assert.ok(pageConfig);

    pageConfig.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };

    await pageConfig.onLoad.call(pageConfig, { id: 'era_midnights' });
    assert.equal(requestUrls.length, 3);
    assert.equal(pageConfig.data.isHonorSheetOpen, false);
    assert.equal(pageConfig.data.exhibit?.featuredHonors.length, 3);
    assert.equal(pageConfig.data.exhibit?.remainingHonors.length, 1);

    pageConfig.openHonorSheet.call(pageConfig);
    assert.equal(pageConfig.data.isHonorSheetOpen, true);

    pageConfig.closeHonorSheet.call(pageConfig);
    assert.equal(pageConfig.data.isHonorSheetOpen, false);

    pageConfig.goRoute({
      currentTarget: {
        dataset: {
          route: '/pages/album/index',
          query: 'id=album_midnights'
        }
      }
    });

    pageConfig.openRevisitItem({
      currentTarget: {
        dataset: {
          kind: 'interview',
          title: 'Midnights Release Week Interview',
          subtitle: 'iHeartRadio Interview · 2022',
          meta: 'iHeartRadio · 12:40',
          summary: 'A release-week conversation focused on the album’s sleepless-night concept.'
        }
      }
    });

    assert.deepEqual(navigateToCalls, [{ url: '/pages/album/index?id=album_midnights' }]);
    assert.deepEqual(showModalCalls, [
      {
        title: '时代回看',
        content:
          '采访\nMidnights Release Week Interview\niHeartRadio Interview · 2022\niHeartRadio · 12:40\nA release-week conversation focused on the album’s sleepless-night concept.\n暂未接入完整内容页，这里先作为可点击入口。',
        showCancel: false,
        confirmText: '知道了'
      }
    ]);

    await pageConfig.onLoad.call(pageConfig, {});
    assert.equal(pageConfig.data.hasError, true);
    assert.equal(pageConfig.data.exhibit, null);
    assert.equal(pageConfig.data.isHonorSheetOpen, false);

    await pageConfig.onLoad.call(pageConfig, { id: 'era_unknown' });
    assert.equal(pageConfig.data.hasError, true);
    assert.equal(pageConfig.data.exhibit, null);
    assert.equal(pageConfig.data.isHonorSheetOpen, false);
  } finally {
    runtimeGlobal.Page = originalPage;
    runtimeGlobal.wx = originalWx;
  }
});

test('era detail template no longer renders ambiguous label-style date fields', () => {
  const template = readFileSync(new URL('../pages/era/detail/index.wxml', import.meta.url), 'utf8');

  assert.doesNotMatch(template, /hero\.yearLabel/);
  assert.doesNotMatch(template, /item\.dateLabel/);
});
