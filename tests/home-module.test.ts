import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { albums } from '../data/albums';
import { newsItems } from '../data/news';
import { tours } from '../data/tours';
import { HomeSpotlightType } from '../types/home';
import { ROUTES } from '../utils/constants';
import {
  getHomeEras,
  getHomeFeed,
  getHomeNews
} from '../utils/homeSelectors';

const TOUR_IDS = {
  eras: '48291357'
} as const;

function getLocalDayTimestamp(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getTime();
}

function withMockedDate<T>(iso: string, run: () => T): T {
  const RealDate = Date;
  const fixedTime = new RealDate(iso).getTime();

  class MockDate extends RealDate {
    constructor(...args: never[]) {
      if (args.length === 0) {
        super(fixedTime);
        return;
      }

      super(...(args as unknown as ConstructorParameters<typeof RealDate>));
    }

    static now() {
      return fixedTime;
    }
  }

  globalThis.Date = MockDate as unknown as DateConstructor;

  try {
    return run();
  } finally {
    globalThis.Date = RealDate;
  }
}

test('home feed returns ordered semantic spotlights with action wiring and semantic fields', () => {
  const feed = getHomeFeed('2026-04-07');

  assert.equal(feed.spotlights.length, 2);
  assert.deepEqual(
    feed.spotlights.map((item) => item.type),
    [HomeSpotlightType.AlbumPreview, HomeSpotlightType.TourOngoing]
  );
  assert.deepEqual(feed.spotlights[0], {
    id: 'spotlight_album_midnights_album_preview',
    type: HomeSpotlightType.AlbumPreview,
    entityId: 'album_midnights',
    name: 'Midnights',
    cover: '/assets/images/albums/album-midnights.png',
    startAt: getLocalDayTimestamp(2026, 4, 1),
    endAt: getLocalDayTimestamp(2026, 4, 29),
    action: {
      type: 'navigateTo',
      route: ROUTES.album,
      query: 'id=album_midnights'
    }
  });
  assert.deepEqual(feed.spotlights[1], {
    id: `spotlight_${TOUR_IDS.eras}_tour_ongoing`,
    type: HomeSpotlightType.TourOngoing,
    entityId: TOUR_IDS.eras,
    name: 'The Eras Tour',
    cover: '/assets/images/ui/avatar-placeholder.png',
    startAt: getLocalDayTimestamp(2026, 3, 1),
    endAt: getLocalDayTimestamp(2026, 8, 30),
    action: {
      type: 'navigateTo',
      route: ROUTES.tourDetail,
      query: `id=${TOUR_IDS.eras}`
    }
  });
  assert.equal(feed.eras.length, 7);
  assert.equal(feed.news.length, 3);
  assert.equal(feed.news[0]?.id, 'news_1');
  assert.equal(typeof feed.news[0]?.publishedAt, 'number');
  assert.equal(feed.news[0]?.action.route, ROUTES.tourDetail);
  assert.equal(feed.news[0]?.action.query, `id=${TOUR_IDS.eras}`);
});

test('home feed honors announcement day and tour start day boundaries', () => {
  const feed = getHomeFeed('2026-04-01');

  assert.deepEqual(feed.spotlights.map((item) => item.type), [
    HomeSpotlightType.AlbumPreview,
    HomeSpotlightType.TourOngoing
  ]);
  assert.equal(feed.spotlights[0]?.entityId, 'album_midnights');
  assert.equal(feed.spotlights[0]?.cover, '/assets/images/albums/album-midnights.png');
  assert.equal(feed.spotlights[0]?.startAt, getLocalDayTimestamp(2026, 4, 1));
  assert.equal(feed.spotlights[0]?.endAt, getLocalDayTimestamp(2026, 4, 29));
  assert.equal(feed.spotlights[0]?.action.route, ROUTES.album);
  assert.equal(feed.spotlights[0]?.action.query, 'id=album_midnights');
  assert.equal(feed.spotlights[1]?.entityId, TOUR_IDS.eras);
  assert.equal(feed.spotlights[1]?.cover, '/assets/images/ui/avatar-placeholder.png');
  assert.equal(feed.spotlights[1]?.startAt, getLocalDayTimestamp(2026, 3, 1));
  assert.equal(feed.spotlights[1]?.endAt, getLocalDayTimestamp(2026, 8, 30));
  assert.equal(feed.spotlights[1]?.action.route, ROUTES.tourDetail);
  assert.equal(feed.spotlights[1]?.action.query, `id=${TOUR_IDS.eras}`);
});

