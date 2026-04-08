import { Performance } from '../../types/library';
import { getPerformanceList } from '../../utils/librarySelectors';

interface PerformanceData {
  performances: Performance[];
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
    performances: []
  } as PerformanceData,

  onLoad() {
    this.setData({
      performances: getPerformanceList()
    });
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
