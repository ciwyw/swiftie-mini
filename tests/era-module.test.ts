import test from 'node:test';
import assert from 'node:assert/strict';
import { eraExhibits } from '../data/eraExhibits';
import { homeEraCards } from '../data/home';
import { getEraExhibitDetailById } from '../utils/eraSelectors';

test('getEraExhibitDetailById resolves the Midnights archive contract', () => {
  const detail = getEraExhibitDetailById('era_midnights');

  assert.ok(detail);
  assert.equal('revisit' in detail, false);
  assert.equal(detail?.album?.id, 'album_midnights');
  assert.deepEqual(detail?.signatureLooks[0], {
    id: 'look_midnights_glitter',
    title: '亮片与深夜秀场感造型',
    image: '/assets/images/albums/album-midnights.png'
  });
  assert.deepEqual(
    detail?.featuredHonors.map((item) => item.id),
    [
      'honor_midnights_pop_vocal_album',
      'honor_midnights_hot_100_top_ten',
      'honor_midnights_billboard_200'
    ]
  );
  assert.equal(detail?.remainingHonors.length, 1);
  assert.deepEqual(
    detail?.performances.map((item) => ({ id: item.id, kind: item.kind })),
    [
      { id: 'performance_iheart_anti_hero', kind: 'live' },
      { id: 'performance_midnights_release_interview', kind: 'interview' }
    ]
  );
  assert.equal(detail?.milestones[0]?.title, '官宣专辑');
  assert.equal(detail?.milestones[1]?.title, '单曲打单');
  assert.equal(detail?.milestones[2]?.title, '专辑发布');
});

test('getEraExhibitDetailById keeps the archive shape when references are missing', () => {
  const detail = getEraExhibitDetailById('era_taylor_swift');

  assert.ok(detail);
  assert.deepEqual(detail?.performances, []);
  assert.equal(detail?.featuredHonors.length, 3);
  assert.equal(detail?.remainingHonors.length, 0);
  assert.equal(detail?.signatureLooks[0]?.title, '卷发与原木吉他');
});

test('getEraExhibitDetailById resolves revisit-only archive records for Red and folklore', () => {
  const red = getEraExhibitDetailById('era_red');
  const folklore = getEraExhibitDetailById('era_folklore');

  assert.ok(red);
  assert.ok(folklore);
  assert.deepEqual(red?.performances.map((item) => item.id), [
    'performance_grammys_all_too_well',
    'performance_bbc_holy_ground'
  ]);
  assert.deepEqual(folklore?.performances.map((item) => ({ id: item.id, kind: item.kind })), [
    { id: 'performance_long_pond_session', kind: 'special' }
  ]);
});

test('era exhibit seeds stay aligned with homepage ids and archive requirements', () => {
  assert.equal(eraExhibits.length, 7);
  assert.deepEqual(
    eraExhibits.map((item) => item.id),
    homeEraCards.map((item) => item.id)
  );

  eraExhibits.forEach((item) => {
    assert.ok(item.eraHonors.length >= 3);
    assert.equal(item.milestones[0]?.title, '官宣专辑');
    assert.equal(item.milestones[1]?.title, '单曲打单');
    assert.equal(item.milestones[2]?.title, '专辑发布');
  });
});

test('single release milestones without seeded songs do not point to album pages', () => {
  const unlinkedSingleMilestones = ['era_speak_now', 'era_red', 'era_1989', 'era_folklore'].map((id) =>
    eraExhibits.find((item) => item.id === id)?.milestones[1]
  );

  assert.deepEqual(
    unlinkedSingleMilestones.map((item) => item?.action),
    [undefined, undefined, undefined, undefined]
  );
});

