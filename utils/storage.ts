import { DEFAULT_USER_PROFILE, STORAGE_KEYS } from './constants';

export interface UserProfileCache {
  avatarUrl: string;
  nickName: string;
}

type GuideChecklistMap = Record<string, string[]>;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isUserProfileCache(value: unknown): value is UserProfileCache {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const profile = value as Partial<UserProfileCache>;
  return typeof profile.avatarUrl === 'string' && typeof profile.nickName === 'string';
}

export function getFavoriteSongIds(): string[] {
  const value = wx.getStorageSync<unknown>(STORAGE_KEYS.favoriteSongIds);
  return isStringArray(value) ? value : [];
}

export function setFavoriteSongIds(ids: string[]): void {
  wx.setStorageSync(STORAGE_KEYS.favoriteSongIds, ids);
}

export function toggleFavoriteSong(id: string): string[] {
  const currentIds = getFavoriteSongIds();
  const exists = currentIds.includes(id);
  const next = exists ? currentIds.filter((item) => item !== id) : [...currentIds, id];
  setFavoriteSongIds(next);
  return next;
}

export function getUserProfileCache(): UserProfileCache {
  const value = wx.getStorageSync<unknown>(STORAGE_KEYS.userProfileCache);
  return isUserProfileCache(value) ? value : DEFAULT_USER_PROFILE;
}

export function setUserProfileCache(profile: UserProfileCache): void {
  wx.setStorageSync(STORAGE_KEYS.userProfileCache, profile);
}

export function getGuideChecklistMap(): GuideChecklistMap {
  const value = wx.getStorageSync<unknown>(STORAGE_KEYS.tourGuideChecklist);
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<GuideChecklistMap>(
    (acc, [tourId, ids]) => {
      acc[tourId] = isStringArray(ids) ? ids : [];
      return acc;
    },
    {}
  );
}

export function getGuideChecklistByTourId(tourId: string): string[] {
  return getGuideChecklistMap()[tourId] ?? [];
}

export function toggleGuideChecklistItem(tourId: string, itemId: string): string[] {
  const currentMap = getGuideChecklistMap();
  const currentItems = currentMap[tourId] ?? [];
  const nextItems = currentItems.includes(itemId)
    ? currentItems.filter((id) => id !== itemId)
    : [...currentItems, itemId];

  wx.setStorageSync(STORAGE_KEYS.tourGuideChecklist, {
    ...currentMap,
    [tourId]: nextItems
  });

  return nextItems;
}
