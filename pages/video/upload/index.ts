interface UploadData {
  showId: string;
  title: string;
  song: string;
  selectedVideo: boolean;
}

Page({
  data: {
    showId: '',
    title: '',
    song: '',
    selectedVideo: false
  } as UploadData,

  onLoad(options: { showId?: string }) {
    this.setData({
      showId: options.showId ?? ''
    });
  },

  mockPickVideo() {
    this.setData({ selectedVideo: true });
  },

  onTitleInput(event: { detail: { value: string } }) {
    this.setData({ title: event.detail.value });
  },

  onSongInput(event: { detail: { value: string } }) {
    this.setData({ song: event.detail.value });
  },

  submit() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }

    wx.showToast({ title: '上传成功（模拟）', icon: 'success' });
    this.setData({
      title: '',
      song: '',
      selectedVideo: false
    });
  }
});
