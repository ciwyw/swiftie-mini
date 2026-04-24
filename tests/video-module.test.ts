import test from 'node:test';
import assert from 'node:assert/strict';
import { clearContentStoreCache } from '../services/contentStore';
import { ROUTES } from '../utils/constants';

const VIDEO_PLAYER_ROUTE =
  (ROUTES as typeof ROUTES & { videoPlayer?: string }).videoPlayer ?? '/pages/video/player/index';

test('performance list page loads playable videos and navigates to the video player page', async () => {
  type PerformancePageConfig = {
    data: {
      performances: Array<{ id: string; eventName: string; duration: string }>;
      isLoading: boolean;
      loadError: boolean;
    };
    setData: (patch: Partial<PerformancePageConfig['data']>) => void;
    onLoad: () => void | Promise<void>;
    openPerformance: (event: { currentTarget: { dataset: { id: string } } }) => void;
  };

  let pageConfig: PerformancePageConfig | undefined;
  const navigateToCalls: Array<{ url: string }> = [];
  clearContentStoreCache();

  (globalThis as typeof globalThis & { Page?: unknown }).Page = ((config: PerformancePageConfig) => {
    pageConfig = config;
  }) as unknown as typeof Page;
  (globalThis as typeof globalThis & { wx?: unknown }).wx = {
    navigateTo(options: { url: string }) {
      navigateToCalls.push(options);
    },
    request(options: {
      url: string;
      success: (result: { statusCode: number; data: unknown }) => void;
      fail: (error: Error) => void;
    }) {
      if (options.url.endsWith('/performances')) {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: [
              {
                id: 'performance_red_cma_2013',
                title: 'Red',
                songIds: ['song_red'],
                eventName: 'The 47th Annual CMA Awards',
                duration: '03:28',
                videoUri: '/live/red-cma.mp4'
              }
            ]
          }
        });
        return;
      }

      options.fail(new Error(`Unhandled request: ${options.url}`));
    }
  } as unknown as typeof wx;

  await import(new URL('../pages/performance/index.ts?performance-page-test', import.meta.url).href);

  assert.ok(pageConfig);
  pageConfig.setData = function setData(patch) {
    this.data = { ...this.data, ...patch };
  };

  await pageConfig.onLoad.call(pageConfig);
  assert.deepEqual(
    pageConfig.data.performances.map((item) => ({
      id: item.id,
      eventName: item.eventName,
      duration: item.duration
    })),
    [
      {
        id: 'performance_red_cma_2013',
        eventName: 'The 47th Annual CMA Awards',
        duration: '03:28'
      }
    ]
  );

  pageConfig.openPerformance({ currentTarget: { dataset: { id: 'performance_red_cma_2013' } } });
  assert.deepEqual(navigateToCalls, [
    { url: `${VIDEO_PLAYER_ROUTE}?id=performance_red_cma_2013` }
  ]);
});

test('video player page loads one performance by id and exposes the remote mp4 url', async () => {
  type VideoPlayerPageConfig = {
    data: {
      performance: null | {
        id: string;
        title: string;
        eventName: string;
        duration: string;
        videoUrl: string;
      };
      currentPerformanceId: string;
      hasError: boolean;
      isLoading: boolean;
      loadError: boolean;
    };
    setData: (patch: Partial<VideoPlayerPageConfig['data']>) => void;
    onLoad: (options: { id?: string }) => void | Promise<void>;
    retryLoad: () => Promise<void>;
  };

  let pageConfig: VideoPlayerPageConfig | undefined;
  const requestUrls: string[] = [];
  clearContentStoreCache();

  (globalThis as typeof globalThis & { Page?: unknown }).Page = ((config: VideoPlayerPageConfig) => {
    pageConfig = config;
  }) as unknown as typeof Page;
  (globalThis as typeof globalThis & { wx?: unknown }).wx = {
    navigateTo() {},
    request(options: {
      url: string;
      success: (result: { statusCode: number; data: unknown }) => void;
      fail: (error: Error) => void;
    }) {
      requestUrls.push(options.url);
      if (options.url.endsWith('/performances/performance_red_cma_2013')) {
        options.success({
          statusCode: 200,
          data: {
            code: 0,
            data: {
              id: 'performance_red_cma_2013',
              title: 'Red',
              songIds: ['song_red'],
              eventName: 'The 47th Annual CMA Awards',
              duration: '03:28',
              videoUri: '/live/red-cma.mp4'
            }
          }
        });
        return;
      }

      options.fail(new Error(`Unhandled request: ${options.url}`));
    }
  } as unknown as typeof wx;

  await import(new URL('../pages/video/player/index.ts?video-player-page-test', import.meta.url).href);

  assert.ok(pageConfig);
  pageConfig.setData = function setData(patch) {
    this.data = { ...this.data, ...patch };
  };

  await pageConfig.onLoad.call(pageConfig, { id: 'performance_red_cma_2013' });
  assert.deepEqual(requestUrls.map((url) => url.replace(/^https?:\/\/[^/]+/, '')), ['/performances/performance_red_cma_2013']);
  assert.deepEqual(
    pageConfig.data.performance && {
      id: pageConfig.data.performance.id,
      title: pageConfig.data.performance.title,
      eventName: pageConfig.data.performance.eventName,
      duration: pageConfig.data.performance.duration,
      videoUrl: pageConfig.data.performance.videoUrl
    },
    {
      id: 'performance_red_cma_2013',
      title: 'Red',
      eventName: 'The 47th Annual CMA Awards',
      duration: '03:28',
      videoUrl: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/live/red-cma.mp4'
    }
  );
  assert.equal(pageConfig.data.currentPerformanceId, 'performance_red_cma_2013');
  assert.equal(pageConfig.data.hasError, false);
  assert.equal(pageConfig.data.isLoading, false);
  assert.equal(pageConfig.data.loadError, false);
});
