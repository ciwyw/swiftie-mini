interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  DB: D1DatabaseLike;
}

interface HomeAction {
  type: 'switchTab' | 'navigateTo';
  route: string;
  query?: string;
}

interface AlbumRecord {
  id: string;
  name: string;
  year: number;
  cover: string;
  announcement_at: number | null;
  release_at: number | null;
  kind: 'album' | 'singles';
}

interface NewsRecord {
  id: string;
  title: string;
  published_at: number;
  summary: string;
  tag: string;
  action_type: HomeAction['type'];
  action_route: string;
  action_query: string | null;
}

interface EraRecord {
  id: string;
  album_id: string;
  era_name: string;
  cover: string;
  theme_color: string;
  tagline: string;
  hero_intro: string;
  signature_looks_json: string;
  milestones_json: string;
  era_honors_json: string;
  revisit_performance_ids_json: string;
}

interface SongRecord {
  id: string;
  name: string;
  album_id: string | null;
  duration_ms: number | null;
  lyrics_json: string;
  mv_json: string | null;
}

interface EditionRecord {
  id: string;
  album_id: string;
  name: string;
  is_primary: 0 | 1;
  release_at: number | null;
}

interface AlbumSongSectionRecord {
  edition_id: string;
  edition_album_id: string;
  edition_name: string;
  edition_is_primary: 0 | 1;
  edition_release_at: number | null;
  song_id: string | null;
  song_name: string | null;
  song_album_id: string | null;
  song_disc_no: number | null;
  song_track_no: number | null;
  song_display_name: string | null;
  song_duration_ms: number | null;
  song_lyrics_json: string | null;
  song_mv_json: string | null;
}

interface PerformanceRecord {
  id: string;
  title: string;
  song_ids_json: string;
  kind: 'live' | 'interview' | 'special';
  domain: 'library' | 'tour';
  event_name: string;
  year: number;
  cover: string;
  source: string;
  duration: string;
  summary: string;
}

interface DocumentaryRecord {
  id: string;
  title: string;
  year: number;
  category: 'documentary' | 'concert-film' | 'special';
  cover: string;
  platform: string;
  duration: string;
  summary: string;
  related_song_ids_json: string;
}

interface TourRecord {
  id: string;
  name: string;
  status: 0 | 1 | 2;
  cover: string;
  description: string;
  announcement_at: number | null;
  start_at: number;
  end_at: number;
  total: number;
  cancelled: number;
  album_ids_json: string | null;
  setlists_json: string;
}

interface ShowRecord {
  id: string;
  tour_id: string;
  country: string;
  city: string;
  venue: string;
  start_at: number;
  status: 'upcoming' | 'ongoing' | 'ended' | 'cancelled';
  opening_act: string | null;
  ticket_platform: string | null;
  sale_at: number | null;
  entry_time: string | null;
  address: string | null;
  seat_map_images_json: string | null;
  notes_json: string | null;
  surprise_guests_json: string | null;
  surprise_songs_json: string | null;
}

interface VideoRecord {
  id: string;
  show_id: string;
  title: string;
  cover: string;
  song: string | null;
  user_name: string;
  uploaded_at: number;
}

enum HomeSpotlightType {
  AlbumPreview = 'album_preview',
  AlbumReleaseWeek = 'album_release_week',
  TourPreview = 'tour_preview',
  TourOngoing = 'tour_ongoing'
}

const IMAGE_CDN_BASE_URL = 'https://pub-2fe074c99d71462789f5f5161ee1d03c.r2.dev';
const IMAGE_URL_SCHEME_PATTERN = /^(?:https?:)?\/\//i;
const IMAGE_DATA_URL_PATTERN = /^(?:data|wxfile|cloud):/i;
const IMAGE_FILE_PATH_PATTERN = /^\/[^?#]+\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i;

const ROUTES = {
  album: '/pages/album/index',
  tourDetail: '/pages/tour/detail/index',
  eraDetail: '/pages/era/detail/index'
} as const;

const HOME_SPOTLIGHT_PRIORITY: Record<HomeSpotlightType, number> = {
  [HomeSpotlightType.AlbumPreview]: 0,
  [HomeSpotlightType.TourPreview]: 1,
  [HomeSpotlightType.AlbumReleaseWeek]: 2,
  [HomeSpotlightType.TourOngoing]: 3
};

function json<T>(data: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init?.headers
    }
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function prefixImagePath(value: string): string {
  if (IMAGE_URL_SCHEME_PATTERN.test(value) || IMAGE_DATA_URL_PATTERN.test(value)) {
    return value;
  }

  if (!IMAGE_FILE_PATH_PATTERN.test(value)) {
    return value;
  }

  return `${IMAGE_CDN_BASE_URL}${value}`;
}

function normalizeImageFields<T>(value: T): T {
  if (typeof value === 'string') {
    return prefixImagePath(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeImageFields(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, item]) => {
      acc[key] = normalizeImageFields(item);
      return acc;
    }, {}) as T;
  }

  return value;
}

