import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clearContentStoreCache } from '../services/contentStore';
import {
  getGuideChecklistByTourId,
  toggleGuideChecklistItem
} from '../utils/storage';
import { ROUTES } from '../utils/constants';

const TOUR_IDS = {
  eras: '48291357',
  reputation: '73160584'
} as const;

const storage = new Map<string, unknown>();

beforeEach(() => {
  storage.clear();
  clearContentStoreCache();
});

(globalThis as unknown as { wx: typeof wx }).wx = {
  navigateTo() {},
  switchTab() {},
  showToast() {},
  getStorageSync(key: string) {
    return storage.get(key);
  },
  setStorageSync(key: string, data: unknown) {
    storage.set(key, data);
  }
};

test('toggleGuideChecklistItem stores ids per tour bucket', () => {
  assert.deepEqual(getGuideChecklistByTourId(TOUR_IDS.eras), []);
  assert.deepEqual(
    toggleGuideChecklistItem(TOUR_IDS.eras, 'register_account'),
    ['register_account']
  );
  assert.deepEqual(toggleGuideChecklistItem(TOUR_IDS.eras, 'register_account'), []);
});

test('tour index page loads active and timeline tours from remote interfaces', async () => {
  type TourIndexPageConfig = {
    data: {
      activeTour: { id: string; cover: string } | null;
      timelineTours: Array<{ id: string; cover: string }>;
      isLoading: boolean;
      loadError: boolean;
    };
    setData: (patch: Partial<TourIndexPageConfig['data']>) => void;
    onLoad: () => void | Promise<void>;
    goDetail: (event: { currentTarget: { dataset: { id: string } } }) => void;
  };

  let pageConfig: TourIndexPageConfig | undefined;
  const navigateToCalls: Array<{ url: string }> = [];
  const requestUrls: string[] = [];

  (globalThis as typeof globalThis & { Page?: unknown }).Page = ((config: TourIndexPageConfig) => {
    pageConfig = config;
  }) as unknown as typeof Page;
  (globalThis as typeof globalThis & { wx?: unknown }).wx = {
    ...(globalThis as unknown as { wx: typeof wx }).wx,
    navigateTo(options: { url: string }) {
      navigateToCalls.push(options);
    },
    request(options: {
      url: string;
      success: (result: { statusCode: number; data: unknown }) => void;
      fail: (error: Error) => void;
    }) {
      requestUrls.push(options.url);
      options.success({
        statusCode: 200,
        data: {
          code: 0,
          data: [
            {
              id: TOUR_IDS.eras,
              name: 'The Eras Tour',
              status: 1,
              cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/ui/avatar-placeholder.png',
              description: 'ongoing',
              startAt: Date.UTC(2026, 2, 1),
              endAt: Date.UTC(2026, 7, 30),
              total: 152,
              cancelled: 3,
              albumIds: [],
              setlists: []
            },
            {
              id: TOUR_IDS.reputation,
              name: 'Reputation Stadium Tour',
              status: 2,
              cover: 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev/assets/images/ui/avatar-placeholder.png',
              description: 'ended',
              startAt: Date.UTC(2018, 4, 8),
              endAt: Date.UTC(2018, 10, 21),
              total: 53,
              cancelled: 0,
              albumIds: [],
              setlists: []
            }
          ]
        }
      });
    }
  } as unknown as typeof wx;

  try {
    await import(new URL('../pages/tour/index.ts?tour-index-page-test', import.meta.url).href);

    assert.ok(pageConfig);
    pageConfig.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };
    await pageConfig.onLoad.call(pageConfig);

    assert.equal(requestUrls.length, 1);
    assert.match(requestUrls[0] ?? '', /\/tours$/);
    assert.equal(pageConfig.data.activeTour?.id, TOUR_IDS.eras);
    assert.equal(pageConfig.data.timelineTours[0]?.id, TOUR_IDS.reputation);
    assert.equal(pageConfig.data.isLoading, false);
    assert.equal(pageConfig.data.loadError, false);

    pageConfig.goDetail({ currentTarget: { dataset: { id: TOUR_IDS.eras } } });
    assert.deepEqual(navigateToCalls, [{ url: `${ROUTES.tourDetail}?id=${TOUR_IDS.eras}` }]);
  } finally {
    delete (globalThis as { Page?: unknown }).Page;
  }
});

test('tour detail template no longer renders rangeLabel', () => {
  const template = readFileSync(new URL('../pages/tour/detail/index.wxml', import.meta.url), 'utf8');

  assert.doesNotMatch(template, /tour\.rangeLabel/);
});

test('tour index template no longer renders timeline year labels', () => {
  const template = readFileSync(new URL('../pages/tour/index.wxml', import.meta.url), 'utf8');

  assert.doesNotMatch(template, /timeline-year/);
  assert.doesNotMatch(template, /timelineLabel/);
});
