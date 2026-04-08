import { ROUTES } from '../utils/constants';
import { NewsItem } from '../types/news';

function localDayTimestamp(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getTime();
}

export const newsItems: NewsItem[] = [
  {
    id: 'news_1',
    title: 'Taylor Swift 粉丝周边展即将开启',
    publishedAt: localDayTimestamp(2026, 3, 20),
    summary: '本地主题快闪活动公布了专辑主题展区与打卡环节。',
    tag: '活动',
    action: {
      type: 'navigateTo',
      route: ROUTES.tourDetail,
      query: 'id=tour_eras'
    }
  },
  {
    id: 'news_2',
    title: '经典歌词解析专题上线',
    publishedAt: localDayTimestamp(2026, 3, 18),
    summary: '本周更新 Fearless 与 Red 时代代表歌曲逐句解析。',
    tag: '内容',
    action: {
      type: 'navigateTo',
      route: ROUTES.album,
      query: 'id=album_fearless'
    }
  },
  {
    id: 'news_3',
    title: 'Swiftie 新手入门指南发布',
    publishedAt: localDayTimestamp(2026, 3, 15),
    summary: '整理了专辑时间线与巡演脉络，方便新粉快速了解。',
    tag: '指南',
    action: {
      type: 'switchTab',
      route: ROUTES.library
    }
  }
];
