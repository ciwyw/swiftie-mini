import { EraExhibitDetail } from '../../../types/era';
import { getEraExhibitDetailById } from '../../../utils/eraSelectors';

interface EraDetailData {
  exhibit: EraExhibitDetail | null;
  hasError: boolean;
  isHonorSheetOpen: boolean;
}

interface EraDetailPageInstance {
  data: EraDetailData;
  setData: (patch: Partial<EraDetailData>) => void;
}

interface RouteDataset {
  route?: string;
  query?: string;
}

interface RevisitDataset {
  kind: 'live' | 'interview' | 'special';
  title: string;
  subtitle?: string;
  meta?: string;
  summary?: string;
}

function getRevisitKindLabel(kind: RevisitDataset['kind']) {
  if (kind === 'interview') {
    return '采访';
  }

  if (kind === 'special') {
    return '特别节目';
  }

  return 'Live';
}

function showInfoModal(title: string, lines: Array<string | undefined>) {
  const modal = wx as typeof wx & {
    showModal(options: { title: string; content: string; showCancel: boolean; confirmText: string }): void;
  };

  modal.showModal({
    title,
    content: lines.filter((line): line is string => Boolean(line)).join('\n'),
    showCancel: false,
    confirmText: '知道了'
  });
}

const eraDetailPageConfig = {
  data: {
    exhibit: null,
    hasError: false,
    isHonorSheetOpen: false
  } as EraDetailData,

  onLoad(this: EraDetailPageInstance, options: { id?: string }) {
    const exhibitId = options.id;
    if (!exhibitId) {
      this.setData({
        exhibit: null,
        hasError: true,
        isHonorSheetOpen: false
      });
      return;
    }

    const exhibit = getEraExhibitDetailById(exhibitId);
    if (!exhibit) {
      this.setData({
        exhibit: null,
        hasError: true,
        isHonorSheetOpen: false
      });
      return;
    }

    this.setData({
      exhibit,
      hasError: false,
      isHonorSheetOpen: false
    });
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
    const { kind, title, subtitle, meta, summary } = event.currentTarget.dataset;

    showInfoModal('时代回看', [
      getRevisitKindLabel(kind),
      title,
      subtitle,
      meta,
      summary,
      '暂未接入完整内容页，这里先作为可点击入口。'
    ]);
  }
};

Page(eraDetailPageConfig);

export default eraDetailPageConfig;
