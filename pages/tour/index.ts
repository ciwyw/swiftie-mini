import { loadTours } from '../../services/contentStore';
import { TOUR_STATUS, Tour } from '../../types/tour';
import { ROUTES } from '../../utils/constants';

interface TourData {
  activeTour: Tour | null;
  timelineTours: Tour[];
  isLoading: boolean;
  loadError: boolean;
}

Page({
  data: {
    activeTour: null,
    timelineTours: [],
    isLoading: false,
    loadError: false
  } as TourData,

  onLoad() {
    return this.loadPage();
  },

  async loadPage() {
    this.setData({ isLoading: true, loadError: false });

    try {
      const tours = await loadTours();
      const activeTour = tours.find((tour) => tour.status === TOUR_STATUS.ONGOING) ?? null;
      const timelineTours = tours
        .filter((tour) => tour.status === TOUR_STATUS.ENDED)
        .sort((left, right) => right.startAt - left.startAt);

      this.setData({
        activeTour,
        timelineTours,
        isLoading: false,
        loadError: false
      });
    } catch {
      this.setData({
        activeTour: null,
        timelineTours: [],
        isLoading: false,
        loadError: true
      });
    }
  },

  retryLoad() {
    return this.loadPage();
  },

  goDetail(event: { currentTarget: { dataset: { id: string } } }) {
    const tourId = event.currentTarget.dataset.id;
    wx.navigateTo({ url: `${ROUTES.tourDetail}?id=${tourId}` });
  }
});
