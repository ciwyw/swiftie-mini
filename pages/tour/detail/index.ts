import { Tour, TourProgress } from '../../../types/tour';
import { ROUTES } from '../../../utils/constants';
import {
  getTourById,
  getShowsByTourId,
  getTourProgress,
  getTourShowGroupsByTourId,
  getTourStatusText,
  TourCountryGroup
} from '../../../utils/selectors';

interface TourCountryGroupView extends TourCountryGroup {
  isExpanded: boolean;
}

interface TourDetailData {
  tour: Tour | null;
  showGroups: TourCountryGroupView[];
  progress: TourProgress;
  hasError: boolean;
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
    hasError: false,
    isEndedTour: false,
    tourStatusText: ''
  } as TourDetailData,

  onLoad(options: { id?: string }) {
    const tourId = options.id ?? '';
    const tour = getTourById(tourId);

    if (!tour) {
      this.setData({
        tour: null,
        showGroups: [],
        hasError: true
      });
      return;
    }

    const showGroups = getTourShowGroupsByTourId(tourId).map((group) => ({
      ...group,
      isExpanded: false
    }));

    this.setData({
      tour,
      showGroups,
      progress: getTourProgress(getShowsByTourId(tourId)),
      isEndedTour: tour.status === 'ended',
      tourStatusText: getTourStatusText(tour.status),
      hasError: false
    });
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
  }
});
