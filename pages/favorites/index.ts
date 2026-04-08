import { ROUTES } from '../../utils/constants';
import { SongListItem, getFavoriteSongListItems } from '../../utils/librarySelectors';

interface FavoritesData {
  favorites: SongListItem[];
}

Page({
  data: {
    favorites: []
  } as FavoritesData,

  onShow() {
    this.setData({
      favorites: getFavoriteSongListItems()
    });
  },

  goSong(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.song}?id=${event.currentTarget.dataset.id}` });
  }
});
