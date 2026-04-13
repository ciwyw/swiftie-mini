import { TOUR_STATUS, Tour } from '../types/tour';

function localDayTimestamp(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getTime();
}

export const TOUR_IDS = {
  eras: '48291357',
  reputation: '73160584',
  the1989: '26490831',
  red: '59014276',
  speakNow: '81732465',
  fearless: '14685723'
} as const;

export const tours: Tour[] = [
  {
    id: TOUR_IDS.eras,
    name: 'The Eras Tour',
    status: TOUR_STATUS.ONGOING,
    cover: '/assets/images/ui/avatar-placeholder.png',
    description:
      '一场横跨全部音乐时期的“时代回顾”巡演，用超长时长与高完成度舞台串联起 Taylor 的完整创作宇宙，也成为流行文化现象级事件。',
    announcementAt: localDayTimestamp(2026, 1, 15),
    startAt: localDayTimestamp(2026, 3, 1),
    endAt: localDayTimestamp(2026, 8, 30),
    albumIds: [],
    setlists: [
      {
        label: '2023.3-2024.3',
        songs: [
          'Miss Americana & The Heartbreak Prince',
          'Cruel Summer',
          'The Man',
          'You Need To Calm Down',
          'Lover',
          'The Archer',
          'Fearless',
          'You Belong With Me',
          'Love Story',
          "'tis the damn season",
          'willow',
          'marjorie',
          'champagne problems',
          'tolerate it',
          '...Ready For It?',
          'Delicate',
          "Don't Blame Me",
          'Look What You Made Me Do',
          'Enchanted',
          'Long Live',
          '22',
          'We Are Never Ever Getting Back Together',
          'I Knew You Were Trouble',
          'All Too Well (10 Minute Version)',
          'the 1',
          'betty',
          'the last great american dynasty',
          'august',
          'illicit affairs',
          'my tears ricochet',
          'cardigan',
          'Style',
          'Blank Space',
          'Shake It Off',
          'Wildest Dreams',
          'Bad Blood',
          'Guitar Surprise Song',
          'Piano Surprise Song',
          'Lavender Haze',
          'Anti-Hero',
          'Midnight Rain',
          'Vigilante Shit',
          'Bejeweled',
          'Mastermind',
          'Karma'
        ]
      },
      {
        label: '2024.5-2024.12',
        songs: [
          'Miss Americana & The Heartbreak Prince',
          'Cruel Summer',
          'The Man',
          'You Need To Calm Down',
          'Lover',
          'Fearless',
          'You Belong With Me',
          'Love Story',
          '22',
          'We Are Never Ever Getting Back Together',
          'I Knew You Were Trouble',
          'All Too Well (10 Minute Version)',
          'Enchanted',
          '...Ready For It?',
          'Delicate',
          "Don't Blame Me",
          'Look What You Made Me Do',
          'cardigan',
          'betty',
          'champagne problems',
          'august',
          'illicit affairs',
          'my tears ricochet',
          'marjorie',
          'willow',
          'Style',
          'Blank Space',
          'Shake It Off',
          'Wildest Dreams',
          'Bad Blood',
          'But Daddy I Love Him',
          'So High School',
          "Who's Afraid of Little Old Me?",
          'Down Bad',
          'Fortnight',
          'The Smallest Man Who Ever Lived',
          'I Can Do It With a Broken Heart',
          'Guitar Surprise Song/Mashup',
          'Piano Surprise Song/Mashup',
          'Lavender Haze',
          'Anti-Hero',
          'Midnight Rain',
          'Vigilante Shit',
          'Bejeweled',
          'Mastermind',
          'Karma'
        ]
      }
    ]
  },
  {
    id: TOUR_IDS.reputation,
    name: 'Reputation Stadium Tour',
    status: TOUR_STATUS.ENDED,
    cover: '/assets/images/ui/avatar-placeholder.png',
    description:
      '她首次全体育场巡演，整体风格更锋利、黑暗又张扬，以强烈的视觉冲击和掌控感重塑了 “Reputation” 时代的舞台形象。',
    startAt: localDayTimestamp(2018, 5, 8),
    endAt: localDayTimestamp(2018, 11, 21),
    albumIds: [],
    setlists: [
      {
        label: '标准歌单',
        songs: [
          '...Ready For It?',
          'I Did Something Bad',
          'Gorgeous',
          'Style / Love Story / You Belong With Me',
          'Look What You Made Me Do',
          'End Game',
          'King Of My Heart',
          'Delicate',
          'Shake It Off',
          'Dancing With Our Hands Tied',
          'Surprise Song',
          'Blank Space',
          'Dress',
          "Bad Blood / Should've Said No",
          "Don't Blame Me",
          "Long Live / New Year's Day",
          'Why She Disappeared',
          'Getaway Car',
          'Call It What You Want',
          "We Are Never Ever Getting Back Together / This Is Why We Can't Have Nice Things"
        ]
      }
    ]
  },
  {
    id: TOUR_IDS.the1989,
    name: 'The 1989 World Tour',
    status: TOUR_STATUS.ENDED,
    cover: '/assets/images/ui/avatar-placeholder.png',
    description:
      '以彻底流行化的《1989》为核心，这场巡演充满都市感、流行能量与巨星气场，标志着 Taylor 正式进入全球顶流时代。',
    announcementAt: localDayTimestamp(2014, 11, 3),
    startAt: localDayTimestamp(2015, 5, 5),
    endAt: localDayTimestamp(2015, 12, 12),
    albumIds: [],
    setlists: [
      {
        label: '标准歌单',
        songs: [
          'Welcome To New York',
          'New Romantics',
          'Blank Space',
          'I Knew You Were Trouble',
          'I Wish You Would',
          'How You Get The Girl',
          'I Know Places',
          'All You Had To Do Was Stay',
          'Surprise Song',
          'Clean',
          'Love Story',
          'Style',
          'This Love',
          'Bad Blood',
          'We Are Never Ever Getting Back Together',
          'Enchanted / Wildest Dreams',
          'Out Of The Woods',
          'Shake It Off'
        ]
      }
    ]
  },
  {
    id: TOUR_IDS.red,
    name: 'The Red Tour',
    status: TOUR_STATUS.ENDED,
    cover: '/assets/images/ui/avatar-placeholder.png',
    description:
      '这是 Taylor 从乡村转向主流流行的重要阶段巡演，情绪更浓烈、视觉更鲜明，也让 “Red era” 成为最具代表性的成长篇章之一。',
    announcementAt: localDayTimestamp(2012, 10, 25),
    startAt: localDayTimestamp(2013, 3, 13),
    endAt: localDayTimestamp(2014, 6, 12),
    albumIds: [],
    setlists: [
      {
        label: '标准歌单',
        songs: [
          'State Of Grace',
          'Holy Ground',
          'Red',
          'You Belong With Me',
          'The Lucky One',
          'Mean',
          'Stay Stay Stay / Ho Hey',
          '22',
          'Surprise Song',
          'Everything Has Changed',
          'Begin Again',
          'Sparks Fly',
          'I Knew You Were Trouble',
          'All Too Well',
          'Love Story',
          'Treacherous',
          'We Are Never Ever Getting Back Together'
        ]
      }
    ]
  },
  {
    id: TOUR_IDS.speakNow,
    name: 'Speak Now World Tour',
    status: TOUR_STATUS.ENDED,
    cover: '/assets/images/ui/avatar-placeholder.png',
    description:
      '一场更具戏剧感与童话色彩的世界巡演，把《Speak Now》时期的浪漫、自我表达与舞台叙事推向了新的高度。',
    announcementAt: localDayTimestamp(2010, 11, 23),
    startAt: localDayTimestamp(2011, 2, 9),
    endAt: localDayTimestamp(2012, 3, 18),
    albumIds: [],
    setlists: [
      {
        label: '标准歌单',
        songs: [
          'Sparks Fly',
          'Mine',
          'The Story Of Us',
          'Our Song',
          'Mean',
          "Back To December / Apologize / You're Not Sorry",
          'Better Than Revenge',
          'Speak Now',
          "Fearless / I'm Yours / Hey, Soul Sister",
          'Last Kiss',
          'You Belong With Me',
          'Dear John',
          'Enchanted',
          'Haunted',
          'Long Live',
          'Fifteen',
          'Love Story'
        ]
      }
    ]
  },
  {
    id: TOUR_IDS.fearless,
    name: 'Fearless Tour',
    status: TOUR_STATUS.ENDED,
    cover: '/assets/images/ui/avatar-placeholder.png',
    description:
      'Taylor 首次大型个人巡演，以青春、真诚与乡村流行气质为核心，奠定了她早期“少女叙事”式现场风格。',
    announcementAt: localDayTimestamp(2009, 1, 29),
    startAt: localDayTimestamp(2009, 4, 23),
    endAt: localDayTimestamp(2010, 7, 10),
    albumIds: [],
    setlists: [
      {
        label: '标准歌单',
        songs: [
          'You Belong With Me',
          'Our Song',
          'Tell Me Why',
          'Teardrops On My Guitar',
          'Fearless',
          'Forever & Always',
          'Hey Stephen',
          'Fifteen',
          'Tim McGraw',
          'White Horse',
          'Love Story',
          'The Way I Loved You',
          "You're Not Sorry",
          'Picture To Burn',
          "I'm Only Me When I'm With You",
          "Should've Said No"
        ]
      }
    ]
  }
];
