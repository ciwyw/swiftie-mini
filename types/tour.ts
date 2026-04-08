export type TourStatus = 'ongoing' | 'ended' | 'break';
export type ShowStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';

export interface TourSetlistVersion {
  id: string;
  label: string;
  songs: string[];
}

export interface Tour {
  id: string;
  name: string;
  year: number;
  status: TourStatus;
  cover: string;
  description: string;
  announcementDate?: string;
  startDate: string;
  endDate: string;
  rangeLabel: string;
  setlists: TourSetlistVersion[];
}

export interface Show {
  id: string;
  tourId: string;
  country: string;
  city: string;
  venue: string;
  date: string;
  status: ShowStatus;
  surpriseGuests?: ShowGuest[];
  surpriseSongs?: SurpriseSong[];
}

export interface Video {
  id: string;
  showId: string;
  title: string;
  cover: string;
  song?: string;
  userName: string;
  uploadTime: string;
}

export interface SurpriseSong {
  songId: string;
  name: string;
}

export interface ShowGuest {
  name: string;
}

export interface ShowGuide {
  showId: string;
  ticketPlatform?: string;
  saleTime?: string;
  entryTime?: string;
  address: string;
  seatMapImages: string[];
  notes?: string[];
}

export interface TourHomeStatus {
  label: '正在进行中' | '已结束' | '空档期';
  desc: string;
}

export interface TourProgress {
  completed: number;
  total: number;
  percent: number;
}
