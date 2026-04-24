import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLiveVideoUpsertSql,
  findUncatalogedVideoFiles,
  LIVE_VIDEO_ENTRIES
} from '../scripts/liveVideoCatalog.mjs';

test('live video catalog includes the newly downloaded all too well performance', () => {
  const entry = LIVE_VIDEO_ENTRIES.find((item) => item.id === 'performance_all_too_well_grammys_2014');

  assert.deepEqual(entry, {
    id: 'performance_all_too_well_grammys_2014',
    title: 'All Too Well',
    songIds: ['40000108'],
    eventName: 'The 56th Annual GRAMMY Awards',
    duration: '5:44',
    videoFileName: '06_Taylor_Swift_-_All_Too_Well_Live_at_the_Grammy_56th_Awards_2014_4K_Remastered_by_Tayl.mp4'
  });
});

test('live video upsert sql writes video and derived cover uris for every catalog row', () => {
  const sql = buildLiveVideoUpsertSql();

  assert.match(sql, /INSERT OR REPLACE INTO live_videos/);
  assert.match(sql, /'performance_red_cma_2013'/);
  assert.match(sql, /'\/live\/01_Taylor_Swift_-_Red_The_47th_Annual_CMA_Awards_2013_-_HDTV\.mp4'/);
  assert.match(sql, /'\/live\/covers\/01_Taylor_Swift_-_Red_The_47th_Annual_CMA_Awards_2013_-_HDTV\.jpg'/);
  assert.match(sql, /'performance_all_too_well_grammys_2014'/);
  assert.match(sql, /'\/live\/06_Taylor_Swift_-_All_Too_Well_Live_at_the_Grammy_56th_Awards_2014_4K_Remastered_by_Tayl\.mp4'/);
  assert.match(sql, /'\/live\/covers\/06_Taylor_Swift_-_All_Too_Well_Live_at_the_Grammy_56th_Awards_2014_4K_Remastered_by_Tayl\.jpg'/);
});

test('live video catalog checker reports local videos that are not registered in metadata', () => {
  const uncataloged = findUncatalogedVideoFiles([
    '01_Taylor_Swift_-_Red_The_47th_Annual_CMA_Awards_2013_-_HDTV.mp4',
    '07_Taylor_Swift_-_Unknown_Live.mp4'
  ]);

  assert.deepEqual(uncataloged, ['07_Taylor_Swift_-_Unknown_Live.mp4']);
});