test('home feed honors release day, release-week end, and the day after release week', () => {
  const releaseDay = getHomeFeed('2026-04-30');
  const releaseWeekEnd = getHomeFeed('2026-05-06');
  const dayAfterReleaseWeek = getHomeFeed('2026-05-07');

  assert.deepEqual(releaseDay.spotlights.map((item) => item.type), [
    HomeSpotlightType.AlbumReleaseWeek,
    HomeSpotlightType.TourOngoing
  ]);
  assert.deepEqual(releaseWeekEnd.spotlights.map((item) => item.type), [
    HomeSpotlightType.AlbumReleaseWeek,
    HomeSpotlightType.TourOngoing
  ]);
  assert.deepEqual(dayAfterReleaseWeek.spotlights.map((item) => item.type), [
    HomeSpotlightType.TourOngoing
  ]);
  assert.equal(dayAfterReleaseWeek.spotlights[0]?.startAt, getLocalDayTimestamp(2026, 3, 1));
  assert.equal(dayAfterReleaseWeek.spotlights[0]?.endAt, getLocalDayTimestamp(2026, 8, 30));
});

test('home feed uses preview end dates that stop the day before launch', () => {
  const previousAlbumAnnouncementAt = albums[6]?.announcementAt;
  const previousTourAnnouncementAt = tours[0]?.announcementAt;

  if (albums[6]) {
    albums[6].announcementAt = getLocalDayTimestamp(2026, 1, 15);
  }
  if (tours[0]) {
    tours[0].announcementAt = getLocalDayTimestamp(2026, 1, 15);
  }

  try {
    const feed = getHomeFeed('2026-01-15');

    assert.deepEqual(feed.spotlights.map((item) => item.type), [
      HomeSpotlightType.AlbumPreview,
      HomeSpotlightType.TourPreview
    ]);
    assert.equal(feed.spotlights[0]?.endAt, getLocalDayTimestamp(2026, 4, 29));
    assert.equal(feed.spotlights[1]?.endAt, getLocalDayTimestamp(2026, 2, 28));
  } finally {
    if (albums[6]) {
      albums[6].announcementAt = previousAlbumAnnouncementAt;
    }
    if (tours[0]) {
      tours[0].announcementAt = previousTourAnnouncementAt;
    }
  }
});

test('home feed orders same-startDate spotlights using the fallback priority branch', () => {
  const previousAlbumAnnouncementAt = albums[6]?.announcementAt;
  const previousTourAnnouncementAt = tours[0]?.announcementAt;

  if (albums[6]) {
    albums[6].announcementAt = getLocalDayTimestamp(2026, 1, 15);
  }
  if (tours[0]) {
    tours[0].announcementAt = getLocalDayTimestamp(2026, 1, 15);
  }

  try {
    const feed = getHomeFeed('2026-01-15');

    assert.deepEqual(feed.spotlights.map((item) => item.type), [
      HomeSpotlightType.AlbumPreview,
      HomeSpotlightType.TourPreview
    ]);
  } finally {
    if (albums[6]) {
      albums[6].announcementAt = previousAlbumAnnouncementAt;
    }
    if (tours[0]) {
      tours[0].announcementAt = previousTourAnnouncementAt;
    }
  }
});

test('home feed honors tour end day and turns empty after the active windows pass', () => {
  const tourEndDay = getHomeFeed('2026-08-30');
  const inactiveDay = getHomeFeed('2027-01-01');

  assert.deepEqual(tourEndDay.spotlights.map((item) => item.type), [
    HomeSpotlightType.TourOngoing
  ]);
  assert.equal(tourEndDay.spotlights[0]?.entityId, TOUR_IDS.eras);
  assert.equal(inactiveDay.spotlights.length, 0);
});

test('home news selector respects an explicit limit and keeps descending date order', () => {
  const news = getHomeNews(2);

  assert.equal(news.length, 2);
  assert.deepEqual(
    news.map((item) => item.id),
    ['news_1', 'news_2']
  );
});

