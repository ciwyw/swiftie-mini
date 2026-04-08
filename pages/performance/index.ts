import { loadPerformances } from '../../services/contentStore';
import { Performance } from '../../types/library';

interface PerformanceData {
  performances: Performance[];
  isLoading: boolean;
  loadError: boolean;
}

interface PerformanceCardDataset {
  title: string;
  subtitle: string;
  meta: string;
  summary: string;
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
        performances: performances.filter((item) => item.kind === 'live' && item.domain === 'library'),
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
    const { title, subtitle, meta, summary } = event.currentTarget.dataset;
    showInfoModal('演出信息', [
      title,
      subtitle,
      meta,
      summary,
      '暂未接入完整演出页，这里先作为可点击入口。'
    ]);
  }
});
