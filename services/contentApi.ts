import { Album, AlbumEdition, AlbumSongSection, AlbumTrack } from '../types/album';
import { EraExhibit } from '../types/era';
import { HomeFeed } from '../types/home';
import { Documentary, Performance } from '../types/library';
import { Song } from '../types/song';
import { Show, Tour, Video } from '../types/tour';
import { request } from './request';

export function fetchHomeFeed() {
  return request<HomeFeed>('/home');
}

export function fetchAlbums() {
  return request<Album[]>('/albums');
}

export function fetchAlbumDetail(id: string) {
  return request<Album | null>(`/albums/${id}`);
}

export function fetchSongs() {
  return request<Song[]>('/songs');
}

export function fetchSingles() {
  return request<Song[]>('/singles');
}

export function fetchAlbumSongs(id: string) {
  return request<AlbumSongSection[]>(`/albums/${id}/songs`);
}

export function fetchAlbumEditions(id: string) {
  return request<AlbumEdition[]>(`/albums/${id}/editions`);
}

export function fetchEditionTracks(id: string) {
  return request<AlbumTrack[]>(`/editions/${id}/tracks`);
}

export function fetchSongDetail(id: string) {
  return request<Song | null>(`/songs/${id}`);
}

export function fetchPerformances() {
  return request<Performance[]>('/performances');
}

export function fetchPerformanceDetail(id: string) {
  return request<Performance | null>(`/performances/${id}`);
}

export function fetchDocumentaries() {
  return request<Documentary[]>('/documentaries');
}

export function fetchEraDetail(id: string) {
  return request<EraExhibit | null>(`/eras/${id}`);
}

export function fetchTours() {
  return request<Tour[]>('/tours');
}

export function fetchTourDetail(id: string) {
  return request<Tour | null>(`/tours/${id}`);
}

export function fetchTourShows(id: string) {
  return request<Show[]>(`/tours/${id}/shows`);
}

export function fetchShowDetail(id: string) {
  return request<Show | null>(`/shows/${id}`);
}

export function fetchShowVideos(id: string) {
  return request<Video[]>(`/shows/${id}/videos`);
}
