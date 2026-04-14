import { loadTourDetailPage } from '../../../services/contentStore';
import {
  Show,
  ShowStatus,
  TOUR_STATUS,
  Tour,
  TourProgress,
  TourStatus
} from '../../../types/tour';
import { ROUTES } from '../../../utils/constants';

interface TourShowItem extends Show {
  statusText: string;
  dateText: string;
  clickable: boolean;
  surpriseGuestSummary: string;
}

interface TourCityGroup {
  city: string;
  shows: TourShowItem[];
}

interface TourCountryGroup {
  country: string;
  cities: TourCityGroup[];
}

interface TourCountryGroupView extends TourCountryGroup {
  isExpanded: boolean;
}

const SHOW_STATUS_TEXT: Record<ShowStatus, string> = {
  upcoming: '待开始',
  ongoing: '进行中',
  ended: '已结束',
  cancelled: '已取消'
};

const TOUR_STATUS_TEXT: Record<TourStatus, string> = {
  [TOUR_STATUS.ONGOING]: '进行中',
  [TOUR_STATUS.ENDED]: '已结束',
  [TOUR_STATUS.BREAK]: '空档期'
};

function formatDay(timestamp: number): string {
  const value = new Date(timestamp);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getShowStatusText(status: ShowStatus): string {
  return SHOW_STATUS_TEXT[status];
}

function getTourStatusText(status: TourStatus): string {
  return TOUR_STATUS_TEXT[status];
}

function isShowClickable(show: Pick<Show, 'status'>): boolean {
  return show.status !== 'cancelled';
}

function normalizeTourShowForGroup(show: Show): TourShowItem {
  return {
    ...show,
    seatMapImages: show.seatMapImages ? [...show.seatMapImages] : undefined,
    notes: show.notes ? [...show.notes] : undefined,
    surpriseGuests: show.surpriseGuests?.map((guest) => ({ ...guest })),
    surpriseSongs: show.surpriseSongs?.map((song) => ({ ...song })),
    statusText: getShowStatusText(show.status),
    dateText: formatDay(show.startAt),
    clickable: isShowClickable(show),
    surpriseGuestSummary: show.surpriseGuests?.map((guest) => guest.name).join(' / ') ?? ''
  };
}

function groupTourShowsByLocation(tourShows: Show[]): TourCountryGroup[] {
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

function getTourProgress(tourShows: Show[]): TourProgress {
  const total = tourShows.length;
  const completed = tourShows.filter((show) => show.status === 'ended').length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

interface TourDetailData {
  tour: Tour | null;
  showGroups: TourCountryGroupView[];
  progress: TourProgress;
  currentTourId: string;
  hasError: boolean;
  isLoading: boolean;
  loadError: boolean;
  isEndedTour: boolean;
  tourStatusText: string;
}

Page({
  data: {
    tour: null,
    showGroups: [],
    progress: {
      completed: 0,
      total: 0,
      percent: 0
    },
    currentTourId: '',
    hasError: false,
    isLoading: false,
    loadError: false,
    isEndedTour: false,
    tourStatusText: ''
  } as TourDetailData,

  onLoad(options: { id?: string }) {
    return this.loadPage(options.id ?? '');
  },

  async loadPage(tourId: string) {
    this.setData({
      currentTourId: tourId,
      hasError: false,
      isLoading: true,
      loadError: false
    });

    if (!tourId) {
      this.setData({
        tour: null,
        showGroups: [],
        hasError: true,
        isLoading: false,
        loadError: false
      });
      return;
    }

    try {
      const { tour, shows } = await loadTourDetailPage(tourId);
      if (!tour) {
        this.setData({
          tour: null,
          showGroups: [],
          hasError: true,
          isLoading: false,
          loadError: false
        });
        return;
      }

      this.setData({
        tour,
        showGroups: groupTourShowsByLocation(shows).map((group) => ({
          ...group,
          isExpanded: false
        })),
        progress: getTourProgress(shows),
        hasError: false,
        isLoading: false,
        loadError: false,
        isEndedTour: tour.status === TOUR_STATUS.ENDED,
        tourStatusText: getTourStatusText(tour.status)
      });
    } catch {
      this.setData({
        tour: null,
        showGroups: [],
        hasError: false,
        isLoading: false,
        loadError: true
      });
    }
  },

  toggleCountry(event: { currentTarget: { dataset: { country: string } } }) {
    const country = event.currentTarget.dataset.country;
    const currentGroup = this.data.showGroups.find((group) => group.country === country);

    if (!currentGroup) {
      return;
    }

    const showGroups = this.data.showGroups.map((group) =>
      group.country === country ? { ...group, isExpanded: !currentGroup.isExpanded } : group
    );

    this.setData({ showGroups });
  },

  openShow(event: { currentTarget: { dataset: { showId: string; clickable: number } } }) {
    const { showId, clickable } = event.currentTarget.dataset;

    if (Number(clickable) !== 1) {
      return;
    }

    wx.navigateTo({ url: `${ROUTES.showDetail}?id=${showId}` });
  },

  retryLoad() {
    return this.loadPage(this.data.currentTourId);
  }
});
