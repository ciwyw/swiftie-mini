import { loadPerformances } from '../../services/contentStore';
import { Performance } from '../../types/library';
import { ROUTES } from '../../utils/constants';

interface PerformanceData {
  performances: Performance[];
  isLoading: boolean;
  loadError: boolean;
}

interface PerformanceCardDataset {
  id?: string;
}

Page({
  data: {
    performances: [],
    isLoading: false,
    loadError: false
  } as PerformanceData,

  onLoad() {
    return this.loadPage();
  },

  async loadPage() {
    this.setData({ isLoading: true, loadError: false });

    try {
      const performances = await loadPerformances();
      this.setData({
        performances,
        isLoading: false,
        loadError: false
      });
    } catch {
      this.setData({
        performances: [],
        isLoading: false,
        loadError: true
      });
    }
  },

  retryLoad() {
    return this.loadPage();
  },

  openPerformance(event: { currentTarget: { dataset: PerformanceCardDataset } }) {
    const { id } = event.currentTarget.dataset;
    if (!id) {
      return;
    }

    wx.navigateTo({ url: `${ROUTES.videoPlayer}?id=${id}` });
  }
});