function success<T>(data: T, init?: ResponseInit): Response {
  return json(
    {
      code: 0,
      data: normalizeImageFields(data)
    },
    init
  );
}

function failure(status: number): Response {
  return json(
    {
      code: -1,
      data: null
    },
    { status }
  );
}

function notFound(): Response {
  return failure(404);
}

function getTodayTimestamp(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function addDays(timestamp: number, days: number): number {
  const value = new Date(timestamp);
  value.setDate(value.getDate() + days);
  return value.getTime();
}

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) {
    return [];
  }

  return JSON.parse(value) as T[];
}

function parseJsonObject<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  return JSON.parse(value) as T;
}

function mapSurpriseSongs(value: string | null) {
  const items = parseJsonArray<unknown>(value);

  return items.flatMap((item) => {
    if (typeof item === 'string') {
      return item ? [{ name: item }] : [];
    }

    if (!isPlainObject(item) || typeof item.name !== 'string' || !item.name) {
      return [];
    }

    return [
      {
        name: item.name,
        songId: typeof item.songId === 'string' && item.songId ? item.songId : undefined
      }
    ];
  });
}

function createAction(route: string, query?: string): HomeAction {
  return {
    type: 'navigateTo',
    route,
    query
  };
}

function getSpotlightPriority(type: HomeSpotlightType): number {
  return HOME_SPOTLIGHT_PRIORITY[type];
}

function deriveHomeSpotlights(albums: AlbumRecord[], tours: TourRecord[], today = getTodayTimestamp()) {
  const albumSpotlights = albums.flatMap((album) => {
    if (!album.announcement_at || !album.release_at) {
      return [];
    }

    if (today >= album.announcement_at && today < album.release_at) {
      return [
        {
          id: `spotlight_${album.id}_${HomeSpotlightType.AlbumPreview}`,
          type: HomeSpotlightType.AlbumPreview,
          entityId: album.id,
          name: album.name,
          cover: album.cover,
          startAt: album.announcement_at,
          endAt: addDays(album.release_at, -1),
          action: createAction(ROUTES.album, `id=${album.id}`)
        }
      ];
    }

    const releaseWeekEnd = addDays(album.release_at, 6);
    if (today >= album.release_at && today <= releaseWeekEnd) {
      return [
        {
          id: `spotlight_${album.id}_${HomeSpotlightType.AlbumReleaseWeek}`,
          type: HomeSpotlightType.AlbumReleaseWeek,
          entityId: album.id,
          name: album.name,
          cover: album.cover,
          startAt: album.release_at,
          endAt: releaseWeekEnd,
          action: createAction(ROUTES.album, `id=${album.id}`)
        }
      ];
    }

    return [];
  });

  const tourSpotlights = tours.flatMap((tour) => {
    if (tour.announcement_at && today >= tour.announcement_at && today < tour.start_at) {
      return [
        {
          id: `spotlight_${tour.id}_${HomeSpotlightType.TourPreview}`,
          type: HomeSpotlightType.TourPreview,
          entityId: tour.id,
          name: tour.name,
          cover: tour.cover,
          startAt: tour.announcement_at,
          endAt: addDays(tour.start_at, -1),
          action: createAction(ROUTES.tourDetail, `id=${tour.id}`)
        }
      ];
    }

    if (today >= tour.start_at && today <= tour.end_at) {
      return [
        {
          id: `spotlight_${tour.id}_${HomeSpotlightType.TourOngoing}`,
          type: HomeSpotlightType.TourOngoing,
          entityId: tour.id,
          name: tour.name,
          cover: tour.cover,
          startAt: tour.start_at,
          endAt: tour.end_at,
          action: createAction(ROUTES.tourDetail, `id=${tour.id}`)
        }
      ];
    }

    return [];
  });

  return [...albumSpotlights, ...tourSpotlights].sort((left, right) => {
    const startComparison = right.startAt - left.startAt;
    if (startComparison !== 0) {
      return startComparison;
    }

    return getSpotlightPriority(left.type) - getSpotlightPriority(right.type);
  });
}

