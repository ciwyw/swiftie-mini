import { ROUTES } from '../../utils/constants';
import { loadSinglesListPage, loadSongListPage, SongListItem } from '../../services/contentStore';

interface SongListData {
  songs: SongListItem[];
  isLoading: boolean;
  loadError: boolean;
  title: string;
  subtitle: string;
  scope: 'all' | 'singles';
}

Page({
  data: {
    songs: [],
    isLoading: false,
    loadError: false,
    title: '歌曲列表',
    subtitle: '完整歌曲条目与 MV 标记。',
    scope: 'all'
  } as SongListData,

  onLoad(options: { scope?: string }) {
    const scope = options.scope === 'singles' ? 'singles' : 'all';
    const title = scope === 'singles' ? '单曲列表' : '歌曲列表';
    const subtitle = scope === 'singles' ? '只展示未归属专辑的单曲。' : '完整歌曲条目与 MV 标记。';

    this.setData({ scope, title, subtitle });
    (wx as typeof wx & { setNavigationBarTitle(options: { title: string }): void }).setNavigationBarTitle({ title });

    return this.loadPage();
  },

  async loadPage() {
    this.setData({ isLoading: true, loadError: false });

    try {
      const songs =
        this.data.scope === 'singles' ? await loadSinglesListPage() : await loadSongListPage();
      this.setData({
        songs,
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
