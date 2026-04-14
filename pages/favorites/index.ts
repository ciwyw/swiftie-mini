import { ROUTES } from '../../utils/constants';
import { loadFavoriteSongListPage, SongListItem } from '../../services/contentStore';
import { getFavoriteSongIds } from '../../utils/storage';

interface FavoritesData {
  favorites: SongListItem[];
  isLoading: boolean;
  loadError: boolean;
}

Page({
  data: {
    favorites: [],
    isLoading: false,
    loadError: false
  } as FavoritesData,

  onShow() {
    return this.loadPage();
  },

  async loadPage() {
    const favoriteIds = getFavoriteSongIds();

    if (favoriteIds.length === 0) {
      this.setData({
        favorites: [],
        isLoading: false,
        loadError: false
      });
      return;
    }

    this.setData({ isLoading: true, loadError: false });

    try {
      this.setData({
        favorites: await loadFavoriteSongListPage(favoriteIds),
        isLoading: false,
        loadError: false
      });
    } catch {
      this.setData({
        favorites: [],
        isLoading: false,
        loadError: true
      });
    }
  },

  goSong(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.song}?id=${event.currentTarget.dataset.id}` });
  }
});
