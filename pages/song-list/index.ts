import { ROUTES } from '../../utils/constants';
import { loadSongListPage, SongListItem } from '../../services/contentStore';

interface SongListData {
  songs: SongListItem[];
  isLoading: boolean;
  loadError: boolean;
}

Page({
  data: {
    songs: [],
    isLoading: false,
    loadError: false
  } as SongListData,

  onLoad() {
    return this.loadPage();
  },

  async loadPage() {
    this.setData({ isLoading: true, loadError: false });

    try {
      this.setData({
        songs: await loadSongListPage(),
        isLoading: false,
        loadError: false
      });
    } catch {
      this.setData({
        songs: [],
        isLoading: false,
        loadError: true
      });
    }
  },

  retryLoad() {
    return this.loadPage();
  },

  goSong(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.song}?id=${event.currentTarget.dataset.id}` });
  }
});