async function queryAll<T>(db: D1DatabaseLike, query: string, ...params: unknown[]): Promise<T[]> {
  const statement = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query);
  const result = await statement.all<T>();
  return result.results;
}

async function queryFirst<T>(db: D1DatabaseLike, query: string, ...params: unknown[]): Promise<T | null> {
  const statement = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query);
  return statement.first<T>();
}

function mapAction(record: NewsRecord): HomeAction {
  return {
    type: record.action_type,
    route: record.action_route,
    query: record.action_query ?? undefined
  };
}

function mapAlbum(record: AlbumRecord) {
  return {
    id: record.id,
    name: record.name,
    year: record.year,
    cover: record.cover,
    announcementAt: record.announcement_at ?? undefined,
    releaseAt: record.release_at ?? undefined,
    kind: record.kind
  };
}

function mapSong(record: SongRecord) {
  return {
    id: record.id,
    name: record.name,
    albumId: record.album_id ?? undefined,
    durationMs: typeof record.duration_ms === 'number' ? record.duration_ms : undefined,
    lyrics: parseJsonArray(record.lyrics_json),
    mv: parseJsonObject(record.mv_json) ?? undefined
  };
}

function mapEdition(record: EditionRecord) {
  return {
    id: record.id,
    albumId: record.album_id,
    name: record.name,
    isPrimary: record.is_primary === 1,
    releaseAt: record.release_at ?? undefined
  };
}

function mapTrack(record: {
  edition_id: string;
  song_id: string;
  disc_no: number;
  track_no: number | null;
  display_name: string | null;
}) {
  return {
    editionId: record.edition_id,
    songId: record.song_id,
    discNo: record.disc_no,
    trackNo: record.track_no ?? undefined,
    displayName: record.display_name ?? undefined
  };
}

function mapPerformance(record: PerformanceRecord) {
  return {
    id: record.id,
    title: record.title,
    songIds: parseJsonArray<string>(record.song_ids_json),
    kind: record.kind,
    domain: record.domain,
    eventName: record.event_name,
    year: record.year,
    cover: record.cover,
    source: record.source,
    duration: record.duration,
    summary: record.summary
  };
}

function mapDocumentary(record: DocumentaryRecord) {
  return {
    id: record.id,
    title: record.title,
    year: record.year,
    category: record.category,
    cover: record.cover,
    platform: record.platform,
    duration: record.duration,
    summary: record.summary,
    relatedSongIds: parseJsonArray<string>(record.related_song_ids_json)
  };
}

function mapEra(record: EraRecord) {
  return {
    id: record.id,
    albumId: record.album_id,
    eraName: record.era_name,
    hero: {
      intro: record.hero_intro,
      cover: record.cover,
      themeColor: record.theme_color
    },
    signatureLooks: parseJsonArray(record.signature_looks_json),
    milestones: parseJsonArray(record.milestones_json),
    eraHonors: parseJsonArray(record.era_honors_json),
    revisit: {
      performanceIds: parseJsonArray<string>(record.revisit_performance_ids_json)
    }
  };
}

function mapHomeEraCard(record: EraRecord) {
  return {
    id: record.id,
    albumId: record.album_id,
    name: record.era_name,
    cover: record.cover,
    themeColor: record.theme_color,
    tagline: record.tagline,
    action: createAction(ROUTES.eraDetail, `id=${record.id}`)
  };
}

function mapTour(record: TourRecord) {
  return {
    id: record.id,
    name: record.name,
    status: record.status,
    cover: record.cover,
    description: record.description,
    announcementAt: record.announcement_at ?? undefined,
    startAt: record.start_at,
    endAt: record.end_at,
    total: record.total,
    cancelled: record.cancelled,
    albumIds: parseJsonArray<string>(record.album_ids_json),
    setlists: parseJsonArray(record.setlists_json)
  };
}

