import { HomeAction, HomeEraCard, HomeSpotlight, HomeSpotlightType } from '../../types/home';
import { NewsItem } from '../../types/news';
import { loadHomeFeed } from '../../services/contentStore';

interface HomeSpotlightDisplay {
  id: string;
  type: HomeSpotlightType;
  cover: string;
  eyebrow: string;
  title: string;
  summary: string;
  ctaText: string;
  action: HomeAction;
}

interface HomeData {
  spotlights: HomeSpotlightDisplay[];
  eras: HomeEraCard[];
  news: Array<NewsItem & { dateText: string }>;
  isLoading: boolean;
  loadError: boolean;
}

interface HomeActionDataset {
  type?: string;
  route?: HomeAction['route'];
  query?: HomeAction['query'];
}

function getHomeSpotlightDisplay(spotlight: HomeSpotlight): HomeSpotlightDisplay {
  switch (spotlight.type) {
    case HomeSpotlightType.AlbumPreview:
      return {
        id: spotlight.id,
        type: spotlight.type,
        cover: spotlight.cover,
        eyebrow: 'ALBUM TEASER',
        title: `${spotlight.name} 即将发布`,
        summary: '查看专辑信息与相关内容入口。',
        ctaText: '查看专辑',
        action: { ...spotlight.action }
      };
    case HomeSpotlightType.AlbumReleaseWeek:
      return {
        id: spotlight.id,
        type: spotlight.type,
        cover: spotlight.cover,
        eyebrow: 'NEW RELEASE',
        title: `${spotlight.name} 发布中`,
        summary: '发布首周快捷入口，快速进入专辑页。',
        ctaText: '查看专辑',
        action: { ...spotlight.action }
      };
    case HomeSpotlightType.TourPreview:
      return {
        id: spotlight.id,
        type: spotlight.type,
        cover: spotlight.cover,
        eyebrow: 'ON TOUR SOON',
        title: `${spotlight.name} 即将开始`,
        summary: '查看巡演信息、场次安排与详情入口。',
        ctaText: '查看巡演',
        action: { ...spotlight.action }
      };
    case HomeSpotlightType.TourOngoing:
      return {
        id: spotlight.id,
        type: spotlight.type,
        cover: spotlight.cover,
        eyebrow: 'ON TOUR',
        title: `${spotlight.name} 进行中`,
        summary: '查看巡演进度、场次状态与快捷入口。',
        ctaText: '查看巡演',
        action: { ...spotlight.action }
      };
    default:
      return assertNever(spotlight.type);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled home spotlight type: ${value}`);
}

function formatDay(timestamp: number): string {
  const value = new Date(timestamp);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

Page({
  data: {
    spotlights: [],
    eras: [],
    news: [],
    isLoading: false,
    loadError: false
  } as HomeData,

  onShow() {
    return this.refreshFeed();
  },

  async refreshFeed() {
    this.setData({ isLoading: true, loadError: false });

    try {
      const { spotlights, eras, news } = await loadHomeFeed();

      this.setData({
        spotlights: spotlights.map(getHomeSpotlightDisplay),
        eras,
        news: news.map((item) => ({
          ...item,
          dateText: formatDay(item.publishedAt)
        })),
        isLoading: false,
        loadError: false
      });
    } catch {
      this.setData({
        spotlights: [],
        eras: [],
        news: [],
        isLoading: false,
        loadError: true
      });
    }
  },

  goAction(event: { currentTarget: { dataset: HomeActionDataset } }) {
    const { type, route, query } = event.currentTarget.dataset;

    if (!route) {
      return;
    }

    if (type === 'switchTab') {
      wx.switchTab({ url: route });
      return;
    }

    if (type !== 'navigateTo') {
      return;
    }

    wx.navigateTo({
      url: query ? `${route}?${query}` : route
    });
  }
});
