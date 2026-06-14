// reels.page.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  playOutline,
  pauseOutline,
  addOutline,
  searchOutline,
  personCircleOutline,
  notificationsOutline,
  cameraOutline,
  heartOutline,
  chatbubbleEllipsesOutline,
  arrowRedoOutline,
  bookmarkOutline,
  musicalNotesOutline,
  personOutline,
  closeOutline,
  checkmarkCircleOutline,
  heart,
  bookmark,
} from 'ionicons/icons';

import { Component as ModalComponent, Input } from '@angular/core';
import { ModalController as ModalCtrl } from '@ionic/angular/standalone';

export interface Reel {
  id: number;
  username: string;
  caption: string;
  hashtags: string;
  musicName: string;
  likes: string;
  comments: string;
  isFollowing: boolean;
  isLiked: boolean;
  isSaved: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  timestamp?: Date;
}

// ──────────────────────────────────────────────
// Upload Preview Modal Component
// ──────────────────────────────────────────────
@ModalComponent({
  selector: 'app-upload-preview',
  template: `
    <div class="upload-modal">
      <div class="modal-header">
        <h3>New Post</h3>
        <ion-icon name="close-outline" (click)="dismiss()" class="close-icon"></ion-icon>
      </div>
      <div class="media-preview">
        <video *ngIf="mediaType === 'video'" [src]="mediaUrl" controls autoplay loop class="preview-media"></video>
        <img *ngIf="mediaType === 'image'" [src]="mediaUrl" class="preview-media" />
      </div>
      <div class="caption-area">
        <textarea [value]="caption" (input)="caption = $any($event.target).value"
                  placeholder="Add caption..." class="caption-input" rows="3"></textarea>
      </div>
      <div class="modal-actions">
        <button class="story-btn" (click)="addToStory()">
          <ion-icon name="camera-outline"></ion-icon> Add Story
        </button>
        <button class="upload-btn" (click)="uploadPost()">
          <ion-icon name="checkmark-circle-outline"></ion-icon> Upload Post
        </button>
      </div>
    </div>
  `,
  styles: [`
    .upload-modal {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #111; border-top-left-radius: 24px;
      border-top-right-radius: 24px; padding: 16px;
      z-index: 1000; animation: slideUp 0.3s ease;
      max-height: 90vh; overflow-y: auto;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .modal-header {
      display: flex; justify-content: space-between;
      align-items: center; color: white; margin-bottom: 16px;
    }
    .close-icon { font-size: 28px; color: #FF5722; cursor: pointer; }
    .media-preview {
      width: 100%; height: 300px; background: #222;
      border-radius: 16px; overflow: hidden; margin-bottom: 16px;
    }
    .preview-media { width: 100%; height: 100%; object-fit: cover; }
    .caption-input {
      width: 100%; background: #222; color: white;
      border: 1px solid #FF5722; border-radius: 12px;
      padding: 12px; font-size: 14px; margin-bottom: 16px;
      font-family: inherit;
    }
    .modal-actions { display: flex; gap: 12px; }
    .story-btn, .upload-btn {
      flex: 1; padding: 12px; border-radius: 30px;
      font-weight: bold; display: flex; align-items: center;
      justify-content: center; gap: 8px; cursor: pointer;
      transition: transform 0.1s ease;
    }
    .story-btn:active, .upload-btn:active { transform: scale(0.97); }
    .story-btn { background: transparent; border: 1px solid #FF5722; color: #FF5722; }
    .upload-btn { background: #FF5722; border: none; color: white; }
  `],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class UploadPreviewModal {
  @Input() mediaUrl!: string;
  @Input() mediaType!: 'image' | 'video';
  caption: string = '';

  constructor(private modalCtrl: ModalCtrl) {}

  dismiss() { this.modalCtrl.dismiss(); }

  addToStory() {
    this.modalCtrl.dismiss({
      action: 'story', caption: this.caption,
      mediaUrl: this.mediaUrl, mediaType: this.mediaType
    });
  }

  uploadPost() {
    this.modalCtrl.dismiss({
      action: 'post', caption: this.caption,
      mediaUrl: this.mediaUrl, mediaType: this.mediaType
    });
  }
}

// ──────────────────────────────────────────────
// Main ReelsPage Component
// ──────────────────────────────────────────────
@Component({
  selector: 'app-reels',
  templateUrl: './reels.page.html',
  styleUrls: ['./reels.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
  ],
})
export class ReelsPage implements OnInit, AfterViewInit {

  // ✅ ViewChild se direct video element access
  @ViewChild('reelVideo') reelVideoRef!: ElementRef<HTMLVideoElement>;

  activeTab: string = 'reels';
  currentReelIndex: number = 0;
  isVideoPaused: boolean = false;

  reels: Reel[] = [
    {
      id: 1,
      username: '@vibe_creator',
      caption: 'Yeh dekho kitna amazing hai 🔥 Pure vibe on VibeNet ✨',
      hashtags: '#vibenet #reels #trending',
      musicName: 'Kaho Na Kaho – Remix',
      likes: '48.2K',
      comments: '1,204',
      isFollowing: false,
      isLiked: false,
      isSaved: false,
      mediaUrl: '',
      mediaType: 'video',
      timestamp: new Date(),
    },
    {
      id: 2,
      username: '@sunset_vibes',
      caption: 'Golden hour hits different 🌅 Karachi ke baad kuch nahi ❤️',
      hashtags: '#karachi #sunset #vibenet',
      musicName: 'Pasoori – Ali Sethi',
      likes: '92.1K',
      comments: '3,540',
      isFollowing: true,
      isLiked: true,
      isSaved: false,
      mediaUrl: '',
      mediaType: 'video',
      timestamp: new Date(),
    },
    {
      id: 3,
      username: '@daily_grind_pk',
      caption: 'Hustle mode ON 💪 Koi ruk nahi sakta! 🚀',
      hashtags: '#hustle #pakistan #motivation',
      musicName: 'Coke Studio Season 14',
      likes: '15.8K',
      comments: '812',
      isFollowing: false,
      isLiked: false,
      isSaved: true,
      mediaUrl: '',
      mediaType: 'video',
      timestamp: new Date(),
    },
  ];

  get currentReel(): Reel {
    return this.reels[this.currentReelIndex];
  }

  constructor(
    private modalController: ModalController,
    private router: Router
  ) {
    addIcons({
      homeOutline, playOutline, pauseOutline, addOutline,
      searchOutline, personCircleOutline, notificationsOutline,
      cameraOutline, heartOutline, heart, chatbubbleEllipsesOutline,
      arrowRedoOutline, bookmarkOutline, bookmark, musicalNotesOutline,
      personOutline, closeOutline, checkmarkCircleOutline,
    });
  }

  ngOnInit() {
    const reelJson = localStorage.getItem('openReel');
    if (reelJson) {
      try {
        const reelData = JSON.parse(reelJson);
        const incomingReel: Reel = {
          id: 0,
          username: reelData.username || '@you',
          caption: reelData.caption || '',
          hashtags: '',
          musicName: 'Original Audio',
          likes: '0',
          comments: '0',
          isFollowing: false,
          isLiked: false,
          isSaved: false,
          mediaUrl: reelData.mediaUrl,
          mediaType: reelData.mediaType,
          timestamp: new Date(),
        };
        this.reels.unshift(incomingReel);
        this.currentReelIndex = 0;
      } catch {}
      localStorage.removeItem('openReel');
    }
  }

  ngAfterViewInit() {
    this.playCurrentVideo();
  }

  // ──────────────────────────────────────────────
  // ✅ Video element lene ka reliable method
  // ──────────────────────────────────────────────
  private getVideo(): HTMLVideoElement | null {
    // ViewChild pehle try karo
    if (this.reelVideoRef?.nativeElement) {
      return this.reelVideoRef.nativeElement;
    }
    // Fallback: DOM query
    return document.querySelector('.reel-video') as HTMLVideoElement | null;
  }

  private stopCurrentVideo(): void {
    const video = this.getVideo();
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    this.isVideoPaused = false;
  }

  private playCurrentVideo(): void {
    setTimeout(() => {
      const video = this.getVideo();
      if (video) {
        video.load();
        video.play().catch(() => {});
      }
      this.isVideoPaused = false;
    }, 200);
  }

  // ──────────────────────────────────────────────
  // ✅ Tap to Pause / Play — FIXED
  // ──────────────────────────────────────────────
  togglePlayPause(): void {
    const video = this.getVideo();

    if (!video) {
      console.warn('Video element nahi mila');
      return;
    }

    if (video.paused) {
      video.play()
        .then(() => { this.isVideoPaused = false; })
        .catch(err => console.error('Play failed:', err));
    } else {
      video.pause();
      this.isVideoPaused = true;
    }
  }
ionViewWillEnter() {
  this.activeTab = 'reels';
}
  // ──────────────────────────────────────────────
  // ✅ Reel navigation
  // ──────────────────────────────────────────────
  nextReel(): void {
    if (this.currentReelIndex < this.reels.length - 1) {
      this.stopCurrentVideo();
      this.currentReelIndex++;
      this.playCurrentVideo();
    }
  }

  prevReel(): void {
    if (this.currentReelIndex > 0) {
      this.stopCurrentVideo();
      this.currentReelIndex--;
      this.playCurrentVideo();
    }
  }

  // ──────────────────────────────────────────────
  // Baqi existing methods (unchanged)
  // ──────────────────────────────────────────────

  async openGallery() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';
    fileInput.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const mediaUrl = URL.createObjectURL(file);
        const mediaType = file.type.startsWith('image') ? 'image' : 'video';
        await this.showUploadPreview(mediaUrl, mediaType);
      }
    };
    fileInput.click();
  }

  async showUploadPreview(mediaUrl: string, mediaType: 'image' | 'video') {
    const modal = await this.modalController.create({
      component: UploadPreviewModal,
      componentProps: { mediaUrl, mediaType },
      backdropDismiss: true,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      if (data.action === 'post') {
        this.createNewReel(data.mediaUrl, data.mediaType, data.caption);
      } else if (data.action === 'story') {
        console.log('Story saved:', data);
      }
    }
  }

  createNewReel(mediaUrl: string, mediaType: 'image' | 'video', caption: string) {
    const newReel: Reel = {
      id: this.reels.length + 1,
      username: '@current_user',
      caption: caption || 'No caption',
      hashtags: '#newpost #vibenet',
      musicName: 'Original Audio',
      likes: '0',
      comments: '0',
      isFollowing: false,
      isLiked: false,
      isSaved: false,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      timestamp: new Date(),
    };
    this.reels.unshift(newReel);
    this.currentReelIndex = 0;
  }

  toggleLike() {
    this.currentReel.isLiked = !this.currentReel.isLiked;
    if (this.currentReel.isLiked) {
      const currentLikes = parseInt(this.currentReel.likes.replace(/[^0-9]/g, ''));
      this.currentReel.likes = (currentLikes + 1).toLocaleString();
    } else {
      const currentLikes = parseInt(this.currentReel.likes.replace(/[^0-9]/g, ''));
      this.currentReel.likes = (currentLikes - 1).toLocaleString();
    }
  }

  toggleSave() {
    this.currentReel.isSaved = !this.currentReel.isSaved;

    const uid = localStorage.getItem('userId') || 'guest';
    const key = 'vn_saved_' + uid;
    const raw = localStorage.getItem(key);
    let savedList: any[] = raw ? JSON.parse(raw) : [];

    if (this.currentReel.isSaved) {
      const alreadyExists = savedList.some(r => r.id === this.currentReel.id);
      if (!alreadyExists) {
        savedList.push({
          id:        this.currentReel.id,
          username:  this.currentReel.username,
          caption:   this.currentReel.caption,
          mediaUrl:  this.currentReel.mediaUrl,
          mediaType: this.currentReel.mediaType,
          likes:     this.currentReel.likes,
          savedAt:   Date.now(),
        });
      }
    } else {
      savedList = savedList.filter(r => r.id !== this.currentReel.id);
    }

    localStorage.setItem(key, JSON.stringify(savedList));
  }

  toggleFollow() {
    this.currentReel.isFollowing = !this.currentReel.isFollowing;
  }

  shareReel() {
    if (navigator.share) {
      navigator.share({
        title: 'VibeNet Reel',
        text: this.currentReel.caption,
        url: window.location.href,
      }).catch(() => {});
    } else {
      console.log('Share: ', this.currentReel.username);
    }
  }
onTabChange(tab: string) {
  if (tab === 'upload') {
    this.openGallery();
    return;
  }

  // reels pe activeTab change mat karo — hamesha 'reels' rahe
  if (tab !== 'reels') {
    this.activeTab = tab;
  }
  switch (tab) {
    case 'home':    this.router.navigate(['/homefeed']); break;
    case 'reels':   this.router.navigate(['/reels']);    break;
    case 'explore': this.router.navigate(['/explore']);  break;
    case 'profile': this.router.navigate(['/userprofile']); break;
  }
}
}