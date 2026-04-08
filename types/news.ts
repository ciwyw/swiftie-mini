export interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  tag: string;
  action: {
    type: 'switchTab' | 'navigateTo';
    route: string;
    query?: string;
  };
}