function mapShow(record: ShowRecord) {
  return {
    id: record.id,
    tourId: record.tour_id,
    country: record.country,
    city: record.city,
    venue: record.venue,
    startAt: record.start_at,
    status: record.status,
    openingAct: record.opening_act ?? undefined,
    ticketPlatform: record.ticket_platform ?? undefined,
    saleAt: record.sale_at ?? undefined,
    entryTime: record.entry_time ?? undefined,
    address: record.address ?? undefined,
    seatMapImages: parseJsonArray<string>(record.seat_map_images_json),
    notes: parseJsonArray<string>(record.notes_json),
    surpriseGuests: parseJsonArray(record.surprise_guests_json),
    surpriseSongs: mapSurpriseSongs(record.surprise_songs_json)
  };
}

function mapVideo(record: VideoRecord) {
  return {
    id: record.id,
    showId: record.show_id,
    title: record.title,
    cover: record.cover,
    song: record.song ?? undefined,
    userName: record.user_name,
    uploadedAt: record.uploaded_at
  };
}

async function handleHome(db: D1DatabaseLike): Promise<Response> {
  const [albums, tours, eras, news] = await Promise.all([
    queryAll<AlbumRecord>(db, "SELECT id, name, year, cover, announcement_at, release_at, kind FROM albums WHERE kind = 'album' ORDER BY year ASC, id ASC"),
    queryAll<TourRecord>(db, 'SELECT id, name, status, cover, description, announcement_at, start_at, end_at, total, cancelled, album_ids_json, setlists_json FROM tours ORDER BY start_at DESC, id ASC'),
    queryAll<EraRecord>(db, 'SELECT id, album_id, era_name, cover, theme_color, tagline, hero_intro, signature_looks_json, milestones_json, era_honors_json, revisit_performance_ids_json FROM eras ORDER BY rowid ASC'),
    queryAll<NewsRecord>(db, 'SELECT id, title, published_at, summary, tag, action_type, action_route, action_query FROM news_items ORDER BY published_at DESC, id ASC LIMIT 3')
  ]);

  return success({
    spotlights: deriveHomeSpotlights(albums, tours),
    eras: eras.map(mapHomeEraCard),
    news: news.map((item) => ({
      id: item.id,
      title: item.title,
      publishedAt: item.published_at,
      summary: item.summary,
      tag: item.tag,
      action: mapAction(item)
    }))
  });
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return failure(405);
  }

  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === '/health') {
    return success({ ok: true });
  }

  if (pathname === '/home') {
    return handleHome(env.DB);
  }

  const albumSongsMatch = pathname.match(/^\/albums\/([^/]+)\/songs$/);
  if (albumSongsMatch) {
    const albumId = albumSongsMatch[1];
    const editions = await queryAll<EditionRecord>(
      env.DB,
      'SELECT id, album_id, name, is_primary, release_at FROM editions WHERE album_id = ? ORDER BY is_primary DESC, release_at DESC, id ASC',
      albumId
    );

    if (editions.length > 0) {
      const rows = await queryAll<AlbumSongSectionRecord>(
        env.DB,
        `SELECT
          e.id AS edition_id,
          e.album_id AS edition_album_id,
          e.name AS edition_name,
          e.is_primary AS edition_is_primary,
          e.release_at AS edition_release_at,
          s.id AS song_id,
          s.name AS song_name,
          s.album_id AS song_album_id,
          s.disc_no AS song_disc_no,
          s.track_no AS song_track_no,
          s.display_name AS song_display_name,
          s.duration_ms AS song_duration_ms,
          s.lyrics_json AS song_lyrics_json,
          s.mv_json AS song_mv_json
        FROM editions e
        LEFT JOIN songs s ON s.edition_id = e.id
        WHERE e.album_id = ?
        ORDER BY e.is_primary DESC, e.release_at DESC, e.id ASC, s.disc_no ASC, s.track_no ASC, s.id ASC`,
        albumId
      );

      const sectionMap = new Map<
        string,
        {
          edition: ReturnType<typeof mapEdition>;
          tracks: Array<ReturnType<typeof mapTrack> & { song: ReturnType<typeof mapSong> }>;
        }
      >();

      for (const edition of editions) {
        sectionMap.set(edition.id, { edition: mapEdition(edition), tracks: [] });
      }

      for (const record of rows) {
        const section = sectionMap.get(record.edition_id);
        if (!section) {
          continue;
        }

        if (!record.song_id) {
          continue;
        }

        section.tracks.push({
          editionId: record.edition_id,
          songId: record.song_id,
          discNo: record.song_disc_no ?? 1,
          trackNo: record.song_track_no ?? undefined,
          displayName: record.song_display_name ?? undefined,
          song: mapSong({
            id: record.song_id,
            name: record.song_name ?? '',
            album_id: record.song_album_id ?? albumId,
            duration_ms: record.song_duration_ms,
            lyrics_json: record.song_lyrics_json ?? '[]',
            mv_json: record.song_mv_json
          })
        });
      }

      const primaryEditionId = editions.find((edition) => edition.is_primary === 1)?.id ?? editions[0]?.id;
      if (primaryEditionId) {
        const missingEditionSongs = await queryAll<{
          id: string;
          name: string;
          album_id: string;
          duration_ms: number | null;
          lyrics_json: string;
          mv_json: string | null;
          disc_no: number;
          track_no: number | null;
          display_name: string | null;
        }>(
          env.DB,
          `SELECT id, name, album_id, duration_ms, lyrics_json, mv_json, disc_no, track_no, display_name
          FROM songs
          WHERE album_id = ? AND (edition_id IS NULL OR edition_id = '')
          ORDER BY disc_no ASC, track_no ASC, id ASC`,
          albumId
        );

        const primarySection = sectionMap.get(primaryEditionId);
        if (primarySection) {
          for (const song of missingEditionSongs) {
            primarySection.tracks.push({
              editionId: primaryEditionId,
              songId: song.id,
              discNo: song.disc_no,
              trackNo: song.track_no ?? undefined,
              displayName: song.display_name ?? undefined,
              song: mapSong(song)
            });
          }
        }
      }

      return success([...sectionMap.values()]);
    }

    const songs = await queryAll<SongRecord>(
      env.DB,
      'SELECT id, name, album_id, duration_ms, lyrics_json, mv_json FROM songs WHERE album_id = ? ORDER BY id ASC',
      albumId
    );
    if (songs.length === 0) {
      return success([]);
    }

    const fallbackEdition = {
      id: `edition_${albumId}_standard`,
      album_id: albumId,
      name: 'Standard',
      is_primary: 1 as const,
      release_at: null
    };
    return success([
      {
        edition: mapEdition(fallbackEdition),
        tracks: songs.map((song) => ({
          editionId: fallbackEdition.id,
          songId: song.id,
          discNo: 1,
          trackNo: undefined,
          displayName: undefined,
          song: mapSong(song)
        }))
      }
    ]);
  }

  const albumEditionsMatch = pathname.match(/^\/albums\/([^/]+)\/editions$/);
  if (albumEditionsMatch) {
    const rows = await queryAll<EditionRecord>(
      env.DB,
      'SELECT id, album_id, name, is_primary, release_at FROM editions WHERE album_id = ? ORDER BY is_primary DESC, release_at DESC, id ASC',
      albumEditionsMatch[1]
    );
    return success(rows.map(mapEdition));
  }

  const albumMatch = pathname.match(/^\/albums\/([^/]+)$/);
  if (albumMatch) {
    const record = await queryFirst<AlbumRecord>(
      env.DB,
      'SELECT id, name, year, cover, announcement_at, release_at, kind FROM albums WHERE id = ?',
      albumMatch[1]
    );
    return success(record ? mapAlbum(record) : null);
  }

  if (pathname === '/albums') {
    const rows = await queryAll<AlbumRecord>(
      env.DB,
      "SELECT id, name, year, cover, announcement_at, release_at, kind FROM albums WHERE kind = 'album' ORDER BY year ASC, id ASC"
    );
    return success(rows.map(mapAlbum));
  }

  if (pathname === '/songs') {
    const rows = await queryAll<SongRecord>(
      env.DB,
      'SELECT id, name, album_id, duration_ms, lyrics_json, mv_json FROM songs ORDER BY id ASC'
    );
    return success(rows.map(mapSong));
  }

  if (pathname === '/singles') {
    const rows = await queryAll<SongRecord>(
      env.DB,
      'SELECT id, name, album_id, duration_ms, lyrics_json, mv_json FROM songs WHERE album_id IS NULL ORDER BY id ASC'
    );
    return success(rows.map(mapSong));
  }

  const songMatch = pathname.match(/^\/songs\/([^/]+)$/);
  if (songMatch) {
    const record = await queryFirst<SongRecord>(
      env.DB,
      'SELECT id, name, album_id, duration_ms, lyrics_json, mv_json FROM songs WHERE id = ?',
      songMatch[1]
    );
    return success(record ? mapSong(record) : null);
  }

  const editionTracksMatch = pathname.match(/^\/editions\/([^/]+)\/tracks$/);
  if (editionTracksMatch) {
    const rows = await queryAll<{
      edition_id: string;
      song_id: string;
      disc_no: number;
      track_no: number | null;
      display_name: string | null;
    }>(
      env.DB,
      'SELECT edition_id, id AS song_id, disc_no, track_no, display_name FROM songs WHERE edition_id = ? ORDER BY disc_no ASC, track_no ASC, id ASC',
      editionTracksMatch[1]
    );
    return success(rows.map(mapTrack));
  }

  if (pathname === '/performances') {
    const rows = await queryAll<PerformanceRecord>(
      env.DB,
      'SELECT id, title, song_ids_json, kind, domain, event_name, year, cover, source, duration, summary FROM performances ORDER BY year DESC, id ASC'
    );
    return success(rows.map(mapPerformance));
  }

  if (pathname === '/documentaries') {
    const rows = await queryAll<DocumentaryRecord>(
      env.DB,
      'SELECT id, title, year, category, cover, platform, duration, summary, related_song_ids_json FROM documentaries ORDER BY year DESC, id ASC'
    );
    return success(rows.map(mapDocumentary));
  }

  const eraMatch = pathname.match(/^\/eras\/([^/]+)$/);
  if (eraMatch) {
    const record = await queryFirst<EraRecord>(
      env.DB,
      'SELECT id, album_id, era_name, cover, theme_color, tagline, hero_intro, signature_looks_json, milestones_json, era_honors_json, revisit_performance_ids_json FROM eras WHERE id = ?',
      eraMatch[1]
    );
    return success(record ? mapEra(record) : null);
  }

  const tourShowsMatch = pathname.match(/^\/tours\/([^/]+)\/shows$/);
  if (tourShowsMatch) {
    const rows = await queryAll<ShowRecord>(
      env.DB,
      'SELECT id, tour_id, country, city, venue, start_at, status, opening_act, ticket_platform, sale_at, entry_time, address, seat_map_images_json, notes_json, surprise_guests_json, surprise_songs_json FROM shows WHERE tour_id = ? ORDER BY start_at ASC, id ASC',
      tourShowsMatch[1]
    );
    return success(rows.map(mapShow));
  }

  const tourMatch = pathname.match(/^\/tours\/([^/]+)$/);
  if (tourMatch) {
    const record = await queryFirst<TourRecord>(
      env.DB,
      'SELECT id, name, status, cover, description, announcement_at, start_at, end_at, total, cancelled, album_ids_json, setlists_json FROM tours WHERE id = ?',
      tourMatch[1]
    );
    return success(record ? mapTour(record) : null);
  }

  if (pathname === '/tours') {
    const rows = await queryAll<TourRecord>(
      env.DB,
      'SELECT id, name, status, cover, description, announcement_at, start_at, end_at, total, cancelled, album_ids_json, setlists_json FROM tours ORDER BY start_at DESC, id ASC'
    );
    return success(rows.map(mapTour));
  }

  const showVideosMatch = pathname.match(/^\/shows\/([^/]+)\/videos$/);
  if (showVideosMatch) {
    const rows = await queryAll<VideoRecord>(
      env.DB,
      'SELECT id, show_id, title, cover, song, user_name, uploaded_at FROM videos WHERE show_id = ? ORDER BY uploaded_at DESC, id ASC',
      showVideosMatch[1]
    );
    return success(rows.map(mapVideo));
  }

  const showMatch = pathname.match(/^\/shows\/([^/]+)$/);
  if (showMatch) {
    const record = await queryFirst<ShowRecord>(
      env.DB,
      'SELECT id, tour_id, country, city, venue, start_at, status, opening_act, ticket_platform, sale_at, entry_time, address, seat_map_images_json, notes_json, surprise_guests_json, surprise_songs_json FROM shows WHERE id = ?',
      showMatch[1]
    );
    return success(record ? mapShow(record) : null);
  }

  return notFound();
}

const worker = {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  }
};

export default worker;