test('home news selector returns shallow copies so page consumers cannot mutate source records', () => {
  const news = getHomeNews(1);

  assert.ok(news[0]);
  assert.notEqual(news[0], undefined);
  news[0]!.title = 'mutated title';
  news[0]!.action.route = ROUTES.album;

  assert.equal(news[0]!.title, 'mutated title');
  assert.equal(newsItems[0]?.title, 'Taylor Swift 粉丝周边展即将开启');
  assert.equal(newsItems[0]?.action.route, ROUTES.tourDetail);
});

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

test('home selectors return shallow copies so page consumers cannot mutate source records', () => {
  const feed = getHomeFeed('2026-04-07');
  const spotlight = feed.spotlights[0];
  const freshSpotlight = getHomeFeed('2026-04-07').spotlights[0];
  const eras = getHomeEras();

  assert.ok(spotlight);
  assert.notEqual(spotlight, freshSpotlight);
  spotlight!.action.route = ROUTES.library;
  assert.equal(freshSpotlight?.action.route, ROUTES.album);
  assert.notEqual(eras[0], undefined);
  assert.notEqual(eras[0], getHomeEras()[0]);
});

test('home feed uses local-calendar-safe default date derivation when no date is passed', () => {
  const feed = withMockedDate('2026-04-06T16:30:00Z', () => getHomeFeed());

  assert.deepEqual(feed.spotlights.map((item) => item.type), [
    HomeSpotlightType.AlbumPreview,
    HomeSpotlightType.TourOngoing
  ]);
  assert.equal(feed.spotlights[0]?.startAt, getLocalDayTimestamp(2026, 4, 1));
  assert.equal(feed.spotlights[0]?.endAt, getLocalDayTimestamp(2026, 4, 29));
});

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

test('home page refreshes spotlight cards with mapped display copy and goAction keeps routing behavior', async () => {
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
      eras: unknown[];
      news: unknown[];
    };
    setData: (patch: Partial<HomePageConfig['data']>) => void;
    onShow: () => void | Promise<void>;
    refreshFeed: () => Promise<void>;
    goAction: (event: { currentTarget: { dataset: Record<string, unknown> } }) => void;
  };

  const RealDate = Date;
  let currentTime = new RealDate('2026-04-30T08:00:00Z').getTime();

  class MockDate extends RealDate {
    constructor(...args: never[]) {
      if (args.length === 0) {
        super(currentTime);
        return;
      }

      super(...(args as unknown as ConstructorParameters<typeof RealDate>));
    }

    static now() {
      return currentTime;
    }
  }

  let pageConfig:
    | HomePageConfig
    | undefined;
  const requestUrls: string[] = [];
  const remoteFeed = {
    spotlights: [
      {
        id: 'spotlight_album_midnights_album_release_week',
        type: HomeSpotlightType.AlbumReleaseWeek,
        entityId: 'album_midnights',
        name: 'Midnights',
        cover: '/assets/images/albums/album-midnights.png',
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
        cover: '/assets/images/albums/album-midnights.png',
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

  (globalThis as typeof globalThis & {
    Date?: DateConstructor;
    Page?: unknown;
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
  }).Date = MockDate as unknown as DateConstructor;
  const switchTabCalls: Array<{ url: string }> = [];
  const navigateToCalls: Array<{ url: string }> = [];

  (globalThis as typeof globalThis & {
    Page?: unknown;
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
  }).Page = ((config: HomePageConfig) => {
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
    await import(new URL('../pages/home/index.ts?home-page-test', import.meta.url).href);

    assert.ok(pageConfig);
    pageConfig.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };
    await pageConfig.refreshFeed();

    assert.equal(requestUrls.length, 1);
    assert.match(requestUrls[0] ?? '', /\/home$/);
    assert.deepEqual(pageConfig.data.spotlights.map((item) => item.eyebrow), ['NEW RELEASE']);
    assert.equal(pageConfig.data.spotlights[0]?.title, 'Midnights 发布中');
    assert.equal(pageConfig.data.spotlights[0]?.ctaText, '查看专辑');
    assert.equal((pageConfig.data.news[0] as { title?: string } | undefined)?.title, 'Remote Home Feed');

    assert.equal(Object.prototype.hasOwnProperty.call(pageConfig.data, 'spotlight'), false);

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
    globalThis.Date = RealDate;
  }
});
