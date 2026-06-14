import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonSkeletonText, IonRefresher, IonRefresherContent,
  IonSpinner
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline, shareSocialOutline, personAddOutline,
  personRemoveOutline, chatbubbleOutline, gridOutline,
  imagesOutline, playCircleOutline, eyeOutline, peopleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-public-profile',
  templateUrl: './public-profile.page.html',
  styleUrls: ['./public-profile.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButtons, IonBackButton, IonButton, IonIcon,
    IonSkeletonText, IonRefresher, IonRefresherContent,
    IonSpinner
  ]
})
export class PublicProfilePage implements OnInit {

  profile: any  = null;
  posts: any[]  = [];
  username      = '';
  isLoading     = true;
  isFollowing   = false;
  followLoading = false;
  imgError      = false;

  private targetUserId: number | null = null;
  private myUserId: string | number   = '';

  private get base(): string {
    return Capacitor.isNativePlatform()
      ? 'http://192.168.0.105:8000/api'
      : 'http://127.0.0.1:8000/api';
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    addIcons({
      arrowBackOutline, shareSocialOutline, personAddOutline,
      personRemoveOutline, chatbubbleOutline, gridOutline,
      imagesOutline, playCircleOutline, eyeOutline, peopleOutline
    });
  }

  async ngOnInit() {
    await this.loadMyUserId();

    const paramId    = this.route.snapshot.paramMap.get('userId');
    const stateId    = history.state?.userId ?? null;
    const resolvedId = paramId ?? stateId ?? null;

    console.log('paramId from URL:', paramId);
    console.log('stateId from state:', stateId);
    console.log('Final resolvedId:', resolvedId);

    if (!resolvedId) {
      console.error('No targetUserId found — redirecting to search');
      this.isLoading = false;
      this.router.navigate(['/search-user']);
      return;
    }

    this.targetUserId = Number(resolvedId);
    this.loadProfile();
  }

  private async loadMyUserId() {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: 'userId' });
        if (value) { this.myUserId = value; return; }
      }
      const id = localStorage.getItem('userId')
              || localStorage.getItem('user_id')
              || localStorage.getItem('id');
      if (id) { this.myUserId = id; }
    } catch (_) {}
    console.log('My userId loaded:', this.myUserId);
  }

  private parseFollowing(res: any): boolean {
    if (typeof res.following === 'boolean')    return res.following;
    if (typeof res.is_following === 'boolean') return res.is_following;
    if (typeof res.following === 'number')     return res.following === 1;
    if (typeof res.status === 'string')        return res.status === 'following';
    return false;
  }

  // Name ka pehla letter — initial avatar ke liye
  getInitial(): string {
    const name = this.profile?.name || this.username || '?';
    return name.charAt(0).toUpperCase();
  }

  // Name fix karo — "User" default na aaye
  private fixName(data: any): string {
    const raw = data.name || '';
    // Agar name empty hai ya sirf "User" hai to username use karo
    if (!raw || raw.trim().toLowerCase() === 'user') {
      return data.username || data.first_name || data.full_name || raw || 'Unknown';
    }
    return raw;
  }

  loadProfile() {
    this.isLoading = true;
    this.imgError  = false;
    this.http.get<any>(`${this.base}/users/${this.targetUserId}/public/`).subscribe({
      next: (data) => {
        console.log('Profile loaded:', data);
        this.profile        = data;
        this.profile.name   = this.fixName(data);   // ← Name fix
        this.posts          = data.posts || [];
        this.username       = data.username || data.name || '';
        this.isLoading      = false;
        this.checkFollowStatus();
      },
      error: (err) => {
        console.error('Profile load error:', err);
        this.isLoading = false;
      }
    });
  }

  checkFollowStatus() {
    if (!this.targetUserId) return;
    if (!this.myUserId)     return;
    if (String(this.myUserId) === String(this.targetUserId)) return;

    this.http.get<any>(
      `${this.base}/users/${this.myUserId}/follows/${this.targetUserId}/`
    ).subscribe({
      next:  (res) => {
        console.log('Follow status:', res);
        this.isFollowing = this.parseFollowing(res);
      },
      error: (err) => console.error('Follow status check error:', err)
    });
  }

  toggleFollow() {
    if (!this.targetUserId) return;
    if (!this.myUserId) {
      console.error('myUserId missing — save userId to localStorage on login');
      return;
    }
    if (String(this.myUserId) === String(this.targetUserId)) return;

    this.followLoading = true;

    this.http.post<any>(`${this.base}/users/follow/`, {
      follower_id:  this.myUserId,
      following_id: this.targetUserId,
    }).subscribe({
     next: (res) => {
  console.log('Follow toggle response:', res);
  this.isFollowing   = this.parseFollowing(res);
  this.followLoading = false;
  this.loadProfile(); // ✅ Bas yeh ek line add hui
},
      error: (err) => {
        console.error('Follow toggle error:', err);
        this.followLoading = false;
      }
    });
  }

  handleRefresh(event: any) {
    this.imgError = false;
    this.http.get<any>(`${this.base}/users/${this.targetUserId}/public/`).subscribe({
      next: (data) => {
        this.profile        = data;
        this.profile.name   = this.fixName(data);   // ← Name fix
        this.posts          = data.posts || [];
        this.username       = data.username || data.name || '';
        this.checkFollowStatus();
        event.target.complete();
      },
      error: () => event.target.complete()
    });
  }

  openPost(post: any) {
    this.router.navigate(['/detailpage'], {
      state: {
        data: {
          img:      this.getThumb(post),
          title:    post.caption || 'Post',
          category: this.profile?.name || '',
          video:    post.video_url,
        }
      }
    });
  }

  isVideo(post: any): boolean {
    const url = (post.video_url || '').toLowerCase();
    return url.includes('.mp4') || url.includes('.mov')
        || url.includes('.webm') || url.includes('youtube');
  }

  getThumb(post: any): string {
    if (this.isVideo(post)) return 'assets/video-thumb.jpg';
    return post.video_url || 'assets/don.jfif';
  }

  sendMessage() {
    this.router.navigate(['/chatsystem'], {
      state: {
        other_name: this.profile?.name || this.username,
        other_img:  this.profile?.profile_image || '',
      }
    });
  }

  shareProfile() {
    if (navigator.share) {
      navigator.share({
        title: `${this.profile?.name || this.username} — VibeNet AI`,
        text:  `Check out @${this.username} on VibeNet AI`,
        url:   window.location.href,
      });
    }
  }
}