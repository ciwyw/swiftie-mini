import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('profile template exposes only wechat profile sync entry', () => {
  const template = readFileSync(new URL('../pages/profile/index.wxml', import.meta.url), 'utf8');

  assert.doesNotMatch(template, /open-type="chooseAvatar"/);
  assert.doesNotMatch(template, /bindchooseavatar="onChooseAvatar"/);
  assert.doesNotMatch(template, /type="nickname"/);
  assert.doesNotMatch(template, /bindblur="onNickNameBlur"/);
  assert.match(template, /bindtap="onSyncWechatProfile"/);
  assert.match(template, /同步微信资料/);
});

test('profile page controller registers wechat sync handler and syncs profile data', async () => {
  type ProfilePageConfig = {
    data: {
      profile: {
        avatarUrl: string;
        nickName: string;
      };
      hasWechatProfile: boolean;
    };
    onSyncWechatProfile?: (this: {
      data: {
        profile: {
          avatarUrl: string;
          nickName: string;
        };
        hasWechatProfile: boolean;
      };
      setData(nextData: Partial<ProfilePageConfig['data']>): void;
    }) => void;
    onChooseAvatar?: unknown;
    onNickNameBlur?: unknown;
  };

  let pageConfig: ProfilePageConfig | undefined;
  const storage = new Map<string, unknown>();
  const app = {
    globalData: {
      userProfile: {
        avatarUrl: '/assets/images/ui/avatar-placeholder.png',
        nickName: 'Swiftie'
      }
    }
  };

  (globalThis as typeof globalThis & { Page?: unknown }).Page = ((config: ProfilePageConfig) => {
    pageConfig = config;
  }) as unknown as typeof Page;

  (globalThis as typeof globalThis & { getApp?: unknown }).getApp = (() => app) as typeof getApp;
  (globalThis as typeof globalThis & { wx?: unknown }).wx = {
    navigateTo() {
      return undefined;
    },
    switchTab() {
      return undefined;
    },
    getStorageSync(key: string) {
      return storage.get(key);
    },
    setStorageSync(key: string, data: unknown) {
      storage.set(key, data);
    },
    showToast() {
      return undefined;
    },
    getUserProfile(options: {
      desc: string;
      success?: (result: {
        userInfo: {
          avatarUrl: string;
          nickName: string;
        };
      }) => void;
    }) {
      options.success?.({
        userInfo: {
          avatarUrl: 'https://wx.example/avatar.png',
          nickName: 'Taylor Fan'
        }
      });
    }
  } as unknown as typeof wx;

  try {
    await import(new URL('../pages/profile/index.ts?profile-page-test', import.meta.url).href);

    assert.ok(pageConfig);
    assert.equal(typeof pageConfig.onSyncWechatProfile, 'function');
    assert.equal('onChooseAvatar' in pageConfig, false);
    assert.equal('onNickNameBlur' in pageConfig, false);

    const instance = {
      data: structuredClone(pageConfig.data),
      setData(nextData: Partial<ProfilePageConfig['data']>) {
        this.data = {
          ...this.data,
          ...nextData
        };
      }
    };

    const syncWechatProfile = pageConfig.onSyncWechatProfile;
    assert.equal(typeof syncWechatProfile, 'function');
    syncWechatProfile!.call(instance);

    assert.deepEqual(instance.data.profile, {
      avatarUrl: 'https://wx.example/avatar.png',
      nickName: 'Taylor Fan'
    });
    assert.equal(instance.data.hasWechatProfile, true);
    assert.deepEqual(storage.get('userProfileCache'), {
      avatarUrl: 'https://wx.example/avatar.png',
      nickName: 'Taylor Fan'
    });
    assert.deepEqual(app.globalData.userProfile, {
      avatarUrl: 'https://wx.example/avatar.png',
      nickName: 'Taylor Fan'
    });
  } finally {
    delete (globalThis as { Page?: unknown }).Page;
    delete (globalThis as { getApp?: unknown }).getApp;
    delete (globalThis as { wx?: unknown }).wx;
  }
});
