import { Song } from '../types/song';

export const songs: Song[] = [
  {
    id: 'song_love_story',
    name: 'Love Story',
    albumId: 'album_fearless',
    lyrics: [
      { en: 'We were both young when I first saw you.', zh: '我们初次相见时都还年少。' },
      { en: 'I close my eyes and the flashback starts.', zh: '我闭上眼，回忆便开始闪回。' },
      { en: 'You were Romeo, you were throwing pebbles.', zh: '你像罗密欧，向我窗前抛来小石子。' },
      { en: 'Romeo, take me somewhere we can be alone.', zh: '罗密欧，带我去一个只有我们的地方。' }
    ]
  },
  {
    id: 'song_all_too_well',
    name: 'All Too Well',
    albumId: 'album_red',
    mv: {
      title: 'All Too Well: The Short Film',
      cover: '/assets/images/ui/avatar-placeholder.png',
      source: 'YouTube',
      duration: '14:56'
    },
    lyrics: [
      { en: 'I walked through the door with you, the air was cold.', zh: '我和你走进门，空气微凉。' },
      { en: 'And I know it\'s long gone and that magic\'s not here no more.', zh: '我知道一切早已远去，魔法也不再。' },
      { en: 'Time won\'t fly, it\'s like I\'m paralyzed by it.', zh: '时间没有飞逝，我像被它困住。' },
      { en: 'I remember it all too well.', zh: '我把一切都记得太清楚。' }
    ]
  },
  {
    id: 'song_anti_hero',
    name: 'Anti-Hero',
    albumId: 'album_midnights',
    mv: {
      title: 'Anti-Hero (Official Music Video)',
      cover: '/assets/images/ui/avatar-placeholder.png',
      source: 'YouTube',
      duration: '5:10'
    },
    lyrics: [
      { en: 'I have this thing where I get older but just never wiser.', zh: '我总在变老，却似乎从未更睿智。' },
      { en: 'It\'s me, hi, I\'m the problem, it\'s me.', zh: '是我，嗨，问题就在我身上。' },
      { en: 'At tea time, everybody agrees.', zh: '下午茶时分，所有人都同意。' },
      { en: 'I should not be left to my own devices.', zh: '我不该被放任独自面对自己。' }
    ]
  },
  {
    id: 'song_tim_mcgraw',
    name: 'Tim McGraw',
    albumId: 'album_taylor_swift',
    lyrics: [
      { en: 'When you think Tim McGraw, I hope you think of me.', zh: '当你想起 Tim McGraw，希望你也会想起我。' }
    ]
  },
  {
    id: 'song_mirrorball',
    name: 'mirrorball',
    albumId: 'album_folklore',
    lyrics: [
      { en: 'I can change everything about me to fit in.', zh: '我可以改变自己的一切去融入其中。' }
    ]
  },
  {
    id: 'song_dear_reader',
    name: 'Dear Reader',
    albumId: 'album_midnights',
    lyrics: [
      { en: 'Dear reader, if it feels like a trap, you are already in one.', zh: '亲爱的读者，若你觉得那像陷阱，你其实已经身在其中。' }
    ]
  },
  {
    id: 'song_holy_ground',
    name: 'Holy Ground',
    albumId: 'album_red',
    lyrics: [
      { en: 'Tonight I am dancing for all that we\'ve been through.', zh: '今晚我为我们经历的一切起舞。' }
    ]
  },
  {
    id: 'song_long_live',
    name: 'Long Live',
    albumId: 'album_speak_now',
    lyrics: [
      { en: 'Long live the walls we crashed through.', zh: '愿我们冲破的高墙永远长存。' }
    ]
  },
  {
    id: 'song_new_romantics',
    name: 'New Romantics',
    albumId: 'album_1989',
    lyrics: [
      { en: 'Baby, we\'re the new romantics.', zh: '亲爱的，我们就是新浪漫主义。' }
    ]
  }
];
