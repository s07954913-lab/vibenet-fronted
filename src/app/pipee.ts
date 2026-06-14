import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Pipee {

  // ===============================
  // TEXT CLEANING
  // ===============================
  cleanText(text: string): string {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
  }

  toLower(text: string): string {
    if (!text) return '';
    return text.toLowerCase();
  }

  // ===============================
  // CAPTION SHORTENER
  // ===============================
  shorten(text: string, limit: number = 60): string {
    if (!text) return '';
    return text.length > limit
      ? text.substring(0, limit) + '...'
      : text;
  }

  // ===============================
  // LIKES FORMAT (1K, 2.5K)
  // ===============================
  formatLikes(likes: number): string {
    if (likes >= 1000000) {
      return (likes / 1000000).toFixed(1) + 'M';
    }

    if (likes >= 1000) {
      return (likes / 1000).toFixed(1) + 'K';
    }

    return likes.toString();
  }

  // ===============================
  // TIME FORMAT (simple version)
  // ===============================
  formatTime(time: string): string {
    if (!time) return '';
    return time.toUpperCase();
  }

  // ===============================
  // SEARCH MATCH HELPER
  // ===============================
  matchSearch(text: string, search: string): boolean {
    if (!text || !search) return false;

    return text.toLowerCase().includes(search.toLowerCase());
  }

  // ===============================
  // RANDOM HELPER
  // ===============================
  randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ===============================
  // BOOLEAN HELPERS
  // ===============================
  toggle(value: boolean): boolean {
    return !value;
  }

}