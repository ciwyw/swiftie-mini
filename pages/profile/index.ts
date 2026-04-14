import { DEFAULT_USER_PROFILE } from '../../utils/constants';
import { getUserProfileCache, setUserProfileCache } from '../../utils/storage';

interface UserProfile {
  avatarUrl: string;
  nickName: string;
}

interface ProfileData {
  profile: UserProfile;
  hasWechatProfile: boolean;
}

interface AppInstance {
  globalData: {
    userProfile: UserProfile;
  };
}

function checkHasWechatProfile(profile: UserProfile): boolean {
  return (
    profile.avatarUrl !== DEFAULT_USER_PROFILE.avatarUrl
    || profile.nickName !== DEFAULT_USER_PROFILE.nickName
  );
}

function syncAppProfile(profile: UserProfile): void {
  const app = getApp<AppInstance>();
  app.globalData.userProfile = profile;
}

Page({
  data: {
    profile: { ...DEFAULT_USER_PROFILE },
    hasWechatProfile: false
  } as ProfileData,

  onShow() {
    const profile = getUserProfileCache();
    this.setData({
      profile,
      hasWechatProfile: checkHasWechatProfile(profile)
    });
    syncAppProfile(profile);
  },

  onSyncWechatProfile() {
    if (!wx.getUserProfile) {
      wx.showToast({
        title: '当前环境不支持微信资料同步',
        icon: 'none'
      });
      return;
    }

    wx.getUserProfile({
      desc: '用于展示你的微信头像和昵称',
      success: ({ userInfo }) => {
        const profile = {
          avatarUrl: userInfo.avatarUrl,
          nickName: userInfo.nickName
        };

        this.setData({
          profile,
          hasWechatProfile: true
        });
        setUserProfileCache(profile);
        syncAppProfile(profile);
      },
      fail: () => {
        wx.showToast({
          title: '未获取到微信资料',
          icon: 'none'
        });
      }
    });
  }
});
