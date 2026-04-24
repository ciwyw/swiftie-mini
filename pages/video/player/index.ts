import { loadPerformancePlayerPage } from '../../../services/contentStore';

interface VideoPlayerData {
  performance: {
    id: string;
    title: string;
    songIds: string[];
    eventName: string;
    duration: string;
    videoUrl: string;
    cover?: string;
  } | null;
  currentPerformanceId: string;
  hasError: boolean;
  isLoading: boolean;
  loadError: boolean;
}

Page({
  data: {
    performance: null,
    currentPerformanceId: '',
    hasError: false,
    isLoading: false,
    loadError: false
  } as VideoPlayerData,

  onLoad(options: { id?: string }) {
    return this.loadPage(options.id ?? '');
  },

  async loadPage(performanceId: string) {
    this.setData({
      performance: null,
      currentPerformanceId: performanceId,
      hasError: false,
      isLoading: true,
      loadError: false
    });

    if (!performanceId) {
      this.setData({
        performance: null,
        hasError: true,
        isLoading: false,
        loadError: false
      });
      return;
    }

    try {
      const performance = await loadPerformancePlayerPage(performanceId);
      if (!performance) {
        this.setData({
          performance: null,
          hasError: true,
          isLoading: false,
          loadError: false
        });
        return;
      }

      this.setData({
        performance,
        hasError: false,
        isLoading: false,
        loadError: false
      });
    } catch {
      this.setData({
        performance: null,
        hasError: false,
        isLoading: false,
        loadError: true
      });
    }
  },

  retryLoad() {
    return this.loadPage(this.data.currentPerformanceId);
  }
});
