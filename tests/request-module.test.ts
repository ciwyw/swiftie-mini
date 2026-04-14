import test from 'node:test';
import assert from 'node:assert/strict';
import {
  request,
  resetApiBaseUrlForTesting,
  setApiBaseUrlForTesting
} from '../services/request';

type RequestOptions = {
  url: string;
  method?: string;
  timeout?: number;
  success: (response: { statusCode: number; data: unknown }) => void;
  fail: (error: { errMsg?: string }) => void;
};

const runtimeGlobal = globalThis as typeof globalThis & {
  wx?: {
    request: (options: RequestOptions) => void;
  };
};

test('request uses the deployed worker URL by default', async () => {
  let requestedUrl = '';

  runtimeGlobal.wx = {
    request(options: RequestOptions) {
      requestedUrl = options.url;
      options.success({ statusCode: 200, data: { code: 0, data: { ok: true } } });
    }
  };

  resetApiBaseUrlForTesting();
  await request<{ ok: boolean }>('/health');

  assert.equal(requestedUrl, 'https://swiftie-mini-server.ciwywi9649.workers.dev/health');
});

test('request testing override can replace and then restore the API base URL', async () => {
  const requestedUrls: string[] = [];

  runtimeGlobal.wx = {
    request(options: RequestOptions) {
      requestedUrls.push(options.url);
      options.success({ statusCode: 200, data: { code: 0, data: { ok: true } } });
    }
  };

  setApiBaseUrlForTesting('https://example.com/');
  await request<{ ok: boolean }>('/health');

  resetApiBaseUrlForTesting();
  await request<{ ok: boolean }>('/health');

  assert.deepEqual(requestedUrls, [
    'https://example.com/health',
    'https://swiftie-mini-server.ciwywi9649.workers.dev/health'
  ]);
});

test('request passes API response data through without rewriting image fields', async () => {
  runtimeGlobal.wx = {
    request(options: RequestOptions) {
      options.success({
        statusCode: 200,
        data: {
          code: 0,
          data: {
            cover: '/assets/images/albums/album-midnights.png',
            nested: {
              image: '/assets/images/ui/avatar-placeholder.png',
              avatarUrl: 'https://wx.example/avatar.png'
            },
            seatMapImages: ['/assets/images/ui/avatar-placeholder.png']
          }
        }
      });
    }
  };

  const response = await request<{
    cover: string;
    nested: {
      image: string;
      avatarUrl: string;
    };
    seatMapImages: string[];
  }>('/albums/album_midnights');

  assert.deepEqual(response, {
    cover: '/assets/images/albums/album-midnights.png',
    nested: {
      image: '/assets/images/ui/avatar-placeholder.png',
      avatarUrl: 'https://wx.example/avatar.png'
    },
    seatMapImages: ['/assets/images/ui/avatar-placeholder.png']
  });
});
