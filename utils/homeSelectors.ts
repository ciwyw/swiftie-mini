import { albums } from '../data/albums';
import { homeEraCards } from '../data/home';
import { newsItems } from '../data/news';
import { tours } from '../data/tours';
import { ROUTES } from '../utils/constants';
import { HomeAction, HomeEraCard, HomeFeed, HomeSpotlight, HomeSpotlightType } from '../types/home';
import { NewsItem } from '../types/news';
import { Album } from '../types/album';
import { Tour } from '../types/tour';

type HomeSpotlightPriority = Record<HomeSpotlightType, number>;

const HOME_SPOTLIGHT_PRIORITY: HomeSpotlightPriority = {
  [HomeSpotlightType.AlbumPreview]: 0,
  [HomeSpotlightType.TourPreview]: 1,
  [HomeSpotlightType.AlbumReleaseWeek]: 2,
  [HomeSpotlightType.TourOngoing]: 3
};

function getLocalDayTimestamp(input: string): number {
  const [year, month, day] = input.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).getTime();
}

function getTodayTimestamp(today?: string): number {
  if (today) {
    return getLocalDayTimestamp(today);
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function addDays(timestamp: number, days: number): number {
  const value = new Date(timestamp);
  value.setDate(value.getDate() + days);
  return value.getTime();
}

function isBetweenInclusive(today: number, startAt: number, endAt: number): boolean {
  return today >= startAt && today <= endAt;
}

function createAction(route: string, query: string): HomeAction {
  return {
    type: 'navigateTo',
    route,
    query
  };
}

function createAlbumSpotlight(
  album: Album,
  type: HomeSpotlightType,
  startAt: number,
  endAt: number
): HomeSpotlight {
  return {
    id: `spotlight_${album.id}_${type}`,
    type,
    entityId: album.id,
    name: album.name,
    cover: album.cover,
    startAt,
    endAt,
    action: createAction(ROUTES.album, `id=${album.id}`)
  };
}

function createTourSpotlight(
  tour: Tour,
  type: HomeSpotlightType,
  startAt: number,
  endAt: number
): HomeSpotlight {
  return {
    id: `spotlight_${tour.id}_${type}`,
    type,
    entityId: tour.id,
    name: tour.name,
    cover: tour.cover,
    startAt,
    endAt,
    action: createAction(ROUTES.tourDetail, `id=${tour.id}`)
  };
}

function getAlbumSpotlights(today: number): HomeSpotlight[] {
  return albums.flatMap((album) => {
    if (!album.announcementAt || !album.releaseAt) {
      return [];
    }

    if (today >= album.announcementAt && today < album.releaseAt) {
      return [
        createAlbumSpotlight(
          album,
          HomeSpotlightType.AlbumPreview,
          album.announcementAt,
          addDays(album.releaseAt, -1)
        )
      ];
    }

    const releaseWeekEnd = addDays(album.releaseAt, 6);

    if (isBetweenInclusive(today, album.releaseAt, releaseWeekEnd)) {
      return [
        createAlbumSpotlight(
          album,
          HomeSpotlightType.AlbumReleaseWeek,
          album.releaseAt,
          releaseWeekEnd
        )
      ];
    }

    return [];
  });
}

function getTourSpotlights(today: number): HomeSpotlight[] {
  return tours.flatMap((tour) => {
    if (!tour.announcementAt) {
      return [];
    }

    if (today >= tour.announcementAt && today < tour.startAt) {
      return [
        createTourSpotlight(
          tour,
          HomeSpotlightType.TourPreview,
          tour.announcementAt,
          addDays(tour.startAt, -1)
        )
      ];
    }

    if (isBetweenInclusive(today, tour.startAt, tour.endAt)) {
      return [
        createTourSpotlight(tour, HomeSpotlightType.TourOngoing, tour.startAt, tour.endAt)
      ];
    }

    return [];
  });
}

function getSpotlightPriority(spotlight: HomeSpotlight): number {
  return HOME_SPOTLIGHT_PRIORITY[spotlight.type];
}

export function getHomeSpotlights(today?: string): HomeSpotlight[] {
  const now = getTodayTimestamp(today);

  return [...getAlbumSpotlights(now), ...getTourSpotlights(now)]
    .sort((a, b) => {
      const dateComparison = b.startAt - a.startAt;

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return getSpotlightPriority(a) - getSpotlightPriority(b);
    })
    .map((item) => ({
      ...item,
      action: { ...item.action }
    }));
}

export function getHomeSpotlight(today?: string): HomeSpotlight | null {
  return getHomeSpotlights(today)[0] ?? null;
}

export function getHomeEras(): HomeEraCard[] {
  return homeEraCards.map((item) => ({
    ...item,
    action: { ...item.action }
  }));
}

export function getHomeNews(limit = 3): NewsItem[] {
  return newsItems
    .map((item) => ({
      ...item,
      action: { ...item.action }
    }))
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, limit);
}

export function getHomeFeed(today?: string): HomeFeed {
  return {
    spotlights: getHomeSpotlights(today),
    eras: getHomeEras(),
    news: getHomeNews()
  };
}
