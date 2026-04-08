import { Tour } from '../../types/tour';
import { ROUTES } from '../../utils/constants';
import { getActiveTour, getTimelineTours } from '../../utils/selectors';

interface TimelineTour extends Tour {
  timelineLabel: string;
}

interface TourData {
  activeTour: Tour | null;
  timelineTours: TimelineTour[];
}

Page({
  data: {
    activeTour: null,
    timelineTours: []
  } as TourData,

  onLoad() {
    const activeTour = getActiveTour() ?? null;
    const timelineTours = getTimelineTours().map((tour) => ({
      ...tour,
      timelineLabel: `${tour.year}`
    }));

    this.setData({
      activeTour,
      timelineTours
    });
  },

  goDetail(event: { currentTarget: { dataset: { id: string } } }) {
    const tourId = event.currentTarget.dataset.id;
    wx.navigateTo({ url: `${ROUTES.tourDetail}?id=${tourId}` });
  }
});
