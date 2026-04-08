import { Album } from './album';
import { Performance } from './library';

export interface EraRouteAction {
  route: string;
  query?: string;
}

export interface EraHero {
  yearLabel: string;
  intro: string;
  cover: string;
  themeColor: string;
}

export interface EraSignatureLook {
  id: string;
  image: string;
  title?: string;
}

export interface EraMilestone {
  id: string;
  dateLabel: string;
  title: string;
  summary: string;
  type: 'release' | 'performance' | 'award' | 'moment';
  action?: EraRouteAction;
}

export interface EraHonorItem {
  id: string;
  type: 'award' | 'achievement';
  year: number;
  organization: string;
  title: string;
  result: string;
  note?: string;
}

export interface EraRevisitRefs {
  performanceIds: string[];
}

export interface EraExhibit {
  id: string;
  albumId: string;
  eraName: string;
  hero: EraHero;
  signatureLooks: EraSignatureLook[];
  milestones: EraMilestone[];
  eraHonors: EraHonorItem[];
  revisit: EraRevisitRefs;
}

export interface EraExhibitDetail extends Omit<EraExhibit, 'revisit'> {
  album: (Album & { action: EraRouteAction }) | null;
  featuredHonors: EraHonorItem[];
  remainingHonors: EraHonorItem[];
  performances: Performance[];
}
