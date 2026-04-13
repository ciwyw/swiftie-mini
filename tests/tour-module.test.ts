import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getActiveTour,
  getShowById,
  getShowStatusText,
  getTimelineTours,
  getTourShowGroupsByTourId,
  getTourStatusText,
  getTourById,
  getTourProgress,
  isShowClickable,
  getVideosByShowId
} from '../utils/selectors';
import {
  getGuideChecklistByTourId,
  toggleGuideChecklistItem
} from '../utils/storage';
import { TOUR_STATUS, type Show } from '../types/tour';

const TOUR_IDS = {
  eras: '48291357',
  reputation: '73160584',
  the1989: '26490831',
  red: '59014276',
  speakNow: '81732465',
  fearless: '14685723'
} as const;

const storage = new Map<string, unknown>();

beforeEach(() => {
  storage.clear();
});

(globalThis as unknown as { wx: typeof wx }).wx = {
  navigateTo() {},
  switchTab() {},
  showToast() {},
  getStorageSync(key: string) {
    return storage.get(key);
  },
  setStorageSync(key: string, data: unknown) {
    storage.set(key, data);
  }
};

test('getTourProgress keeps cancelled shows in total while counting ended shows', () => {
  const progress = getTourProgress([
    {
      id: 's1',
      tourId: TOUR_IDS.eras,
      country: 'Japan',
      city: 'Tokyo',
      venue: 'Tokyo Dome',
      startAt: Date.UTC(2024, 1, 10),
      status: 'ended'
    },
    {
      id: 's2',
      tourId: TOUR_IDS.eras,
      country: 'Canada',
      city: 'Toronto',
      venue: 'Rogers Centre',
      startAt: Date.UTC(2024, 10, 23),
      status: 'cancelled'
    },
    {
      id: 's3',
      tourId: TOUR_IDS.eras,
      country: 'Singapore',
      city: 'Singapore',
      venue: 'National Stadium',
      startAt: Date.UTC(2024, 2, 8),
      status: 'upcoming'
    }
  ]);

  assert.deepEqual(progress, { completed: 1, total: 3, percent: 33 });
});

test('toggleGuideChecklistItem stores ids per tour bucket', () => {
  assert.deepEqual(getGuideChecklistByTourId(TOUR_IDS.eras), []);
  assert.deepEqual(
    toggleGuideChecklistItem(TOUR_IDS.eras, 'register_account'),
    ['register_account']
  );
  assert.deepEqual(toggleGuideChecklistItem(TOUR_IDS.eras, 'register_account'), []);
});

test('getTourById returns timestamp-based tour windows, numeric status, and label-only setlists', () => {
  const tour = getTourById(TOUR_IDS.eras);

  assert.equal(tour?.cover, '/assets/images/ui/avatar-placeholder.png');
  assert.equal(tour?.status, TOUR_STATUS.ONGOING);
  assert.equal(typeof tour?.announcementAt, 'number');
  assert.equal(typeof tour?.startAt, 'number');
  assert.equal(typeof tour?.endAt, 'number');
  assert.deepEqual(tour?.albumIds, []);
  assert.deepEqual(tour?.setlists.map((setlist) => setlist.label), ['2023.3-2024.3', '2024.5-2024.12']);
  assert.equal(tour?.setlists[0]?.songs[0], 'Miss Americana & The Heartbreak Prince');
  assert.equal(tour?.setlists[1]?.songs.includes("Who's Afraid of Little Old Me?"), true);
  assert.equal('id' in (tour?.setlists[0] ?? {}), false);
});

test('getShowById returns country, surprise guests, and surprise songs', () => {
  const show = getShowById('show_singapore_n1');

  assert.equal(show?.country, 'Singapore');
  assert.deepEqual(show?.surpriseGuests, [{ name: 'Sabrina Carpenter' }]);
  assert.deepEqual(show?.surpriseSongs, [
    { songId: 'song_tim_mcgraw', name: 'Tim McGraw' },
    { songId: 'song_mirrorball', name: 'mirrorball' }
  ]);
});

test('getShowById returns structured ticket and venue fields directly on the show', () => {
  const show = getShowById('show_vancouver_n1');

  assert.deepEqual(
    {
      id: show?.id,
      ticketPlatform: show?.ticketPlatform,
      saleAt: show?.saleAt,
      entryTime: show?.entryTime,
      address: show?.address,
      seatMapImages: show?.seatMapImages,
      notes: show?.notes
    },
    {
      id: 'show_vancouver_n1',
    ticketPlatform: 'Ticketmaster',
    saleAt: Date.UTC(2024, 9, 1, 3),
    entryTime: '18:00',
    address: '777 Pacific Blvd, Vancouver, BC V6B 4Y8',
    seatMapImages: [
      '/assets/images/ui/avatar-placeholder.png',
      '/assets/images/ui/avatar-placeholder.png'
    ],
    notes: ['入场口请以现场指引为准', '安检排队较长']
    }
  );
});

