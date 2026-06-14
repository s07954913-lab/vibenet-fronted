// homefeed.page.ts — COMPLETE FIXED VERSION
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WebSocketService } from '../services/websocket';
import { Subscription } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonFab, IonFabButton, IonTabBar,
  IonTabButton, IonLabel, IonModal, IonInput, IonFooter,
  ToastController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, notificationsOutline, chatbubbleOutline,
  heartOutline, heart, shareSocialOutline,
  cameraOutline, home, searchOutline,
  barChartOutline, personOutline, ellipsisHorizontal,
  arrowBackOutline, imageOutline, playOutline, pencilOutline,
  locationOutline, pricetagOutline, playCircleOutline,
  sendOutline, trashOutline, closeOutline, checkmarkOutline,
  chatbubbleEllipsesOutline, flagOutline,
  sparklesOutline  // ✅ AI Assistant icon
} from 'ionicons/icons';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  label: string;
  thumbnail?: string;
  emoji?: string;
  createdAt: string;
  type?: 'photo' | 'video';
  storyLiked?: boolean;
  storyLikes?: number;
  storyComments?: number;
  userId?: string;
  userName?: string;
  userInitial?: string;
}

export interface Post {
  id: string;
  mediaUrl?: string;
  emoji?: string;
  caption: string;
  hashtags: string[];
  location?: string;
  likes: number;
  comments: number;
  liked: boolean;
  timeAgo: string;
  createdAt: string;
  type: 'photo' | 'video';
  userId: string;
  userName: string;
  userInitial: string;
  likedBy?: string[];
}

export interface MediaItem {
  id: string;
  objectUrl?: string;
  emoji?: string;
  type: 'photo' | 'video';
  file?: File;
}

export interface NewPostForm {
  caption: string;
  location: string;
  hashtags: string;
}

// ─── IndexedDB helper ────────────────────────────────────────────────────────

const DB_NAME     = 'vibenet_db';
const DB_VERSION  = 1;
const MEDIA_STORE = 'media';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function saveMedia(id: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(MEDIA_STORE, 'readwrite');
    const store = tx.objectStore(MEDIA_STORE);
    const req   = store.put(file, id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function loadMedia(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(MEDIA_STORE, 'readonly');
    const store = tx.objectStore(MEDIA_STORE);
    const req   = store.get(id);
    req.onsuccess = () => {
      resolve(req.result ? URL.createObjectURL(req.result as File) : null);
    };
    req.onerror = () => reject(req.error);
  });
}

async function deleteMedia(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(MEDIA_STORE, 'readwrite');
    const store = tx.objectStore(MEDIA_STORE);
    const req   = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORIES_KEY  = 'vn_stories';
const STORY_TTL_MS = 24 * 60 * 60 * 1000;

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-homefeed',
  templateUrl: './homefeed.page.html',
  styleUrls: ['./homefeed.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonButton, IonIcon, IonFab, IonFabButton,
    IonTabBar, IonTabButton, IonLabel, IonModal, IonInput, IonFooter
  ]
})
export class HomefeedPage implements OnInit, OnDestroy {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('storyFileInput') storyFileInput!: ElementRef<HTMLInputElement>;

  userInitial : string = 'Y';
  userName    : string = 'You';
  userEmail   : string = '';
  currentUserId: string = 'guest';

  showPublishModal: boolean = false;
  publishMode: 'story' | 'post' = 'post';
  selectedMedia: MediaItem | null = null;
  newPost: NewPostForm = { caption: '', location: '', hashtags: '' };

  showStoryViewer: boolean = false;
  activeStory: Story | null = null;
  storyReply: string = '';

  myStories: Story[] = [];
  myPosts: Post[]    = [];

  activeTab: string = 'home';

  private refreshTimer: any;

  constructor(
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private wsService: WebSocketService  // ← yeh add karo
  ) {
    addIcons({
      addOutline, notificationsOutline, chatbubbleOutline,
      heartOutline, heart, shareSocialOutline,
      cameraOutline, home, searchOutline,
      barChartOutline, personOutline, ellipsisHorizontal,
      arrowBackOutline, imageOutline, playOutline, pencilOutline,
      locationOutline, pricetagOutline, playCircleOutline,
      sendOutline, trashOutline, closeOutline, checkmarkOutline,
      chatbubbleEllipsesOutline, flagOutline,
      sparklesOutline  // ✅ Register kiya
    });
  }
  private wsSubs: Subscription = new Subscription();
notificationCount: number = 0;


