import { albums } from '../data/albums';
import { newsItems } from '../data/news';
import { shows } from '../data/shows';
import { songs } from '../data/songs';
import { tours } from '../data/tours';
import { videos } from '../data/videos';
import { Album } from '../types/album';
import { NewsItem } from '../types/news';
import { Song } from '../types/song';
import {
  Show,
  ShowGuest,
  ShowStatus,
  SurpriseSong,
  Tour,
  TourSetlistVersion,
  TourStatus,
  TourProgress,
  Video
} from '../types/tour';
import { getFavoriteSongIds } from './storage';

export interface TourShowItem extends Show {
  statusText: string;
  dateText: string;
  clickable: boolean;
  surpriseGuestSummary: string;
}

export interface TourCityGroup {
  city: string;
  shows: TourShowItem[];
}

export interface TourCountryGroup {
  country: string;
  cities: TourCityGroup[];
}

const SHOW_STATUS_TEXT: Record<ShowStatus, string> = {
  upcoming: '待开始',
  ongoing: '进行中',
  ended: '已结束',
  cancelled: '已取消'
};

const TOUR_STATUS_TEXT: Record<TourStatus, string> = {
  ongoing: '进行中',
  ended: '已结束',
  break: '空档期'
};

function formatDay(timestamp: number): string {
  const value = new Date(timestamp);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function cloneTourSetlist(setlist: TourSetlistVersion): TourSetlistVersion {
  return {
    id: setlist.id,
    label: setlist.label,
    songs: [...setlist.songs]
  };
}

function cloneTour(tour: Tour): Tour {
  return {
    ...tour,
    setlists: tour.setlists.map(cloneTourSetlist)
  };
}

function cloneShowGuest(guest: ShowGuest): ShowGuest {
  return { ...guest };
}

function cloneSurpriseSong(song: SurpriseSong): SurpriseSong {
  return { ...song };
}

function cloneShow(show: Show): Show {
  return {
    ...show,
    seatMapImages: show.seatMapImages ? [...show.seatMapImages] : undefined,
    notes: show.notes ? [...show.notes] : undefined,
    surpriseGuests: show.surpriseGuests?.map(cloneShowGuest),
    surpriseSongs: show.surpriseSongs?.map(cloneSurpriseSong)
  };
}

export function normalizeTourShowForGroup(show: Show): TourShowItem {
  return {
    ...cloneShow(show),
    statusText: getShowStatusText(show.status),
    dateText: formatDay(show.startAt),
    clickable: isShowClickable(show),
    surpriseGuestSummary: show.surpriseGuests?.map((guest) => guest.name).join(' / ') ?? ''
  };
}

export function getAlbums(): Album[] {
  return albums;
}

export function getSongs(): Song[] {
  return songs;
}

export function getActiveTour(): Tour | undefined {
  const tour = tours.find((item) => item.status === 'ongoing');
  return tour ? cloneTour(tour) : undefined;
}

export function getTimelineTours(): Tour[] {
  return tours
    .filter((tour) => tour.status === 'ended')
    .sort((a, b) => b.year - a.year)
    .map(cloneTour);
}

export function getNewsItems(): NewsItem[] {
  return newsItems.map((item) => ({
    ...item,
    action: { ...item.action }
  }));
}

export function getAlbumById(id: string): Album | undefined {
  return albums.find((album) => album.id === id);
}

export function getSongById(id: string): Song | undefined {
  return songs.find((song) => song.id === id);
}

export function getSongsByAlbumId(albumId: string): Song[] {
  return songs.filter((song) => song.albumId === albumId);
}

export function getTourById(id: string): Tour | undefined {
  const tour = tours.find((item) => item.id === id);
  return tour ? cloneTour(tour) : undefined;
}

export function getShowStatusText(status: ShowStatus): string {
  return SHOW_STATUS_TEXT[status];
}

export function getTourStatusText(status: TourStatus): string {
  return TOUR_STATUS_TEXT[status];
}

export function getShowsByTourId(tourId: string): Show[] {
  return shows.filter((show) => show.tourId === tourId).map(cloneShow);
}

export function getShowById(id: string): Show | undefined {
  const show = shows.find((item) => item.id === id);
  return show ? cloneShow(show) : undefined;
}

export function getVideosByShowId(showId: string): Video[] {
  return videos.filter((video) => video.showId === showId).map((video) => ({ ...video }));
}

export function isShowClickable(show: Pick<Show, 'status'>): boolean {
  return show.status !== 'cancelled';
}

export function getTourShowGroupsByTourId(tourId: string): TourCountryGroup[] {
  return groupTourShowsByLocation(getShowsByTourId(tourId));
}

export function groupTourShowsByLocation(tourShows: Show[]): TourCountryGroup[] {
  const sortedShows = [...tourShows].sort((a, b) => a.startAt - b.startAt);
  const countryMap = new Map<string, Map<string, TourShowItem[]>>();

  sortedShows.forEach((show) => {
    const cityMap = countryMap.get(show.country) ?? new Map<string, TourShowItem[]>();
    const cityShows = cityMap.get(show.city) ?? [];
    cityShows.push(normalizeTourShowForGroup(show));
    cityMap.set(show.city, cityShows);
    countryMap.set(show.country, cityMap);
  });

  return Array.from(countryMap.entries()).map(([country, cityMap]) => ({
    country,
    cities: Array.from(cityMap.entries()).map(([city, cityShows]) => ({
      city,
      shows: cityShows
    }))
  }));
}

export function getTourProgress(tourShows: Show[]): TourProgress {
  const total = tourShows.length;
  const completed = tourShows.filter((show) => show.status === 'ended').length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function getFavoriteSongs(): Song[] {
  const favoriteIds = getFavoriteSongIds();
  if (favoriteIds.length === 0) {
    return [];
  }
  return songs.filter((song) => favoriteIds.includes(song.id));
}

export function getAlbumBySong(song: Song): Album | undefined {
  return getAlbumById(song.albumId);
}

export function getTodayRecommendSong(defaultId: string): Song {
  return getSongById(defaultId) ?? songs[0];
}
