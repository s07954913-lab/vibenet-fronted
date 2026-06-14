import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ForYouVideoItem {
  id: number;
  videoUrl: string;
  username: string;
  description: string;
  likes: string;
  comments: number;
  liked?: boolean;
  isPaused?: boolean;
  thumbnail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Reels {

  private PEXELS_API_KEY = 'sZkg5bQOFHHDY9Khv8kvXjsH1E0O9JBszuwwFXNrcqcb8i3g00uEsYY0';
  private BASE_URL = 'https://api.pexels.com/videos';

  private searchQueries = [
    'nature', 'city', 'travel', 'food', 'technology',
    'dance', 'sports', 'animals', 'ocean', 'sunset',
    'fashion', 'music', 'workout', 'cooking', 'funny'
  ];

  private fakeUsernames = [
    '@alpha_vibe', '@neon_rider', '@cloud_stream', '@pixel_guru',
    '@quantum_ai', '@cyber_wave', '@nexus_vibe', '@cosmo_stream',
    '@nova_beats', '@ultra_vibe', '@solar_fx', '@moon_drop',
    '@echo_pulse', '@drift_zone', '@flash_gram'
  ];

  private fakeCaptions = [
    '✨ Living the dream every single day 🔥',
    '🌊 When life gives you waves, surf them!',
    '🎵 Music heals the soul 🎶',
    '💫 New day, new vibes, new energy!',
    '🌟 Just another beautiful moment captured 📸',
    '🔥 This is what passion looks like!',
    '🎯 Focus. Create. Inspire. Repeat.',
    '🌈 Colors of life never stop amazing me',
    '⚡ High voltage vibes only ⚡',
    '🦋 Transformation is beautiful 🌸',
    '🏆 Champions are made in moments like these',
    '🌙 Late night energy hits different fr 🌙',
    '💥 Breaking barriers every single day!',
    '🎨 Art is everywhere if you look closely',
    '🚀 To infinity and beyond! #VibeNetAI'
  ];

  private currentPage = 1;
  private currentQueryIndex = 0;

  constructor(private http: HttpClient) {}

  // Popular trending videos fetch karo
  fetchPopularReels(count: number = 6): Observable<ForYouVideoItem[]> {
    const url = `${this.BASE_URL}/popular?per_page=${count}&page=${this.currentPage}`;
    this.currentPage++;
    const headers = new HttpHeaders({ Authorization: this.PEXELS_API_KEY });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => this.transformPexelsData(response.videos || []))
    );
  }

  // Search se videos fetch karo — variety ke liye
  fetchReels(count: number = 6): Observable<ForYouVideoItem[]> {
    const query = this.searchQueries[this.currentQueryIndex % this.searchQueries.length];
    this.currentQueryIndex++;
    const url = `${this.BASE_URL}/search?query=${query}&per_page=${count}&page=${this.currentPage}`;
    this.currentPage++;
    const headers = new HttpHeaders({ Authorization: this.PEXELS_API_KEY });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => this.transformPexelsData(response.videos || []))
    );
  }

  // Reset pagination
  resetPagination() {
    this.currentPage = 1;
    this.currentQueryIndex = 0;
  }

  // Pexels data ko apne format mein convert karo
  private transformPexelsData(videos: any[]): ForYouVideoItem[] {
    return videos
      .filter(v => v.video_files && v.video_files.length > 0)
      .map((video) => {
        const videoFile = this.getBestVideoFile(video.video_files);
        return {
          id:          video.id,
          videoUrl:    videoFile?.link || '',
          thumbnail:   video.image || '',
          username:    this.fakeUsernames[Math.floor(Math.random() * this.fakeUsernames.length)],
          description: this.fakeCaptions[Math.floor(Math.random() * this.fakeCaptions.length)],
          likes:       (Math.floor(Math.random() * 95000) + 1000).toString(),
          comments:    Math.floor(Math.random() * 5000) + 50,
          liked:       false,
          isPaused:    false
        };
      })
      .filter(item => item.videoUrl !== '');
  }

  // Best quality video file choose karo
  private getBestVideoFile(files: any[]): any {
    if (!files || files.length === 0) return null;

    // Portrait HD prefer karo (mobile ke liye)
    const portraitHD = files.filter(f =>
      f.quality === 'hd' && f.height > f.width && f.file_type === 'video/mp4'
    );
    if (portraitHD.length > 0) return portraitHD[0];

    // Portrait SD
    const portraitSD = files.filter(f =>
      f.height > f.width && f.file_type === 'video/mp4'
    );
    if (portraitSD.length > 0) return portraitSD[0];

    // Koi bhi mp4
    const anyMp4 = files.filter(f => f.file_type === 'video/mp4');
    if (anyMp4.length > 0) return anyMp4[0];

    return files[0];
  }
}