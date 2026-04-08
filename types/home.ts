import { NewsItem } from './news';

export interface HomeAction {
  type: 'switchTab' | 'navigateTo';
  route: string;
  query?: string;
}

export enum HomeSpotlightType {
  AlbumPreview = 'album_preview',
  AlbumReleaseWeek = 'album_release_week',
  TourPreview = 'tour_preview',
  TourOngoing = 'tour_ongoing'
}

export interface HomeSpotlight {
  id: string;
  type: HomeSpotlightType;
  entityId: string;
  name: string;
  cover: string;
  startDate: string;
  endDate: string;
  action: HomeAction;
}

export interface HomeEraCard {
  id: string;
  albumId: string;
  name: string;
  cover: string;
  themeColor: string;
  tagline: string;
  action: HomeAction;
}

export interface HomeFeed {
  spotlights: HomeSpotlight[];
  eras: HomeEraCard[];
  news: NewsItem[];
}