test('getShowStatusText maps all four show states', () => {
  assert.deepEqual(
    {
      upcoming: getShowStatusText('upcoming'),
      ongoing: getShowStatusText('ongoing'),
      ended: getShowStatusText('ended'),
      cancelled: getShowStatusText('cancelled')
    },
    {
      upcoming: '待开始',
      ongoing: '进行中',
      ended: '已结束',
      cancelled: '已取消'
    }
  );
});

test('getTourStatusText maps all three tour states', () => {
  assert.deepEqual(
    {
      ongoing: getTourStatusText(TOUR_STATUS.ONGOING),
      ended: getTourStatusText(TOUR_STATUS.ENDED),
      break: getTourStatusText(TOUR_STATUS.BREAK)
    },
    {
      ongoing: '进行中',
      ended: '已结束',
      break: '空档期'
    }
  );
});

test('isShowClickable returns false only for cancelled shows', () => {
  const clickableSamples: Pick<Show, 'status'>[] = [
    { status: 'upcoming' },
    { status: 'ongoing' },
    { status: 'ended' },
    { status: 'cancelled' }
  ];

  assert.equal(isShowClickable(clickableSamples[0]), true);
  assert.equal(isShowClickable(clickableSamples[1]), true);
  assert.equal(isShowClickable(clickableSamples[2]), true);
  assert.equal(isShowClickable(clickableSamples[3]), false);
});

test('getTourShowGroupsByTourId groups shows by country then city', () => {
  const groups = getTourShowGroupsByTourId(TOUR_IDS.eras);

  assert.equal(groups.length, 3);
  assert.equal(groups[0]?.country, 'Japan');
  assert.equal(groups[0]?.cities[0]?.city, 'Tokyo');
  assert.equal(groups[0]?.cities[0]?.shows[0]?.id, 'show_tokyo_n1');
  assert.equal(groups[0]?.cities[0]?.shows[0]?.statusText, '已结束');
  assert.equal(groups[0]?.cities[0]?.shows[0]?.clickable, true);
  assert.equal(groups[0]?.cities[0]?.shows[0]?.surpriseGuestSummary, '');

  assert.equal(groups[1]?.country, 'Singapore');
  assert.equal(groups[1]?.cities[0]?.city, 'Singapore');
  assert.equal(groups[1]?.cities[0]?.shows[0]?.id, 'show_singapore_n1');
  assert.equal(groups[1]?.cities[0]?.shows[0]?.statusText, '已结束');
  assert.equal(groups[1]?.cities[0]?.shows[0]?.clickable, true);
  assert.equal(groups[1]?.cities[0]?.shows[0]?.surpriseGuestSummary, 'Sabrina Carpenter');

  assert.equal(groups[2]?.country, 'Canada');
  assert.equal(groups[2]?.cities[0]?.city, 'Toronto');
  assert.equal(groups[2]?.cities[0]?.shows[0]?.id, 'show_toronto_cancelled');
  assert.equal(groups[2]?.cities[0]?.shows[0]?.statusText, '已取消');
  assert.equal(groups[2]?.cities[0]?.shows[0]?.clickable, false);
  assert.equal(groups[2]?.cities[0]?.shows[0]?.surpriseGuestSummary, '');
  assert.equal(groups[2]?.cities[1]?.city, 'Vancouver');
  assert.equal(groups[2]?.cities[1]?.shows[0]?.id, 'show_vancouver_n1');
  assert.equal(groups[2]?.cities[1]?.shows[0]?.statusText, '进行中');
  assert.equal(groups[2]?.cities[1]?.shows[0]?.clickable, true);
  assert.equal(groups[2]?.cities[1]?.shows[0]?.surpriseGuestSummary, '');
});

test('getActiveTour returns the single ongoing tour', () => {
  const tour = getActiveTour();

  assert.equal(tour?.id, TOUR_IDS.eras);
  assert.equal(tour?.status, TOUR_STATUS.ONGOING);
});

test('getTimelineTours returns only ended tours sorted by start date desc', () => {
  const timelineTours = getTimelineTours();

  assert.deepEqual(
    timelineTours.map((tour) => tour.id),
    [
      TOUR_IDS.reputation,
      TOUR_IDS.the1989,
      TOUR_IDS.red,
      TOUR_IDS.speakNow,
      TOUR_IDS.fearless
    ]
  );
});

test('timeline tours exclude the ongoing tour hero entry', () => {
  const activeTour = getActiveTour();
  const timelineTours = getTimelineTours();

  assert.equal(timelineTours.some((tour) => tour.id === activeTour?.id), false);
});

test('video cards expose uploader metadata with timestamp uploads', () => {
  const video = getVideosByShowId('show_singapore_n1')[0];

  assert.equal(typeof video?.userName, 'string');
  assert.equal(typeof video?.uploadedAt, 'number');
});

test('tour detail template no longer renders rangeLabel', () => {
  const template = readFileSync(new URL('../pages/tour/detail/index.wxml', import.meta.url), 'utf8');

  assert.doesNotMatch(template, /tour\.rangeLabel/);
});

test('tour index template no longer renders timeline year labels', () => {
  const template = readFileSync(new URL('../pages/tour/index.wxml', import.meta.url), 'utf8');

  assert.doesNotMatch(template, /timeline-year/);
  assert.doesNotMatch(template, /timelineLabel/);
});
