import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clearContentStoreCache } from '../services/contentStore';
import { HomeSpotlightType } from '../types/home';
import { ROUTES } from '../utils/constants';

const TOUR_IDS = {
  eras: '48291357'
} as const;

function getLocalDayTimestamp(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getTime();
}

test('home template makes each news item tappable through the shared action dataset', () => {
  const template = readFileSync(new URL('../pages/home/index.wxml', import.meta.url), 'utf8');

  assert.match(template, /wx:if="{{spotlights\.length}}"/);
  assert.match(template, /wx:for="{{spotlights}}"/);
  assert.match(template, /class="spotlight-card card"/);
  assert.match(template, /class="spotlight-cta"/);
  assert.match(template, /data-type="{{item\.action\.type}}"/);
  assert.match(template, /data-route="{{item\.action\.route}}"/);
  assert.match(template, /data-query="{{item\.action\.query}}"/);
  assert.match(template, /bindtap="goAction"/);
  assert.doesNotMatch(template, /spotlight\.eyebrow/);
});

test('home page refreshes spotlight cards with remote feed data and goAction keeps routing behavior', async () => {
  type HomePageConfig = {
    data: {
      spotlights: Array<{
        eyebrow: string;
        title: string;
        summary: string;
        ctaText: string;
        cover: string;
        action: { type: string; route: string; query?: string };
      }>;
      eras: Array<{ id: string; cover: string }>;
      news: Array<{ title: string; dateText: string }>;
      isLoading: boolean;
      loadError: boolean;
    };
    setData: (patch: Partial<HomePageConfig['data']>) => void;
    refreshFeed: () => Promise<void>;
    goAction: (event: { currentTarget: { dataset: Record<string, unknown> } }) => void;
  };

  clearContentStoreCache();

  let pageConfig: HomePageConfig | undefined;
  const requestUrls: string[] = [];
  const switchTabCalls: Array<{ url: string }> = [];
  const navigateToCalls: Array<{ url: string }> = [];
  const remoteFeed = {
    spotlights: [
      {
        id: 'spotlight_album_midnights_album_release_week',
        type: HomeSpotlightType.AlbumReleaseWeek,
        entityId: 'album_midnights',
        name: 'Midnights',
        cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/albums/album-midnights.png',
        startAt: getLocalDayTimestamp(2026, 4, 30),
        endAt: getLocalDayTimestamp(2026, 5, 6),
        action: {
          type: 'navigateTo',
          route: ROUTES.album,
          query: 'id=album_midnights'
        }
      }
    ],
    eras: [
      {
        id: 'era_midnights',
        albumId: 'album_midnights',
        name: 'Midnights',
        cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/albums/album-midnights.png',
        themeColor: '#324765',
        tagline: '午夜独白、蓝调霓虹和清醒到发亮的思绪。',
        action: {
          type: 'navigateTo',
          route: ROUTES.eraDetail,
          query: 'id=era_midnights'
        }
      }
    ],
    news: [
      {
        id: 'news_remote',
        title: 'Remote Home Feed',
        publishedAt: getLocalDayTimestamp(2026, 4, 29),
        summary: 'Loaded from the API layer.',
        tag: '远程',
        action: {
          type: 'navigateTo',
          route: ROUTES.tourDetail,
          query: `id=${TOUR_IDS.eras}`
        }
      }
    ]
  };

  (globalThis as typeof globalThis & { Page?: unknown }).Page = ((config: HomePageConfig) => {
    pageConfig = config;
  }) as unknown as typeof Page;
  (globalThis as typeof globalThis & {
    wx?: {
      switchTab: (options: { url: string }) => void;
      navigateTo: (options: { url: string }) => void;
      request: (options: {
        url: string;
        method?: string;
        success?: (result: { statusCode: number; data: unknown }) => void;
        fail?: (error: Error) => void;
      }) => void;
    };
  }).wx = {
    switchTab: (options) => {
      switchTabCalls.push(options);
    },
    navigateTo: (options) => {
      navigateToCalls.push(options);
    },
    request: (options) => {
      requestUrls.push(options.url);
      options.success?.({
        statusCode: 200,
        data: {
          code: 0,
          data: remoteFeed
        }
      });
    }
  };

  try {
    await import(new URL('../pages/home/index.ts?home-page-remote-test', import.meta.url).href);

    assert.ok(pageConfig);
    pageConfig.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };

    await pageConfig.refreshFeed();

    assert.equal(requestUrls.length, 1);
    assert.match(requestUrls[0] ?? '', /\/home$/);
    assert.equal(pageConfig.data.spotlights[0]?.eyebrow, 'NEW RELEASE');
    assert.equal(pageConfig.data.spotlights[0]?.title, 'Midnights 发布中');
    assert.equal(pageConfig.data.spotlights[0]?.ctaText, '查看专辑');
    assert.equal(pageConfig.data.spotlights[0]?.cover, remoteFeed.spotlights[0].cover);
    assert.equal(pageConfig.data.eras[0]?.cover, remoteFeed.eras[0].cover);
    assert.equal(pageConfig.data.news[0]?.title, 'Remote Home Feed');
    assert.equal(pageConfig.data.news[0]?.dateText, '2026-04-29');
    assert.equal(pageConfig.data.isLoading, false);
    assert.equal(pageConfig.data.loadError, false);

    pageConfig.goAction({ currentTarget: { dataset: {} } });
    pageConfig.goAction({
      currentTarget: {
        dataset: {
          type: 'openExternal',
          route: ROUTES.tour
        }
      }
    });
    pageConfig.goAction({
      currentTarget: {
        dataset: {
          type: 'navigateTo',
          route: ROUTES.guide,
          query: `tourId=${TOUR_IDS.eras}`
        }
      }
    });
    pageConfig.goAction({
      currentTarget: {
        dataset: {
          type: 'switchTab',
          route: ROUTES.tour
        }
      }
    });

    assert.deepEqual(navigateToCalls, [{ url: `${ROUTES.guide}?tourId=${TOUR_IDS.eras}` }]);
    assert.deepEqual(switchTabCalls, [{ url: ROUTES.tour }]);
  } finally {
    delete (globalThis as { Page?: unknown }).Page;
    delete (globalThis as { wx?: unknown }).wx;
  }
});
