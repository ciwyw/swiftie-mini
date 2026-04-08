import { ROUTES } from '../utils/constants';
import { EraExhibit, EraRouteAction } from '../types/era';

function albumAction(albumId: string): EraRouteAction {
  return { route: ROUTES.album, query: `id=${albumId}` };
}

function songAction(songId: string): EraRouteAction {
  return { route: ROUTES.song, query: `id=${songId}` };
}

export const eraExhibits: EraExhibit[] = [
  {
    id: 'era_taylor_swift',
    albumId: 'album_taylor_swift',
    eraName: 'Taylor Swift',
    hero: {
      yearLabel: '2006 Debut Era',
      intro: '青涩、真诚、把卧室日记写成第一批被世界听见的歌。',
      cover: '/assets/images/ui/avatar-placeholder.png',
      themeColor: '#d6c48f'
    },
    signatureLooks: [
      {
        id: 'look_debut_curls',
        title: '卷发与原木吉他',
        image: '/assets/images/ui/avatar-placeholder.png'
      },
      {
        id: 'look_debut_awards',
        title: '青绿色典礼礼服',
        image: '/assets/images/ui/avatar-placeholder.png'
      }
    ],
    milestones: [
      {
        id: 'debut_announce',
        dateLabel: '2006',
        title: '官宣专辑',
        summary: '以乡村少女创作歌手的姿态正式进入大众视野。',
        type: 'release',
        action: albumAction('album_taylor_swift')
      },
      {
        id: 'debut_single',
        dateLabel: 'Lead Single',
        title: '单曲打单',
        summary: 'Tim McGraw 很快成为最早建立个人叙事风格的代表作之一。',
        type: 'release',
        action: songAction('song_tim_mcgraw')
      },
      {
        id: 'debut_album',
        dateLabel: 'Album Release',
        title: '专辑发布',
        summary: '整专把“写自己的故事”固定成了 Debut 的核心记忆。',
        type: 'release',
        action: albumAction('album_taylor_swift')
      },
      {
        id: 'debut_breakout',
        dateLabel: 'Breakout',
        title: '青少年乡村受众快速积累',
        summary: '这一时期完成了最初粉丝基盘的搭建。',
        type: 'moment'
      }
    ],
    eraHonors: [
      {
        id: 'honor_debut_platinum',
        type: 'achievement',
        year: 2007,
        organization: 'RIAA',
        title: '首张同名专辑认证',
        result: 'Multi-Platinum'
      },
      {
        id: 'honor_debut_horizon',
        type: 'award',
        year: 2007,
        organization: 'Country Music Association',
        title: 'Horizon Award',
        result: 'Won'
      },
      {
        id: 'honor_debut_acm',
        type: 'award',
        year: 2008,
        organization: 'Academy of Country Music',
        title: 'Top New Female Vocalist',
        result: 'Won'
      }
    ],
    revisit: {
      performanceIds: []
    }
  },
  {
    id: 'era_fearless',
    albumId: 'album_fearless',
    eraName: 'Fearless',
    hero: {
      yearLabel: '2008-2009 Fearless Era',
      intro: '金色、心动、童话感与把青春叙事推向主流的突破期。',
      cover: '/assets/images/albums/album-fearless.png',
      themeColor: '#d4b15d'
    },
    signatureLooks: [
      {
        id: 'look_fearless_gold_dress',
        title: '金色旋转礼服',
        image: '/assets/images/albums/album-fearless.png'
      },
      {
        id: 'look_fearless_curls',
        title: '自然卷发舞台造型',
        image: '/assets/images/ui/avatar-placeholder.png'
      }
    ],
    milestones: [
      {
        id: 'fearless_announce',
        dateLabel: '2008',
        title: '官宣专辑',
        summary: '从新人期过渡到更明确的主流流行乡村姿态。',
        type: 'release',
        action: albumAction('album_fearless')
      },
      {
        id: 'fearless_love_story',
        dateLabel: 'Lead Single',
        title: '单曲打单',
        summary: 'Love Story 把青春叙事推到了更大的主流舞台。',
        type: 'release',
        action: songAction('song_love_story')
      },
      {
        id: 'fearless_album',
        dateLabel: 'Album Release',
        title: '专辑发布',
        summary: '时代气质、造型和故事表达开始形成完整品牌。',
        type: 'release',
        action: albumAction('album_fearless')
      },
      {
        id: 'fearless_breakthrough',
        dateLabel: 'Breakthrough',
        title: 'Fearless 成为主流突破点',
        summary: '这一时期让 Taylor 从潜力新人进入更广泛的大众视野。',
        type: 'award'
      }
    ],
    eraHonors: [
      {
        id: 'honor_fearless_grammy_album',
        type: 'award',
        year: 2010,
        organization: 'Grammy Awards',
        title: 'Album of the Year',
        result: 'Won'
      },
      {
        id: 'honor_fearless_grammy_country_album',
        type: 'award',
        year: 2010,
        organization: 'Grammy Awards',
        title: 'Best Country Album',
        result: 'Won'
      },
      {
        id: 'honor_fearless_billboard_200',
        type: 'achievement',
        year: 2009,
        organization: 'Billboard 200',
        title: '年度专辑表现',
        result: 'Year-End No.1'
      }
    ],
    revisit: {
      performanceIds: []
    }
  },
  {
    id: 'era_speak_now',
    albumId: 'album_speak_now',
    eraName: 'Speak Now',
    hero: {
      yearLabel: '2010 Speak Now Era',
      intro: '更明确的自我表达、更浓的舞台戏剧感，以及把青春胜利写成宣言的一页。',
      cover: '/assets/images/ui/avatar-placeholder.png',
      themeColor: '#8d69c9'
    },
    signatureLooks: [
      {
        id: 'look_speak_now_purple_gown',
        title: '紫色长裙舞台造型',
        image: '/assets/images/ui/avatar-placeholder.png'
      },
      {
        id: 'look_speak_now_storybook',
        title: '童话剧场感造型',
        image: '/assets/images/ui/avatar-placeholder.png'
      }
    ],
    milestones: [
      {
        id: 'speak_now_announce',
        dateLabel: '2010',
        title: '官宣专辑',
        summary: '时代气质转向更自信、更戏剧化的表达。',
        type: 'release',
        action: albumAction('album_speak_now')
      },
      {
        id: 'speak_now_mine',
        dateLabel: 'Lead Single',
        title: '单曲打单',
        summary: '用更明确的个人口吻开启 Speak Now 的自我表达主线。',
        type: 'release'
      },
      {
        id: 'speak_now_album',
        dateLabel: 'Album Release',
        title: '专辑发布',
        summary: '更强烈的个人表达推动了“自己发声”的时代主题。',
        type: 'release',
        action: albumAction('album_speak_now')
      },
      {
        id: 'speak_now_long_live',
        dateLabel: 'Fan Anthem',
        title: 'Long Live 成为时代代表之一',
        summary: '把胜利感、共同体和舞台记忆写成最具共鸣的宣言。',
        type: 'moment',
        action: songAction('song_long_live')
      }
    ],
    eraHonors: [
      {
        id: 'honor_speak_now_billboard_200',
        type: 'achievement',
        year: 2010,
        organization: 'Billboard 200',
        title: '首周空降冠军',
        result: 'No.1'
      },
      {
        id: 'honor_speak_now_tour',
        type: 'achievement',
        year: 2011,
        organization: 'Speak Now World Tour',
        title: '全球巡演扩张',
        result: 'World Arena Run'
      },
      {
        id: 'honor_speak_now_writing',
        type: 'achievement',
        year: 2010,
        organization: 'Album Credits',
        title: '全专独立创作',
        result: 'Sole Writer'
      }
    ],
    revisit: {
      performanceIds: []
    }
  },
  {
    id: 'era_red',
    albumId: 'album_red',
    eraName: 'Red',
    hero: {
      yearLabel: '2012-2021 Red Era',
      intro: '炽热、失控、红唇与秋日记忆，让情绪浓度第一次变成时代主角。',
      cover: '/assets/images/albums/album-red.png',
      themeColor: '#b44545'
    },
    signatureLooks: [
      {
        id: 'look_red_hat',
        title: '贝雷帽与复古秋日穿搭',
        image: '/assets/images/albums/album-red.png'
      },
      {
        id: 'look_red_red_lip',
        title: '红唇舞台造型',
        image: '/assets/images/ui/avatar-placeholder.png'
      }
    ],
    milestones: [
      {
        id: 'red_announce',
        dateLabel: '2012',
        title: '官宣专辑',
        summary: '比前一个 Era 更复杂、更成熟的情绪开始成为主题。',
        type: 'release',
        action: albumAction('album_red')
      },
      {
        id: 'red_we_are_never',
        dateLabel: 'Lead Single',
        title: '单曲打单',
        summary: '用最外放的流行姿态提前点燃了 Red 的讨论度。',
        type: 'release'
      },
      {
        id: 'red_album',
        dateLabel: 'Album Release',
        title: '专辑发布',
        summary: '风格跨度更大，也让情绪写作迈向更广泛的大众讨论。',
        type: 'release',
        action: albumAction('album_red')
      },
      {
        id: 'red_grammys',
        dateLabel: '2024 Grammys',
        title: 'All Too Well Grammy 舞台',
        summary: '多年后回看，这场表演进一步巩固了 Red 的时代神话。',
        type: 'performance'
      }
    ],
    eraHonors: [
      {
        id: 'honor_red_billboard_200',
        type: 'achievement',
        year: 2012,
        organization: 'Billboard 200',
        title: '首周空降冠军',
        result: 'No.1'
      },
      {
        id: 'honor_red_all_too_well_legacy',
        type: 'achievement',
        year: 2021,
        organization: 'Fan Legacy',
        title: 'All Too Well 长期成为时代代表',
        result: 'Signature Song'
      },
      {
        id: 'honor_red_tv',
        type: 'achievement',
        year: 2021,
        organization: 'Billboard 200',
        title: 'Red (Taylor’s Version)',
        result: 'No.1'
      }
    ],
    revisit: {
      performanceIds: ['performance_grammys_all_too_well', 'performance_bbc_holy_ground']
    }
  },
  {
    id: 'era_1989',
    albumId: 'album_1989',
    eraName: '1989',
    hero: {
      yearLabel: '2014 1989 Era',
      intro: '城市霓虹、宝丽来、流行锋芒与彻底转身的自信时刻。',
      cover: '/assets/images/ui/avatar-placeholder.png',
      themeColor: '#7ab5d6'
    },
    signatureLooks: [
      {
        id: 'look_1989_crop_set',
        title: '短上衣与两件套舞台造型',
        image: '/assets/images/ui/avatar-placeholder.png'
      },
      {
        id: 'look_1989_city_pop',
        title: '城市感街拍造型',
        image: '/assets/images/ui/avatar-placeholder.png'
      }
    ],
    milestones: [
      {
        id: '1989_announce',
        dateLabel: '2014',
        title: '官宣专辑',
        summary: '时代重心正式转向更纯粹的流行表达。',
        type: 'release',
        action: albumAction('album_1989')
      },
      {
        id: '1989_shake_it_off',
        dateLabel: 'Lead Single',
        title: '单曲打单',
        summary: '以最鲜明的流行姿态宣布 1989 的到来。',
        type: 'release'
      },
      {
        id: '1989_album',
        dateLabel: 'Album Release',
        title: '专辑发布',
        summary: '宝丽来、城市感和高完成度流行制作完成时代定型。',
        type: 'release',
        action: albumAction('album_1989')
      },
      {
        id: '1989_new_romantics',
        dateLabel: 'Fan Favorite',
        title: 'New Romantics 成为时代代表之一',
        summary: '这首歌延续了 1989 的都市青春气质。',
        type: 'moment',
        action: songAction('song_new_romantics')
      }
    ],
    eraHonors: [
      {
        id: 'honor_1989_grammy_album',
        type: 'award',
        year: 2016,
        organization: 'Grammy Awards',
        title: 'Album of the Year',
        result: 'Won'
      },
      {
        id: 'honor_1989_grammy_pop_album',
        type: 'award',
        year: 2016,
        organization: 'Grammy Awards',
        title: 'Best Pop Vocal Album',
        result: 'Won'
      },
      {
        id: 'honor_1989_billboard_200',
        type: 'achievement',
        year: 2014,
        organization: 'Billboard 200',
        title: '首周空降冠军',
        result: 'No.1'
      }
    ],
    revisit: {
      performanceIds: []
    }
  },
  {
    id: 'era_folklore',
    albumId: 'album_folklore',
    eraName: 'folklore',
    hero: {
      yearLabel: '2020 folklore Era',
      intro: '树林、耳语、虚构叙事与把流行明星身份重新藏进故事里的时期。',
      cover: '/assets/images/ui/avatar-placeholder.png',
      themeColor: '#7b7b7b'
    },
    signatureLooks: [
      {
        id: 'look_folklore_knit',
        title: '针织开衫与灰调造型',
        image: '/assets/images/ui/avatar-placeholder.png'
      },
      {
        id: 'look_folklore_forest',
        title: '森林感黑白视觉',
        image: '/assets/images/ui/avatar-placeholder.png'
      }
    ],
    milestones: [
      {
        id: 'folklore_announce',
        dateLabel: '2020',
        title: '官宣专辑',
        summary: '以极低预热的方式宣布了这一阶段的突然转向。',
        type: 'release',
        action: albumAction('album_folklore')
      },
      {
        id: 'folklore_cardigan',
        dateLabel: 'Lead Single',
        title: '单曲打单',
        summary: 'cardigan 为 folklore 的灰调叙事定下了入口。',
        type: 'release'
      },
      {
        id: 'folklore_album',
        dateLabel: 'Album Release',
        title: '专辑发布',
        summary: '从私人日记向更角色化的叙事方式迈进。',
        type: 'release',
        action: albumAction('album_folklore')
      },
      {
        id: 'folklore_storytelling',
        dateLabel: 'Identity Shift',
        title: '故事化写作被进一步强化',
        summary: '这是她叙事能力被重新评价的重要节点。',
        type: 'award'
      }
    ],
    eraHonors: [
      {
        id: 'honor_folklore_grammy_album',
        type: 'award',
        year: 2021,
        organization: 'Grammy Awards',
        title: 'Album of the Year',
        result: 'Won'
      },
      {
        id: 'honor_folklore_grammy_alt_album',
        type: 'award',
        year: 2021,
        organization: 'Grammy Awards',
        title: 'Best Alternative Music Album',
        result: 'Won'
      },
      {
        id: 'honor_folklore_long_pond',
        type: 'achievement',
        year: 2020,
        organization: 'Disney+',
        title: 'Long Pond Sessions',
        result: 'Defining Revisit'
      }
    ],
    revisit: {
      performanceIds: ['performance_long_pond_session']
    }
  },
  {
    id: 'era_midnights',
    albumId: 'album_midnights',
    eraName: 'Midnights',
    hero: {
      yearLabel: '2022 Midnights Era',
      intro: '午夜蓝、清醒独白、镜像自省与既华丽又不安的深夜思绪。',
      cover: '/assets/images/albums/album-midnights.png',
      themeColor: '#324765'
    },
    signatureLooks: [
      {
        id: 'look_midnights_glitter',
        title: '亮片与深夜秀场感造型',
        image: '/assets/images/albums/album-midnights.png'
      },
      {
        id: 'look_midnights_retro',
        title: '复古午夜妆造',
        image: '/assets/images/ui/avatar-placeholder.png'
      }
    ],
    milestones: [
      {
        id: 'midnights_announce',
        dateLabel: '2022',
        title: '官宣专辑',
        summary: '从概念阶段就明确了“午夜思绪”这一核心设定。',
        type: 'release',
        action: albumAction('album_midnights')
      },
      {
        id: 'midnights_anti_hero',
        dateLabel: 'Lead Single',
        title: '单曲打单',
        summary: 'Anti-Hero 把这一 Era 最直接的自我剖白推到最前面。',
        type: 'release',
        action: songAction('song_anti_hero')
      },
      {
        id: 'midnights_album',
        dateLabel: 'Album Release',
        title: '专辑发布',
        summary: '华丽感与脆弱感并行，成为 Midnights 最有辨识度的组合。',
        type: 'release',
        action: albumAction('album_midnights')
      },
      {
        id: 'midnights_iheart',
        dateLabel: '2023 iHeart',
        title: '电视舞台延续时代视觉',
        summary: '这场演出把 Midnights 的配色和舞台氛围继续推到了电视语境。',
        type: 'performance'
      }
    ],
    eraHonors: [
      {
        id: 'honor_midnights_pop_vocal_album',
        type: 'award',
        year: 2024,
        organization: 'Grammy Awards',
        title: 'Best Pop Vocal Album',
        result: 'Won'
      },
      {
        id: 'honor_midnights_hot_100_top_ten',
        type: 'achievement',
        year: 2022,
        organization: 'Billboard Hot 100',
        title: '前十占十',
        result: '历史首位'
      },
      {
        id: 'honor_midnights_billboard_200',
        type: 'achievement',
        year: 2022,
        organization: 'Billboard 200',
        title: '首周空降冠军',
        result: 'No.1'
      },
      {
        id: 'honor_midnights_ifpi',
        type: 'achievement',
        year: 2023,
        organization: 'IFPI',
        title: 'Global Album Chart',
        result: 'Year-End No.1'
      }
    ],
    revisit: {
      performanceIds: ['performance_iheart_anti_hero', 'performance_midnights_release_interview']
    }
  }
];
