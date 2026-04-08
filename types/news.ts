export interface NewsItem {
  id: string;
  title: string;
  publishedAt: number;
  summary: string;
  tag: string;
  action: {
    type: 'switchTab' | 'navigateTo';
    route: string;
    query?: string;
  };
}
