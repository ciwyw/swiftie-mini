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

function getTodayIso(today?: string): string {
  if (today) {
    return today;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function addDaysLocal(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(year, (month ?? 1) - 1, day ?? 1);
  value.setDate(value.getDate() + days);

  const nextYear = value.getFullYear();
  const nextMonth = String(value.getMonth() + 1).padStart(2, '0');
  const nextDay = String(value.getDate()).padStart(2, '0');

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function isBetweenInclusive(today: string, startDate: string, endDate: string): boolean {
  return today >= startDate && today <= endDate;
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
  startDate: string,
  endDate: string
): HomeSpotlight {
  return {
    id: `spotlight_${album.id}_${type}`,
    type,
    entityId: album.id,
    name: album.name,
    cover: album.cover,
    startDate,
    endDate,
    action: createAction(ROUTES.album, `id=${album.id}`)
  };
}

function createTourSpotlight(
  tour: Tour,
  type: HomeSpotlightType,
  startDate: string,
  endDate: string
): HomeSpotlight {
  return {
    id: `spotlight_${tour.id}_${type}`,
    type,
    entityId: tour.id,
    name: tour.name,
    cover: tour.cover,
    startDate,
    endDate,
    action: createAction(ROUTES.tourDetail, `id=${tour.id}`)
  };
}

function getAlbumSpotlights(today: string): HomeSpotlight[] {
  return albums.flatMap((album) => {
    if (!album.announcementDate || !album.releaseDate) {
      return [];
    }

    if (today >= album.announcementDate && today < album.releaseDate) {
      return [
        createAlbumSpotlight(
          album,
          HomeSpotlightType.AlbumPreview,
          album.announcementDate,
          addDaysLocal(album.releaseDate, -1)
        )
      ];
    }

    const releaseWeekEnd = addDays(album.releaseDate, 6);

    if (isBetweenInclusive(today, album.releaseDate, releaseWeekEnd)) {
      return [
        createAlbumSpotlight(
          album,
          HomeSpotlightType.AlbumReleaseWeek,
          album.releaseDate,
          releaseWeekEnd
        )
      ];
    }

    return [];
  });
}

function getTourSpotlights(today: string): HomeSpotlight[] {
  return tours.flatMap((tour) => {
    if (!tour.announcementDate) {
      return [];
    }

    if (today >= tour.announcementDate && today < tour.startDate) {
      return [
        createTourSpotlight(
          tour,
          HomeSpotlightType.TourPreview,
          tour.announcementDate,
          addDaysLocal(tour.startDate, -1)
        )
      ];
    }

    if (isBetweenInclusive(today, tour.startDate, tour.endDate)) {
      return [
        createTourSpotlight(tour, HomeSpotlightType.TourOngoing, tour.startDate, tour.endDate)
      ];
    }

    return [];
  });
}

function getSpotlightPriority(spotlight: HomeSpotlight): number {
  return HOME_SPOTLIGHT_PRIORITY[spotlight.type];
}

export function getHomeSpotlights(today?: string): HomeSpotlight[] {
  const now = getTodayIso(today);

  return [...getAlbumSpotlights(now), ...getTourSpotlights(now)]
    .sort((a, b) => {
      const dateComparison = b.startDate.localeCompare(a.startDate);

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
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function getHomeFeed(today?: string): HomeFeed {
  return {
    spotlights: getHomeSpotlights(today),
    eras: getHomeEras(),
    news: getHomeNews()
  };
}