test('era detail page controller loads archive state and opens honor/revisit interactions', async () => {
  type EraDetailPageConfig = {
    data: {
      exhibit: ReturnType<typeof getEraExhibitDetailById> | null;
      hasError: boolean;
      isHonorSheetOpen: boolean;
    };
    setData: (patch: Partial<EraDetailPageConfig['data']>) => void;
    onLoad: (options: { id?: string }) => void;
    goRoute: (event: { currentTarget: { dataset: { route?: string; query?: string } } }) => void;
    openHonorSheet: () => void;
    closeHonorSheet: () => void;
    openRevisitItem: (event: {
      currentTarget: {
        dataset: {
          kind: 'live' | 'interview' | 'special';
          title: string;
          subtitle?: string;
          meta?: string;
          summary?: string;
        };
      };
    }) => void;
  };

  const runtimeGlobal = globalThis as typeof globalThis & {
    Page?: typeof Page;
    wx?: typeof wx;
  };
  const originalPage = runtimeGlobal.Page;
  const originalWx = runtimeGlobal.wx;
  const showModalCalls: Array<{
    title: string;
    content: string;
    showCancel: boolean;
    confirmText: string;
  }> = [];
  const navigateToCalls: Array<{ url: string }> = [];
  let pageConfig: EraDetailPageConfig | undefined;

  runtimeGlobal.Page = ((config: EraDetailPageConfig) => {
    pageConfig = config;
  }) as typeof Page;
  runtimeGlobal.wx = {
    navigateTo(options: { url: string }) {
      navigateToCalls.push(options);
    },
    showModal(options: {
      title: string;
      content: string;
      showCancel: boolean;
      confirmText: string;
    }) {
      showModalCalls.push(options);
    }
  } as unknown as typeof wx;

  try {
    await import('../pages/era/detail/index');
    assert.ok(pageConfig);

    pageConfig.setData = function setData(patch) {
      this.data = { ...this.data, ...patch };
    };

    pageConfig.onLoad.call(pageConfig, { id: 'era_midnights' });
    assert.equal(pageConfig.data.isHonorSheetOpen, false);
    assert.equal(pageConfig.data.exhibit?.featuredHonors.length, 3);
    assert.equal(pageConfig.data.exhibit?.remainingHonors.length, 1);

    pageConfig.openHonorSheet.call(pageConfig);
    assert.equal(pageConfig.data.isHonorSheetOpen, true);

    pageConfig.closeHonorSheet.call(pageConfig);
    assert.equal(pageConfig.data.isHonorSheetOpen, false);

    pageConfig.goRoute({
      currentTarget: {
        dataset: {
          route: '/pages/album/index',
          query: 'id=album_midnights'
        }
      }
    });

    pageConfig.openRevisitItem({
      currentTarget: {
        dataset: {
          kind: 'interview',
          title: 'Midnights Release Week Interview',
          subtitle: 'iHeartRadio Interview · 2022',
          meta: 'iHeartRadio · 12:40',
          summary: 'A release-week conversation focused on the album’s sleepless-night concept.'
        }
      }
    });

    assert.deepEqual(navigateToCalls, [{ url: '/pages/album/index?id=album_midnights' }]);
    assert.deepEqual(showModalCalls, [
      {
        title: '时代回看',
        content:
          '采访\nMidnights Release Week Interview\niHeartRadio Interview · 2022\niHeartRadio · 12:40\nA release-week conversation focused on the album’s sleepless-night concept.\n暂未接入完整内容页，这里先作为可点击入口。',
        showCancel: false,
        confirmText: '知道了'
      }
    ]);

    pageConfig.onLoad.call(pageConfig, {});
    assert.equal(pageConfig.data.hasError, true);
    assert.equal(pageConfig.data.exhibit, null);
    assert.equal(pageConfig.data.isHonorSheetOpen, false);

    pageConfig.onLoad.call(pageConfig, { id: 'era_unknown' });
    assert.equal(pageConfig.data.hasError, true);
    assert.equal(pageConfig.data.exhibit, null);
    assert.equal(pageConfig.data.isHonorSheetOpen, false);
  } finally {
    runtimeGlobal.Page = originalPage;
    runtimeGlobal.wx = originalWx;
  }
});
