export const LIVE_VIDEO_ENTRIES = [
  {
    id: 'performance_red_cma_2013',
    title: 'Red',
    songIds: ['40000099'],
    eventName: 'The 47th Annual CMA Awards',
    duration: '4:04',
    videoFileName: '01_Taylor_Swift_-_Red_The_47th_Annual_CMA_Awards_2013_-_HDTV.mp4'
  },
  {
    id: 'performance_wildest_dreams_grammy_museum',
    title: 'Wildest Dreams',
    songIds: ['40000062'],
    eventName: 'GRAMMY Museum',
    duration: '4:05',
    videoFileName: '02_Taylor_Performs_Wildest_Dreams_at_The_GRAMMY_Museum.mp4'
  },
  {
    id: 'performance_love_story_live_lounge',
    title: 'Love Story',
    songIds: ['40000129'],
    eventName: 'BBC Radio 1 Live Lounge',
    duration: '4:24',
    videoFileName: '03_Taylor_Swift_-_Love_Story_in_the_Live_Lounge.mp4'
  },
  {
    id: 'performance_wildest_dreams_enchanted_1989_tour',
    title: 'Wildest Dreams / Enchanted',
    songIds: ['40000062', '40000084'],
    eventName: 'The 1989 World Tour',
    duration: '6:31',
    videoFileName: '04_Remastered_4K_Wildest_Dreams_Enchanted_-_Taylor_Swift_1989_World_Tour_.mp4'
  },
  {
    id: 'performance_lover_snl_2019',
    title: 'Lover',
    songIds: ['40000189'],
    eventName: 'Saturday Night Live',
    duration: '3:50',
    videoFileName: '05_Taylor_Swift_-_Lover_Live_From_Saturday_Night_Live_2019.mp4'
  },
  {
    id: 'performance_all_too_well_grammys_2014',
    title: 'All Too Well',
    songIds: ['40000108'],
    eventName: 'The 56th Annual GRAMMY Awards',
    duration: '5:44',
    videoFileName: '06_Taylor_Swift_-_All_Too_Well_Live_at_the_Grammy_56th_Awards_2014_4K_Remastered_by_Tayl.mp4'
  }
];

const LIVE_VIDEO_PREFIX = '/live';
const LIVE_VIDEO_COVER_PREFIX = '/live/covers';

export function getCatalogVideoFileNames() {
  return LIVE_VIDEO_ENTRIES.map((entry) => entry.videoFileName);
}

export function findUncatalogedVideoFiles(fileNames) {
  const catalog = new Set(getCatalogVideoFileNames());
  return [...fileNames].filter((fileName) => !catalog.has(fileName)).sort();
}

function quoteSql(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function toCoverFileName(videoFileName) {
  return videoFileName.replace(/\.[^.]+$/, '.jpg');
}

export function buildLiveVideoUpsertSql() {
  const values = LIVE_VIDEO_ENTRIES.map((entry) => {
    const songIdsJson = JSON.stringify(entry.songIds);
    const videoUri = `${LIVE_VIDEO_PREFIX}/${entry.videoFileName}`;
    const coverUri = `${LIVE_VIDEO_COVER_PREFIX}/${toCoverFileName(entry.videoFileName)}`;

    return [
      '(',
      quoteSql(entry.id),
      ', ',
      quoteSql(entry.title),
      ', ',
      quoteSql(songIdsJson),
      ', ',
      quoteSql(entry.eventName),
      ', ',
      quoteSql(coverUri),
      ', ',
      quoteSql(entry.duration),
      ', ',
      quoteSql(videoUri),
      ')'
    ].join('');
  }).join(',\n  ');

  return [
    'INSERT OR REPLACE INTO live_videos (id, title, song_ids_json, event_name, cover, duration, video_uri)',
    'VALUES',
    `  ${values};`
  ].join('\n');
}
