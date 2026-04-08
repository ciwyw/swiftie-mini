import { Show, ShowGuide, Video } from '../../../types/tour';
import { ROUTES } from '../../../utils/constants';
import {
  getShowById,
  getShowStatusText,
  getShowGuideByShowId,
  getTourById,
  getVideosByShowId
} from '../../../utils/selectors';

interface ShowDetailData {
  show: (Show & { statusText: string }) | null;
  guide: ShowGuide | null;
  videos: Video[];
  tourName: string;
  hasError: boolean;
  ticketPlatformText: string;
  saleTimeText: string;
  currentSeatMapIndex: number;
  currentSeatMapImage: string;
  canViewPrevSeatMap: boolean;
  canViewNextSeatMap: boolean;
  seatMapPageText: string;
}

function buildSeatMapState(guide: ShowGuide | null, currentIndex = 0) {
  const seatMapImages = guide?.seatMapImages ?? [];
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
    guide: null,
    videos: [],
    tourName: '',
    hasError: false,
    ticketPlatformText: '待公布',
    saleTimeText: '待公布',
    currentSeatMapIndex: 0,
    currentSeatMapImage: '',
    canViewPrevSeatMap: false,
    canViewNextSeatMap: false,
    seatMapPageText: ''
  } as ShowDetailData,

  onLoad(options: { id?: string }) {
    const showId = options.id ?? '';
    const show = getShowById(showId);

    if (!show) {
      this.setData({ hasError: true });
      return;
    }

    const tour = getTourById(show.tourId);
    const guide = getShowGuideByShowId(showId) ?? null;

    this.setData({
      show: {
        ...show,
        statusText: getShowStatusText(show.status)
      },
      guide,
      videos: getVideosByShowId(showId),
      tourName: tour?.name ?? '',
      hasError: false,
      ticketPlatformText: guide?.ticketPlatform ?? '待公布',
      saleTimeText: guide?.saleTime ?? '待公布',
      ...buildSeatMapState(guide)
    });
  },

  viewPrevSeatMap() {
    const nextIndex = this.data.currentSeatMapIndex - 1;
    this.setData(buildSeatMapState(this.data.guide, nextIndex));
  },

  viewNextSeatMap() {
    const nextIndex = this.data.currentSeatMapIndex + 1;
    this.setData(buildSeatMapState(this.data.guide, nextIndex));
  },

  goSong(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.song}?id=${event.currentTarget.dataset.id}` });
  },

  openUpload() {
    if (!this.data.show) {
      return;
    }

    wx.navigateTo({ url: `${ROUTES.videoUpload}?showId=${this.data.show.id}` });
  }
});
