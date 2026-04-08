import { eraExhibits } from '../data/eraExhibits';
import { performances } from '../data/performances';
import { EraExhibitDetail } from '../types/era';
import { ROUTES } from './constants';
import { getAlbumById } from './selectors';

export function getEraExhibitDetailById(id: string): EraExhibitDetail | undefined {
  const exhibit = eraExhibits.find((item) => item.id === id);
  if (!exhibit) {
    return undefined;
  }

  const album = getAlbumById(exhibit.albumId);
  const revisitPerformances = exhibit.revisit.performanceIds
    .map((performanceId) =>
      performances.find((item) => item.domain === 'library' && item.id === performanceId)
    )
    .filter((performance): performance is NonNullable<typeof performance> => Boolean(performance))
    .map((performance) => ({ ...performance, songIds: [...performance.songIds] }));

  return {
    id: exhibit.id,
    albumId: exhibit.albumId,
    eraName: exhibit.eraName,
    hero: { ...exhibit.hero },
    signatureLooks: exhibit.signatureLooks.map((item) => ({ ...item })),
    milestones: exhibit.milestones.map((item) => ({
      ...item,
      action: item.action ? { ...item.action } : undefined
    })),
    eraHonors: exhibit.eraHonors.map((item) => ({ ...item })),
    featuredHonors: exhibit.eraHonors.slice(0, 3).map((item) => ({ ...item })),
    remainingHonors: exhibit.eraHonors.slice(3).map((item) => ({ ...item })),
    album: album
      ? {
          ...album,
          action: {
            route: ROUTES.album,
            query: `id=${album.id}`
          }
        }
      : null,
    performances: revisitPerformances
  };
}
