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
    startDate: '2026-04-01',
    endDate: '2026-04-29',
    action: {
      type: 'navigateTo',
      route: ROUTES.album,
      query: 'id=album_midnights'
    }
  });
  assert.deepEqual(feed.spotlights[1], {
    id: 'spotlight_tour_eras_tour_ongoing',
    type: HomeSpotlightType.TourOngoing,
    entityId: 'tour_eras',
    name: 'The Eras Tour',
    cover: '/assets/images/ui/avatar-placeholder.png',
    startDate: '2026-03-01',
    endDate: '2026-08-30',
    action: {
      type: 'navigateTo',
      route: ROUTES.tourDetail,
      query: 'id=tour_eras'
    }
  });
  assert.equal(feed.eras.length, 7);
  assert.equal(feed.news.length, 3);
  assert.equal(feed.news[0]?.id, 'news_1');
  assert.equal(feed.news[0]?.action.route, ROUTES.tourDetail);
  assert.equal(feed.news[0]?.action.query, 'id=tour_eras');
});

test('home feed honors announcement day and tour start day boundaries', () => {
  const feed = getHomeFeed('2026-04-01');

  assert.deepEqual(feed.spotlights.map((item) => item.type), [
    HomeSpotlightType.AlbumPreview,
    HomeSpotlightType.TourOngoing
  ]);
  assert.equal(feed.spotlights[0]?.entityId, 'album_midnights');
  assert.equal(feed.spotlights[0]?.cover, '/assets/images/albums/album-midnights.png');
  assert.equal(feed.spotlights[0]?.startDate, '2026-04-01');
  assert.equal(feed.spotlights[0]?.endDate, '2026-04-29');
  assert.equal(feed.spotlights[0]?.action.route, ROUTES.album);
  assert.equal(feed.spotlights[0]?.action.query, 'id=album_midnights');
  assert.equal(feed.spotlights[1]?.entityId, 'tour_eras');
  assert.equal(feed.spotlights[1]?.cover, '/assets/images/ui/avatar-placeholder.png');
  assert.equal(feed.spotlights[1]?.startDate, '2026-03-01');
  assert.equal(feed.spotlights[1]?.endDate, '2026-08-30');
  assert.equal(feed.spotlights[1]?.action.route, ROUTES.tourDetail);
  assert.equal(feed.spotlights[1]?.action.query, 'id=tour_eras');
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
  assert.equal(dayAfterReleaseWeek.spotlights[0]?.startDate, '2026-03-01');
  assert.equal(dayAfterReleaseWeek.spotlights[0]?.endDate, '2026-08-30');
});

test('home feed uses preview end dates that stop the day before launch', () => {
  const previousAlbumAnnouncementDate = albums[6]?.announcementDate;
  const previousTourAnnouncementDate = tours[0]?.announcementDate;

  if (albums[6]) {
    albums[6].announcementDate = '2026-01-15';
  }
  if (tours[0]) {
    tours[0].announcementDate = '2026-01-15';
  }

  try {
    const feed = getHomeFeed('2026-01-15');

    assert.deepEqual(feed.spotlights.map((item) => item.type), [
      HomeSpotlightType.AlbumPreview,
      HomeSpotlightType.TourPreview
    ]);
    assert.equal(feed.spotlights[0]?.endDate, '2026-04-29');
    assert.equal(feed.spotlights[1]?.endDate, '2026-02-28');
  } finally {
    if (albums[6]) {
      albums[6].announcementDate = previousAlbumAnnouncementDate;
    }
    if (tours[0]) {
      tours[0].announcementDate = previousTourAnnouncementDate;
    }
  }
});

test('home feed orders same-startDate spotlights using the fallback priority branch', () => {
  const previousAlbumAnnouncementDate = albums[6]?.announcementDate;
  const previousTourAnnouncementDate = tours[0]?.announcementDate;

  if (albums[6]) {
    albums[6].announcementDate = '2026-01-15';
  }
  if (tours[0]) {
    tours[0].announcementDate = '2026-01-15';
  }

  try {
    const feed = getHomeFeed('2026-01-15');

    assert.deepEqual(feed.spotlights.map((item) => item.type), [
      HomeSpotlightType.AlbumPreview,
      HomeSpotlightType.TourPreview
    ]);
  } finally {
    if (albums[6]) {
      albums[6].announcementDate = previousAlbumAnnouncementDate;
    }
    if (tours[0]) {
      tours[0].announcementDate = previousTourAnnouncementDate;
    }
  }
});

test('home feed honors tour end day and turns empty after the active windows pass', () => {
  const tourEndDay = getHomeFeed('2026-08-30');
  const inactiveDay = getHomeFeed('2027-01-01');

  assert.deepEqual(tourEndDay.spotlights.map((item) => item.type), [
    HomeSpotlightType.TourOngoing
  ]);
  assert.equal(tourEndDay.spotlights[0]?.entityId, 'tour_eras');
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
  assert.equal(feed.spotlights[0]?.startDate, '2026-04-01');
  assert.equal(feed.spotlights[0]?.endDate, '2026-04-29');
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
    onShow: () => void;
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

  (globalThis as typeof globalThis & {
    Date?: DateConstructor;
    Page?: unknown;
    wx?: {
      switchTab: (options: { url: string }) => void;
      navigateTo: (options: { url: string }) => void;
    };
  }).Date = MockDate as unknown as DateConstructor;
  const switchTabCalls: Array<{ url: string }> = [];
  const navigateToCalls: Array<{ url: string }> = [];

  (globalThis as typeof globalThis & {
    Page?: unknown;
    wx?: {
      switchTab: (options: { url: string }) => void;
      navigateTo: (options: { url: string }) => void;
    };
  }).Page = ((config: HomePageConfig) => {
    pageConfig = config;
  }) as unknown as typeof Page;

  (globalThis as typeof globalThis & {
    wx?: {
      switchTab: (options: { url: string }) => void;
      navigateTo: (options: { url: string }) => void;
    };
  }).wx = {
    switchTab: (options) => {
      switchTabCalls.push(options);
    },
    navigateTo: (options) => {
      navigateToCalls.push(options);
    }
  };

  try {
    await import(new URL('../pages/home/index.ts?home-page-test', import.meta.url).href);

    assert.ok(pageConfig);
    pageConfig.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };
    pageConfig.onShow();

    assert.deepEqual(pageConfig.data.spotlights.map((item) => item.eyebrow), [
      'NEW RELEASE',
      'ON TOUR'
    ]);
    assert.equal(pageConfig.data.spotlights[0]?.title, 'Midnights 发布中');
    assert.equal(pageConfig.data.spotlights[0]?.ctaText, '查看专辑');

    currentTime = new RealDate('2026-01-15T08:00:00Z').getTime();
    pageConfig.onShow();

    assert.deepEqual(pageConfig.data.spotlights.map((item) => item.eyebrow), ['ON TOUR SOON']);
    assert.equal(pageConfig.data.spotlights[0]?.title, 'The Eras Tour 即将开始');
    assert.equal(pageConfig.data.spotlights[0]?.ctaText, '查看巡演');

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
          query: 'tourId=tour_eras'
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

    assert.deepEqual(navigateToCalls, [{ url: `${ROUTES.guide}?tourId=tour_eras` }]);
    assert.deepEqual(switchTabCalls, [{ url: ROUTES.tour }]);
  } finally {
    delete (globalThis as { Page?: unknown }).Page;
    delete (globalThis as { wx?: unknown }).wx;
    globalThis.Date = RealDate;
  }
});
