import { ROUTES } from '../../utils/constants';
import { loadSinglesListPage, loadSongListPage, SongListItem } from '../../services/contentStore';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface SongListSection {
  letter: string;
  sectionId: string;
  songs: SongListItem[];
}

interface SongLetterIndexItem {
  letter: string;
  sectionId: string;
  disabled: boolean;
}

interface SongListData {
  songs: SongListItem[];
  sections: SongListSection[];
  letterIndexes: SongLetterIndexItem[];
  scrollIntoView: string;
  isLoading: boolean;
  loadError: boolean;
  title: string;
  subtitle: string;
  scope: 'all' | 'singles';
}

function normalizeSongName(name: string) {
  return name.trim().toUpperCase().replace(/^[^A-Z0-9]+/, '');
}

function getSongInitialLetter(name: string) {
  const matchedLetter = normalizeSongName(name).match(/[A-Z]/);
  return matchedLetter ? matchedLetter[0] : '#';
}

function sortSongsByName(songs: SongListItem[]) {
  return [...songs].sort((left, right) => {
    const normalizedCompare = normalizeSongName(left.name).localeCompare(normalizeSongName(right.name));

    if (normalizedCompare !== 0) {
      return normalizedCompare;
    }

    const nameCompare = left.name.toUpperCase().localeCompare(right.name.toUpperCase());
    if (nameCompare !== 0) {
      return nameCompare;
    }

    return left.id.localeCompare(right.id);
  });
}

function buildSongSections(songs: SongListItem[]) {
  const groupedSongs = new Map<string, SongListItem[]>();

  sortSongsByName(songs).forEach((song) => {
    const letter = getSongInitialLetter(song.name);
    const currentSongs = groupedSongs.get(letter) ?? [];
    currentSongs.push(song);
    groupedSongs.set(letter, currentSongs);
  });

  const orderedLetters = LETTERS.filter((letter) => groupedSongs.has(letter));
  if (groupedSongs.has('#')) {
    orderedLetters.push('#');
  }

  const sections = orderedLetters.map((letter) => {
    const sectionSongs = groupedSongs.get(letter) ?? [];
    return {
      letter,
      sectionId: `song-section-${letter.toLowerCase()}`,
      songs: sectionSongs
    };
  });

  const sectionIdMap = new Map(sections.map((section) => [section.letter, section.sectionId]));
  const letterIndexes = LETTERS.map((letter) => ({
    letter,
    sectionId: sectionIdMap.get(letter) ?? '',
    disabled: !sectionIdMap.has(letter)
  }));

  return {
    songs: sections.reduce<SongListItem[]>((result, section) => result.concat(section.songs), []),
    sections,
    letterIndexes
  };
}

Page({
  data: {
    songs: [],
    sections: [],
    letterIndexes: LETTERS.map((letter) => ({ letter, sectionId: '', disabled: true })),
    scrollIntoView: '',
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
      const { songs: sortedSongs, sections, letterIndexes } = buildSongSections(songs);
      this.setData({
        songs: sortedSongs,
        sections,
        letterIndexes,
        scrollIntoView: '',
        isLoading: false,
        loadError: false
      });
    } catch {
      this.setData({
        songs: [],
        sections: [],
        letterIndexes: LETTERS.map((letter) => ({ letter, sectionId: '', disabled: true })),
        scrollIntoView: '',
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
  },

  goLetter(event: { currentTarget: { dataset: { sectionId?: string } } }) {
    const sectionId = event.currentTarget.dataset.sectionId ?? '';
    if (!sectionId) {
      return;
    }

    if (this.data.scrollIntoView === sectionId) {
      this.setData({ scrollIntoView: '' });
    }

    this.setData({ scrollIntoView: sectionId });
  }
});
