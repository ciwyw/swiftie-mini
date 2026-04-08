import { LibraryHubEntry } from '../../types/library';
import { getLibraryHubEntries } from '../../utils/librarySelectors';

interface LibraryData {
  entries: LibraryHubEntry[];
}

Page({
  data: {
    entries: []
  } as LibraryData,

  onLoad() {
    this.setData({
      entries: getLibraryHubEntries()
    });
  },

  goEntry(event: { currentTarget: { dataset: { route: string } } }) {
    wx.navigateTo({ url: event.currentTarget.dataset.route });
  }
});
