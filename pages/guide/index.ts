import { getGuideChecklistByTourId, toggleGuideChecklistItem } from '../../utils/storage';

interface GuideItem {
  id: string;
  label: string;
}

interface GuideStep {
  title: string;
  items: GuideItem[];
}

interface GuideData {
  tourId: string;
  steps: GuideStep[];
  checkedIds: string[];
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: 'Step 1',
    items: [
      { id: 'register_account', label: '注册账号' },
      { id: 'bind_payment', label: '绑定支付' }
    ]
  },
  {
    title: 'Step 2',
    items: [
      { id: 'enter_early', label: '提前进入' },
      { id: 'multi_device', label: '多设备' }
    ]
  },
  {
    title: 'Step 3',
    items: [
      { id: 'waitlist', label: '候补' },
      { id: 'resale', label: '转售' }
    ]
  }
];

Page({
  data: {
    tourId: 'default',
    steps: GUIDE_STEPS,
    checkedIds: []
  } as GuideData,

  onLoad(options: { tourId?: string }) {
    const tourId = options.tourId ?? 'default';
    this.setData({
      tourId,
      checkedIds: getGuideChecklistByTourId(tourId)
    });
  },

  toggleItem(event: { currentTarget: { dataset: { id: string } } }) {
    const itemId = event.currentTarget.dataset.id;
    this.setData({
      checkedIds: toggleGuideChecklistItem(this.data.tourId, itemId)
    });
  }
});
