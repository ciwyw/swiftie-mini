import { LibraryHubEntry } from '../../types/library';
import { ROUTES } from '../../utils/constants';

interface LibraryData {
  entries: LibraryHubEntry[];
}

const SINGLE_ALBUM_ID = 'album_singles';

const LIBRARY_HUB_ENTRIES: LibraryHubEntry[] = [
  { id: 'albums', title: '专辑', subtitle: '按时代浏览全部专辑', route: ROUTES.album },
  {
    id: 'singles',
    title: '单曲',
    subtitle: '非专辑单曲与特别发行',
    route: `${ROUTES.album}?id=${SINGLE_ALBUM_ID}`
  },
  { id: 'songs', title: '歌曲', subtitle: '完整歌曲列表与 MV 标记', route: ROUTES.songList },
  {
    id: 'performances',
    title: 'Live 表演',
    subtitle: '典礼、节目与特别舞台',
    route: ROUTES.performanceList
  },
  {
    id: 'documentaries',
    title: '纪录片',
    subtitle: '长内容与幕后特辑',
    route: ROUTES.documentaryList
  },
  { id: 'favorites', title: '我的收藏', subtitle: '集中查看已收藏歌曲', route: ROUTES.favorites }
];

Page({
  data: {
    entries: []
  } as LibraryData,

  onLoad() {
    this.setData({
      entries: LIBRARY_HUB_ENTRIES
    });
  },

  goEntry(event: { currentTarget: { dataset: { route: string } } }) {
    wx.navigateTo({ url: event.currentTarget.dataset.route });
  }
});
