import { loadTours } from '../../services/contentStore';
import { Tour } from '../../types/tour';
import { ROUTES } from '../../utils/constants';

interface TimelineTour extends Tour {
  timelineLabel: string;
}

interface TourData {
  activeTour: Tour | null;
  timelineTours: TimelineTour[];
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
      const activeTour = tours.find((tour) => tour.status === 'ongoing') ?? null;
      const timelineTours = tours
        .filter((tour) => tour.status === 'ended')
        .sort((left, right) => right.year - left.year)
        .map((tour) => ({
          ...tour,
          timelineLabel: `${tour.year}`
        }));

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
