import { Documentary } from '../../types/library';
import { getDocumentaryList } from '../../utils/librarySelectors';

interface DocumentaryData {
  documentaries: Documentary[];
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
    documentaries: []
  } as DocumentaryData,

  onLoad() {
    this.setData({
      documentaries: getDocumentaryList()
    });
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
