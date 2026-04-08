import { ROUTES } from '../../utils/constants';
import { SongListItem, getSongListItems } from '../../utils/librarySelectors';

interface SongListData {
  songs: SongListItem[];
}

Page({
  data: {
    songs: []
  } as SongListData,

  onLoad() {
    this.setData({
      songs: getSongListItems()
    });
  },

  goSong(event: { currentTarget: { dataset: { id: string } } }) {
    wx.navigateTo({ url: `${ROUTES.song}?id=${event.currentTarget.dataset.id}` });
  }
});
