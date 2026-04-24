import { EraExhibitDetail } from '../../../types/era';
import { loadEraDetailPage } from '../../../services/contentStore';
import { ROUTES } from '../../../utils/constants';

interface EraDetailData {
  exhibit: EraExhibitDetail | null;
  currentExhibitId: string;
  hasError: boolean;
  isLoading: boolean;
  loadError: boolean;
  isHonorSheetOpen: boolean;
}

interface EraDetailPageInstance {
  data: EraDetailData;
  setData: (patch: Partial<EraDetailData>) => void;
  onLoad: (options: { id?: string }) => void | Promise<void>;
}

interface RouteDataset {
  route?: string;
  query?: string;
}

interface RevisitDataset {
  id?: string;
}

const eraDetailPageConfig = {
  data: {
    exhibit: null,
    currentExhibitId: '',
    hasError: false,
    isLoading: false,
    loadError: false,
    isHonorSheetOpen: false
  } as EraDetailData,

  async onLoad(this: EraDetailPageInstance, options: { id?: string }) {
    const exhibitId = options.id;
    this.setData({
      currentExhibitId: exhibitId ?? '',
      isLoading: true,
      loadError: false,
      hasError: false
    });

    if (!exhibitId) {
      this.setData({
        exhibit: null,
        currentExhibitId: '',
        hasError: true,
        isLoading: false,
        loadError: false,
        isHonorSheetOpen: false
      });
      return;
    }

    try {
      const exhibit = await loadEraDetailPage(exhibitId);
      if (!exhibit) {
        this.setData({
          exhibit: null,
          hasError: true,
          isLoading: false,
          loadError: false,
          isHonorSheetOpen: false
        });
        return;
      }

      this.setData({
        exhibit,
        hasError: false,
        isLoading: false,
        loadError: false,
        isHonorSheetOpen: false
      });
    } catch {
      this.setData({
        exhibit: null,
        hasError: false,
        isLoading: false,
        loadError: true,
        isHonorSheetOpen: false
      });
    }
  },

  goRoute(this: EraDetailPageInstance, event: { currentTarget: { dataset: RouteDataset } }) {
    const { route, query } = event.currentTarget.dataset;

    if (!route) {
      return;
    }

    wx.navigateTo({
      url: query ? `${route}?${query}` : route
    });
  },

  openHonorSheet(this: EraDetailPageInstance) {
    this.setData({ isHonorSheetOpen: true });
  },

  closeHonorSheet(this: EraDetailPageInstance) {
    this.setData({ isHonorSheetOpen: false });
  },

  stopSheetTap() {},

  openRevisitItem(this: EraDetailPageInstance, event: { currentTarget: { dataset: RevisitDataset } }) {
    const { id } = event.currentTarget.dataset;
    if (!id) {
      return;
    }

    wx.navigateTo({ url: `${ROUTES.videoPlayer}?id=${id}` });
  },

  retryLoad(this: EraDetailPageInstance) {
    return this.onLoad({ id: this.data.currentExhibitId });
  }
};

Page(eraDetailPageConfig);

export default eraDetailPageConfig;
