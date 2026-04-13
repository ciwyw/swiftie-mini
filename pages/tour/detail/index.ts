import { loadTourDetailPage } from '../../../services/contentStore';
import { TOUR_STATUS, Tour, TourProgress } from '../../../types/tour';
import { ROUTES } from '../../../utils/constants';
import {
  getTourProgress,
  getTourStatusText,
  groupTourShowsByLocation,
  TourCountryGroup
} from '../../../utils/selectors';

interface TourCountryGroupView extends TourCountryGroup {
  isExpanded: boolean;
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
