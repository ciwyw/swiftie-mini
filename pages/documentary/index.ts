import { loadDocumentaries } from '../../services/contentStore';
import { Documentary } from '../../types/library';

interface DocumentaryData {
  documentaries: Documentary[];
  isLoading: boolean;
  loadError: boolean;
}

interface DocumentaryCardDataset {
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
    documentaries: [],
    isLoading: false,
    loadError: false
  } as DocumentaryData,

  onLoad() {
    return this.loadPage();
  },

  async loadPage() {
    this.setData({ isLoading: true, loadError: false });

    try {
      this.setData({
        documentaries: await loadDocumentaries(),
        isLoading: false,
        loadError: false
      });
    } catch {
      this.setData({
        documentaries: [],
        isLoading: false,
        loadError: true
      });
    }
  },

  retryLoad() {
    return this.loadPage();
  },

  openDocumentary(event: { currentTarget: { dataset: DocumentaryCardDataset } }) {
    const { title, subtitle, meta, summary } = event.currentTarget.dataset;
    showInfoModal('纪录片信息', [
      title,
      subtitle,
      meta,
      summary,
      '暂未接入播放或详情页，这里先作为可点击入口。'
    ]);
  }
});
