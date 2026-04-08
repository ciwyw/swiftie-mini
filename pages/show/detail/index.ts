import { loadShowDetailPage } from '../../../services/contentStore';
import { Show, Video } from '../../../types/tour';
import { ROUTES } from '../../../utils/constants';
import { getShowStatusText } from '../../../utils/selectors';

interface ShowDetailView extends Show {
  statusText: string;
  dateText: string;
  saleAtText: string;
}

interface ShowVideoView extends Video {
  uploadedAtText: string;
}

interface ShowDetailData {
  show: ShowDetailView | null;
  videos: ShowVideoView[];
  tourName: string;
  currentShowId: string;
  hasError: boolean;
  isLoading: boolean;
  loadError: boolean;
  currentSeatMapIndex: number;
  currentSeatMapImage: string;
  canViewPrevSeatMap: boolean;
  canViewNextSeatMap: boolean;
  seatMapPageText: string;
}

function formatDay(timestamp: number): string {
  const value = new Date(timestamp);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTime(timestamp: number): string {
  const value = new Date(timestamp);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function buildSeatMapState(show: Pick<Show, 'seatMapImages'> | null, currentIndex = 0) {
  const seatMapImages = show?.seatMapImages ?? [];
  const hasImages = seatMapImages.length > 0;
  const safeIndex = hasImages ? Math.min(Math.max(currentIndex, 0), seatMapImages.length - 1) : 0;
  const hasMultipleImages = seatMapImages.length > 1;

  return {
    currentSeatMapIndex: safeIndex,
    currentSeatMapImage: hasImages ? seatMapImages[safeIndex] : '',
    canViewPrevSeatMap: hasMultipleImages && safeIndex > 0,
    canViewNextSeatMap: hasMultipleImages && safeIndex < seatMapImages.length - 1,
    seatMapPageText: hasMultipleImages ? `${safeIndex + 1}/${seatMapImages.length}` : ''
  };
}

Page({
  data: {
    show: null,
    videos: [],
    tourName: '',
    currentShowId: '',
    hasError: false,
    isLoading: false,
    loadError: false,
    currentSeatMapIndex: 0,
    currentSeatMapImage: '',
    canViewPrevSeatMap: false,
    canViewNextSeatMap: false,
    seatMapPageText: ''
  } as ShowDetailData,

  onLoad(options: { id?: string }) {
    return this.loadPage(options.id ?? '');
  },

  async loadPage(showId: string) {
    this.setData({
      currentShowId: showId,
      hasError: false,
      isLoading: true,
      loadError: false
    });

    if (!showId) {
      this.setData({ hasError: true, isLoading: false, loadError: false, ...buildSeatMapState(null) });
      return;
    }

    try {
      const detail = await loadShowDetailPage(showId);
      if (!detail) {
        this.setData({
          show: null,
          videos: [],
          tourName: '',
          hasError: true,
          isLoading: false,
          loadError: false,
          ...buildSeatMapState(null)
        });
        return;
      }

      this.setData({
        show: {
          ...detail.show,
          statusText: getShowStatusText(detail.show.status),
          dateText: formatDay(detail.show.startAt),
          saleAtText: detail.show.saleAt ? formatDateTime(detail.show.saleAt) : '待公布'
        },
        videos: detail.videos.map((video) => ({
          ...video,
          uploadedAtText: formatDateTime(video.uploadedAt)
        })),
        tourName: detail.tour?.name ?? '',
        hasError: false,
        isLoading: false,
        loadError: false,
        ...buildSeatMapState(detail.show)
      });
    } catch {
      this.setData({
        show: null,
        videos: [],
        tourName: '',
        hasError: false,
        isLoading: false,
        loadError: true,
        ...buildSeatMapState(null)
      });
    }
  },

  viewPrevSeatMap() {
    const nextIndex = this.data.currentSeatMapIndex - 1;
    this.setData(buildSeatMapState(this.data.show, nextIndex));
  },

  viewNextSeatMap() {
    const nextIndex = this.data.currentSeatMapIndex + 1;
    this.setData(buildSeatMapState(this.data.show, nextIndex));
  },

  goSong(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.song}?id=${event.currentTarget.dataset.id}` });
  },

  openUpload() {
    if (!this.data.show) {
      return;
    }

    wx.navigateTo({ url: `${ROUTES.videoUpload}?showId=${this.data.show.id}` });
  },

  retryLoad() {
    return this.loadPage(this.data.currentShowId);
  }
});