 async ngOnInit() {
    this.currentUserId = localStorage.getItem('userId') || 'guest';
    this.userName      = localStorage.getItem('username') ||
                         localStorage.getItem('email')    || 'You';
    this.userEmail     = localStorage.getItem('email')    || '';
    this.userInitial   = this.userName.charAt(0).toUpperCase();

    this.loadMetaFromStorage();
    await this.pruneExpiredStories();
    await this.hydrateMediaUrls();

    // ── WebSocket start karo ──────────────────────────
    this.wsService.connectChat('general');
    this.wsService.connectNotifications(this.currentUserId);

    // Live notifications suno
    this.wsSubs.add(
      this.wsService.newNotification$.subscribe(notif => {
        if (notif) {
          this.notificationCount++;
          this.showToast(`🔔 ${notif.message}`, 'primary');
          this.cdr.detectChanges();
        }
      })
    );

    // Live comments suno
    this.wsSubs.add(
      this.wsService.newComment$.subscribe(comment => {
        if (comment) {
          // Post ka comment count update karo
          const post = this.myPosts.find(p => p.id === comment.post_id);
          if (post) {
            post.comments++;
            this.cdr.detectChanges();
          }
        }
      })
    );

    this.refreshTimer = setInterval(() => {
      this.cdr.detectChanges();
    }, 60 * 1000);
}
ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.wsSubs.unsubscribe();
    this.wsService.disconnectAll();
}

  private getPostsKey(userId?: string): string {
    const uid = userId || this.currentUserId;
    return 'vn_posts_' + uid;
  }

  getTimeAgo(createdAt: string): string {
    const now     = Date.now();
    const created = new Date(createdAt).getTime();
    const diffMs  = now - created;
    const mins    = Math.floor(diffMs / (1000 * 60));
    const hours   = Math.floor(diffMs / (1000 * 60 * 60));
    const days    = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days}d ago`;
  }

  private loadMetaFromStorage() {
    try {
      const allPosts: Post[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vn_posts_')) {
          const posts: Post[] = JSON.parse(localStorage.getItem(key) || '[]');
          allPosts.push(...posts);
        }
      }
      allPosts.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.myPosts = allPosts.map(post => ({
        ...post,
        likedBy: post.likedBy || [],
        liked: (post.likedBy || []).includes(this.currentUserId),
        likes: (post.likedBy || []).length
      }));
      const storiesJson = localStorage.getItem(STORIES_KEY);
      this.myStories = storiesJson ? JSON.parse(storiesJson) : [];
    } catch {
      this.myPosts   = [];
      this.myStories = [];
    }
  }

  private savePosts() {
    const postsByUser: { [userId: string]: Post[] } = {};
    for (const post of this.myPosts) {
      const uid = post.userId || 'guest';
      if (!postsByUser[uid]) postsByUser[uid] = [];
      postsByUser[uid].push({ ...post, mediaUrl: undefined });
    }
    for (const [uid, posts] of Object.entries(postsByUser)) {
      localStorage.setItem(this.getPostsKey(uid), JSON.stringify(posts));
    }
  }

  private saveStories() {
    const toSave = this.myStories.map(s => ({ ...s, thumbnail: undefined }));
    localStorage.setItem(STORIES_KEY, JSON.stringify(toSave));
  }

  private refreshCommentCounts() {
    for (const post of this.myPosts) {
      const saved = localStorage.getItem('comments_' + post.id);
      if (saved) {
        const comments = JSON.parse(saved);
        post.comments = comments.length;
      }
    }
  }

  private async hydrateMediaUrls() {
    const validPosts: Post[] = [];
    for (const post of this.myPosts) {
      const url = await loadMedia('post_' + post.id).catch(() => null);
      if (url) {
        post.mediaUrl = url;
        validPosts.push(post);
      }
    }
    this.myPosts = validPosts;

    for (const story of this.myStories) {
      const url = await loadMedia('story_' + story.id).catch(() => null);
      if (url) {
        story.thumbnail = url;
        if (!story.type) story.type = 'photo';
      } else {
        story.thumbnail = undefined;
      }
    }
    this.myStories = this.myStories.filter(s => !!s.thumbnail);
    this.saveStories();
    this.refreshCommentCounts();
    this.cdr.detectChanges();
  }

  private async pruneExpiredStories() {
    const now     = Date.now();
    const expired = this.myStories.filter(s =>
      (now - new Date(s.createdAt).getTime()) >= STORY_TTL_MS
    );
    for (const s of expired) {
      await deleteMedia('story_' + s.id).catch(() => {});
    }
    const before = this.myStories.length;
    this.myStories = this.myStories.filter(s =>
      (now - new Date(s.createdAt).getTime()) < STORY_TTL_MS
    );
    if (this.myStories.length !== before) this.saveStories();
  }

  openGallery(mode: 'story' | 'post') {
    this.publishMode   = mode;
    this.selectedMedia = null;
    this.resetForm();
    const input = document.getElementById(
      mode === 'story' ? 'storyFileInput' : 'postFileInput'
    ) as HTMLInputElement;
    if (input) { input.value = ''; input.click(); }
  }

  onFileSelected(event: Event, mode: 'story' | 'post') {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file      = input.files[0];
    const isVideo   = file.type.startsWith('video/');
    const objectUrl = URL.createObjectURL(file);
    this.selectedMedia = {
      id: Date.now().toString(),
      objectUrl,
      type: isVideo ? 'video' : 'photo',
      file
    };
    this.publishMode      = mode;
    this.showPublishModal = true;
  }

  closePublishModal() {
    this.showPublishModal = false;
    if (this.selectedMedia?.objectUrl) URL.revokeObjectURL(this.selectedMedia.objectUrl);
    this.resetForm();
  }

  async publishAs(type: 'story' | 'post') {
    if (!this.selectedMedia?.file) return;
    const id       = Date.now().toString();
    const mediaKey = (type === 'story' ? 'story_' : 'post_') + id;
    try {
      await saveMedia(mediaKey, this.selectedMedia.file);
    } catch {
      await this.showToast('Could not save media. Please try again.', 'danger');
      return;
    }
    const blobUrl  = await loadMedia(mediaKey).catch(() => null);
    const hashtags = this.newPost.hashtags
      .split(/[\s,#]+/)
      .filter(t => t.trim().length > 0);

    if (type === 'story') {
      const newStory: Story = {
        id,
        label:         'Just now',
        thumbnail:     blobUrl ?? undefined,
        createdAt:     new Date().toISOString(),
        type:          this.selectedMedia.type,
        storyLiked:    false,
        storyLikes:    0,
        storyComments: 0,
        userId:        this.currentUserId,
        userName:      this.userName,
        userInitial:   this.userInitial
      };
      this.myStories.unshift(newStory);
      this.saveStories();
      await this.showToast('Story shared! 🎉', 'success');
    } else {
      const newPost: Post = {
        id,
        mediaUrl:    blobUrl ?? undefined,
        caption:     this.newPost.caption,
        hashtags,
        location:    this.newPost.location || undefined,
        likes:       0,
        comments:    0,
        liked:       false,
        timeAgo:     'Just now',
        createdAt:   new Date().toISOString(),
        type:        this.selectedMedia.type,
        userId:      this.currentUserId,
        userName:    this.userName,
        userInitial: this.userInitial,
        likedBy:     []
      };
      this.myPosts.unshift(newPost);
      this.savePosts();
      await this.showToast('Post published! 🚀', 'success');
    }
    this.closePublishModal();
  }

  toggleLike(post: Post) {
    if (!post.likedBy) post.likedBy = [];
    const alreadyLiked = post.likedBy.includes(this.currentUserId);
    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter(id => id !== this.currentUserId);
      post.liked   = false;
    } else {
      post.likedBy.push(this.currentUserId);
      post.liked   = true;
    }
    post.likes = post.likedBy.length;
    this.savePosts();
    this.cdr.detectChanges();
  }

  openPostInReels(post: Post) {
    if (!post.mediaUrl) return;
    const reelData = {
      id:        post.id,
      mediaUrl:  post.mediaUrl,
      mediaType: post.type === 'photo' ? 'image' : 'video',
      caption:   post.caption,
      username:  post.userName,
    };
    localStorage.setItem('openReel', JSON.stringify(reelData));
    this.router.navigate(['/reels']);
  }

  openComments(post: Post) {
    const saved = localStorage.getItem('comments_' + post.id);
    if (saved) {
      post.comments = JSON.parse(saved).length;
    }
    localStorage.setItem('activeCommentPost', JSON.stringify(post));
    this.router.navigate(['/comment-view']);
  }

  ionViewWillEnter() {
    this.refreshCommentCounts();
    this.loadMetaFromStorage();
    this.hydrateMediaUrls();
  }

  openStory(story: Story) {
    this.activeStory     = story;
    this.storyReply      = '';
    this.showStoryViewer = true;
    setTimeout(() => {
      const video = document.querySelector('.vn-story-full-img') as HTMLVideoElement;
      if (video && story.type === 'video') {
        video.muted  = false;
        video.volume = 1.0;
        video.play().catch(() => {});
      }
      if (story.type === 'photo') {
        this.playStoryOpenSound();
      }
    }, 300);
  }

  private playStoryOpenSound() {
    try {
      const audioCtx   = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode   = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch {}
  }

  closeStoryViewer() {
    this.showStoryViewer = false;
    this.activeStory     = null;
    this.storyReply      = '';
  }

  toggleStoryLike() {
    if (!this.activeStory) return;
    this.activeStory.storyLiked = !this.activeStory.storyLiked;
    this.activeStory.storyLikes = (this.activeStory.storyLikes || 0) +
      (this.activeStory.storyLiked ? 1 : -1);
    this.saveStories();
    this.cdr.detectChanges();
  }

  async openStoryComments() {
    if (!this.activeStory) return;
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Story Comments',
      buttons: [
        { text: 'Write a comment...', icon: 'chatbubble-outline', handler: () => {} },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async sendStoryReply() {
    if (!this.storyReply.trim()) return;
    await this.showToast(`Reply sent: "${this.storyReply}" 💬`, 'success');
    this.storyReply = '';
  }

  async shareStory() {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'VibeNet Story', text: 'Check out this story!', url: shareUrl });
      } catch (err: any) {
        if (err?.name !== 'AbortError') await this.showToast('Could not share.', 'danger');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        await this.showToast('Link copied! 🔗', 'medium');
      } catch {
        await this.showToast('Could not copy link.', 'danger');
      }
    }
  }

  async openPostOptions(post: Post) {
    const isOwn = post.userId === this.currentUserId;
    const buttons: any[] = [];
    if (isOwn) {
      buttons.push(
        { text: 'Edit Caption', icon: 'pencil-outline', handler: () => console.log('Edit:', post.id) },
        { text: 'Delete Post', icon: 'trash-outline', role: 'destructive', handler: () => this.deletePost(post) }
      );
    } else {
      buttons.push(
        { text: 'Report Post', icon: 'flag-outline', handler: () => this.showToast('Post reported.', 'warning') },
        { text: 'Delete Post', icon: 'trash-outline', role: 'destructive', handler: () => this.deletePost(post) }
      );
    }
    buttons.push({ text: 'Cancel', role: 'cancel' });
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Post Options',
      buttons
    });
    await actionSheet.present();
  }

  async sharePost(post: Post) {
    const shareUrl  = window.location.href;
    const shareText = post.caption
      ? `${post.caption} ${post.hashtags.map(t => '#' + t).join(' ')}`
      : 'Check this out on VibeNet!';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'VibeNet', text: shareText, url: shareUrl });
      } catch (err: any) {
        if (err?.name !== 'AbortError') await this.showToast('Could not share.', 'danger');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        await this.showToast('Link copied! 🔗', 'medium');
      } catch {
        await this.showToast('Could not copy link.', 'danger');
      }
    }
  }

  async deletePost(post: Post) {
    await deleteMedia('post_' + post.id).catch(() => {});
    this.myPosts = this.myPosts.filter(p => p.id !== post.id);
    const key = this.getPostsKey(post.userId);
    const saved: Post[] = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = saved.filter(p => p.id !== post.id);
    localStorage.setItem(key, JSON.stringify(updated));
    this.cdr.detectChanges();
    this.showToast('Post deleted.', 'danger');
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  openMessages()     { console.log('Open messages'); }
  goToNotification() { this.router.navigate(['/notification']); }

  goToTab(tab: string) {
    this.activeTab = tab;
    const routes: { [key: string]: string } = {
      home:    '/homefeed',
      explore: '/explore',
      chat:    '/chatsystem',
      profile: '/userprofile'
    };
    if (routes[tab]) this.router.navigate([routes[tab]]);
  }

  // ✅ AI Assistant navigation
  goToAI() {
    this.activeTab = 'ai';
    this.router.navigate(['/ai-assistant']);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private resetForm() {
    this.newPost       = { caption: '', location: '', hashtags: '' };
    this.selectedMedia = null;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 2200, position: 'bottom', color, cssClass: 'vn-toast'
    });
    await toast.present();
  }
}