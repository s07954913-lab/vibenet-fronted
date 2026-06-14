import {
  Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy,
  ViewChildren, ViewChild, QueryList, ElementRef, AfterViewInit, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, MenuController, ToastController } from '@ionic/angular';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

import { addIcons } from 'ionicons';
import {
  notificationsOutline, pencil, settingsOutline, gridOutline,
  filmOutline, bookmarkOutline, homeOutline, searchOutline,
  addCircleOutline, playOutline, person, menuOutline, cameraOutline,
  checkmarkCircle, closeOutline, lockClosedOutline, repeatOutline,
  heartOutline, heart, shareSocialOutline, footstepsOutline, add, personAddOutline,
  walletOutline, timeOutline, cloudDownloadOutline, qrCodeOutline,
  personCircleOutline, chevronForwardOutline, logoTiktok, scanOutline,
  linkOutline, shareOutline, rocket, trendingUpOutline, personOutline,
  chatbubbleOutline, arrowBackOutline, musicalNotesOutline, openOutline,
  pauseOutline, sparklesOutline, personRemoveOutline, peopleOutline, playCircleOutline,
  imageOutline, addOutline, textOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { Dateservice } from '../dateservice';
import { Reels, ForYouVideoItem } from '../reels';
import { Globall } from '../globall';
import { FollowService } from '../follow';
import { PostUploadService } from '../post-upload';
import { Subscription } from 'rxjs';

declare global { const google: any; }

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-userprofile',
  templateUrl: './userprofile.page.html',
  styleUrls: ['./userprofile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HttpClientModule]
})
export class UserprofilePage implements OnInit, OnDestroy, AfterViewInit {

  @ViewChildren('reelVideoPlayer') reelVideoElements!: QueryList<ElementRef<HTMLVideoElement>>;
  @ViewChild('reelsContainer') reelsContainer!: ElementRef<HTMLElement>;

  CameraSource = CameraSource;

  userName: string      = '';
  userEmail: string     = '';
  bio: string           = '';
  profileImage: string  = '';
  activeSegment: string = 'posts';
  isEditModalOpen       = false;
  showPhotoOptions      = false;
  isLoadingLiveVideos   = false;
  isLoadingPosts        = false;
  tempName              = '';
  tempBio               = '';

  followingCount: number    = 0;
  followerCount: number     = 0;
  likesCount: number        = 0;
  followingList: any[]      = [];
  notificationCount: number = 3;

  forYouReels: ForYouVideoItem[] = [];
  private isFetchingMore = false;

  private videoIntersectionObserver!: IntersectionObserver;
  private subscriptions: Subscription[] = [];

  userPosts: any[] = [];

  savedItems: any[]        = [];
  isLoadingSaved: boolean  = false;

  public photoActionButtons = [
    { text: 'Camera',  handler: () => this.openCamera(CameraSource.Camera) },
    { text: 'Gallery', handler: () => this.openCamera(CameraSource.Photos) },
    { text: 'Cancel',  role: 'cancel' }
  ];

  currentLang = 'English (US)';
  ui: any = {};

  translations: any = {
    'English (US)': {
      welcome: 'WELCOME TO APP',
      menu_home: 'Home', menu_balance: 'Balance',
      menu_activity: 'Activity center', menu_qr: 'Your QR code',
      menu_settings: 'Settings', whats_good: "What's good?",
      following: 'Following', follower: 'Follower', likes: 'Likes',
      edit_profile: 'Edit Profile', tab_posts: 'Posts',
      tab_reels: 'Reels', tab_saved: 'Saved',
      saved_empty: 'Your Saved items will appear here.',
      reels_title: 'Reels', follow: 'Follow', share: 'Share', open: 'Open',
      loading_reels: 'Loading more reels...', modal_title: 'Edit Profile',
      modal_close: 'Close', modal_name: 'Name', modal_bio: 'Bio',
      modal_save: 'Save Changes', unfollow: 'Unfollow',
      no_following: 'Not following anyone yet',
      follow_suggestion: 'Follow users from Reels to see them here'
    }
  };

  private get base(): string {
    return Capacitor.isNativePlatform()
      ? 'http://192.168.0.105:8000/api'
      : 'http://127.0.0.1:8000/api';
  }

  constructor(
    public router: Router,
    public dateService: Dateservice,
    public menuCtrl: MenuController,
    private http: HttpClient,
    private ngZone: NgZone,
    private reelsService: Reels,
    private global: Globall,
    private followService: FollowService,
    private postUploadService: PostUploadService,
    private toastController: ToastController
  ) {
    addIcons({
      notificationsOutline, pencil, settingsOutline, gridOutline,
      filmOutline, bookmarkOutline, homeOutline, searchOutline,
      addCircleOutline, playOutline, person, menuOutline, cameraOutline,
      checkmarkCircle, closeOutline, lockClosedOutline, repeatOutline,
      heartOutline, heart, shareSocialOutline, footstepsOutline, add, personAddOutline,
      walletOutline, timeOutline, cloudDownloadOutline, qrCodeOutline,
      personCircleOutline, chevronForwardOutline, logoTiktok, scanOutline,
      linkOutline, shareOutline, rocket, trendingUpOutline, personOutline,
      chatbubbleOutline, arrowBackOutline, musicalNotesOutline, openOutline,
      pauseOutline, sparklesOutline, personRemoveOutline, peopleOutline, playCircleOutline,
      imageOutline, addOutline, textOutline,
    });
  }

  ngOnInit() {
    this.ui = this.translations['English (US)'];
    this.setupSubscriptions();
  }

  ionViewWillEnter() {
    this.profileImage = '';

    const state = history.state;
    if (state && state['userId'] && state['userId'] !== localStorage.getItem('userId')) {
      this.userName       = state['username'] || 'Unknown';
      this.profileImage   = '';
      this.bio            = state['bio'] || state['email'] || '';
      this.followerCount  = 0;
      this.followingCount = 0;
      this.likesCount     = 0;
      this.userPosts      = [];
      this.followingList  = [];
      return;
    }

    this.refreshCounts();
    this.loadFollowingList();
    this.loadUserPosts();
    this.loadSavedItems();
    this.loadMyProfile();
    this.loadFollowingCountFromStorage();
  }

  ngAfterViewInit() {
    this.initializeGoogleIdentityServices();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.disconnectObserver();
  }

  // ─── IndexedDB helpers ───────────────────────────────────────────────────────

  private openIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('vibenet_db', 1);
      request.onupgradeneeded = (event: any) => {
        const db: IDBDatabase = event.target.result;
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media');
        }
      };
      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror   = (event: any) => reject(event.target.error);
    });
  }

  private getMediaFromIDB(db: IDBDatabase, key: string): Promise<string | null> {
    return new Promise((resolve) => {
      const tx      = db.transaction('media', 'readonly');
      const store   = tx.objectStore('media');
      const request = store.get(key);
      request.onsuccess = (event: any) => {
        const result = event.target.result;
        if (result instanceof Blob) {
          resolve(URL.createObjectURL(result));
        } else if (typeof result === 'string') {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  // ─── Profile loading ─────────────────────────────────────────────────────────

  private loadFollowingCountFromStorage() {
    const currentUserId = localStorage.getItem('userId') || 'guest';

    const serviceKey = `followingUsers_${currentUserId}`;
    const serviceRaw = localStorage.getItem(serviceKey);

    if (serviceRaw) {
      try {
        const list = JSON.parse(serviceRaw);
        if (Array.isArray(list) && list.length > 0) {
          this.ngZone.run(() => {
            this.followingCount = list.length;
            this.followingList  = list;
          });
          return;
        }
      } catch {}
    }

    const simpleKey = `vn_following_${currentUserId}`;
    const simpleRaw = localStorage.getItem(simpleKey);

    if (simpleRaw) {
      try {
        const list: string[] = JSON.parse(simpleRaw);
        if (Array.isArray(list) && list.length > 0) {
          this.ngZone.run(() => {
            this.followingCount = list.length;
          });
        }
      } catch {}
    }
  }

  private loadFollowerCountFromStorage() {
    const currentUserId = localStorage.getItem('userId') || 'guest';
    const notifKey = `vn_notifications_${currentUserId}`;
    const raw = localStorage.getItem(notifKey);

    if (raw) {
      try {
        const notifications: any[] = JSON.parse(raw);
        const followNotifs = notifications.filter(n =>
          n.type === 'Follow' || n.type === 'follow'
        );
        this.ngZone.run(() => {
          this.followerCount = followNotifs.length;
        });
      } catch {}
    }
  }

  async loadMyProfile() {
    this.profileImage = '';

    const auth = getAuth();
    const currentUser = await new Promise<any>((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => { unsub(); resolve(user); });
    });

    if (currentUser) {
      this.ngZone.run(() => {
        if (currentUser.displayName) {
          this.userName = currentUser.displayName;
        } else if (currentUser.email) {
          this.userName = currentUser.email.split('@')[0];
        }
        if (currentUser.email) {
          this.userEmail = currentUser.email;
        }
      });
    }

    const savedName  = localStorage.getItem('userName');
    const savedEmail = localStorage.getItem('userEmail');

    this.ngZone.run(() => {
      if (!this.userName  && savedName)  this.userName  = savedName;
      if (!this.userEmail && savedEmail) this.userEmail = savedEmail;
    });

    let userId = currentUser?.uid;
    if (!userId) {
      const { value } = await Preferences.get({ key: 'userId' });
      userId = value || localStorage.getItem('userId');
    }
    if (!userId) return;

    this.loadFollowingCountFromStorage();
    this.loadFollowerCountFromStorage();

    this.http.get<any>(`${this.base}/profile/${userId}/`).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          if (data.name) this.userName = data.name;
          if (data.bio)  this.bio      = data.bio;
          if (data.followers !== undefined) this.followerCount  = data.followers;
          if (data.following !== undefined) this.followingCount = data.following;
          if (data.likes     !== undefined) this.likesCount     = data.likes;
        });
      },
      error: () => {
        console.warn('Backend nahi mila, localStorage counts use kar rahe hain');
        this.loadFollowingCountFromStorage();
        this.loadFollowerCountFromStorage();
      }
    });
  }

  getInitials(): string {
    const name = this.userName || this.userEmail || '?';
    return name.charAt(0).toUpperCase();
  }

  // ─── Posts loading ───────────────────────────────────────────────────────────

  async loadUserPosts() {
    this.isLoadingPosts = true;
    const uid = localStorage.getItem('userId') || 'guest';
    const key = 'vn_posts_' + uid;

    try {
      const raw = localStorage.getItem(key);
      const posts: any[] = raw ? JSON.parse(raw) : [];

      if (posts.length === 0) {
        this.ngZone.run(() => {
          this.userPosts      = [];
          this.isLoadingPosts = false;
        });
        return;
      }

      const hydrated: any[] = [];
      const db = await this.openIDB();

      const promises = posts.map(async (post: any) => {
        let url: string | null = null;

        const keysToTry = [
          'post_' + post.id,
          'vn_media_' + post.id,
          'media_' + post.id,
          post.id,
        ];
        for (const k of keysToTry) {
          url = await this.getMediaFromIDB(db, k);
          if (url) break;
        }

        if (!url && post.mediaUrl) url = post.mediaUrl;
        if (!url && post.imageUrl) url = post.imageUrl;
        if (!url && post.videoUrl) url = post.videoUrl;

        hydrated.push({ ...post, mediaUrl: url || undefined });
      });

      await Promise.all(promises);

      hydrated.sort((a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));

      this.ngZone.run(() => {
        this.userPosts      = hydrated;
        this.isLoadingPosts = false;
      });

    } catch (err) {
      console.error('loadUserPosts error:', err);
      this.ngZone.run(() => {
        this.userPosts      = [];
        this.isLoadingPosts = false;
      });
    }
  }

  // ─── Saved items loading (IDB hydration added) ───────────────────────────────

  async loadSavedItems() {
    this.isLoadingSaved = true;
    const uid = localStorage.getItem('userId') || 'guest';
    const key = 'vn_saved_' + uid;

    try {
      const raw = localStorage.getItem(key);
      const items: any[] = raw ? JSON.parse(raw) : [];

      if (items.length === 0) {
        this.ngZone.run(() => {
          this.savedItems     = [];
          this.isLoadingSaved = false;
        });
        return;
      }

      // ✅ IndexedDB se media URLs hydrate karo (blob URLs reload ke baad expire ho jaati hain)
      const db = await this.openIDB();

      const hydrated: any[] = [];

      const promises = items.map(async (item: any) => {
        let url: string | null = null;

        // IDB mein multiple keys try karo
        const keysToTry = [
          'post_' + item.id,
          'vn_media_' + item.id,
          'media_' + item.id,
          item.id,
        ];

        for (const k of keysToTry) {
          if (!k || k === 'undefined') continue;
          url = await this.getMediaFromIDB(db, k);
          if (url) break;
        }

        // IDB mein nahi mila to original URL use karo
        if (!url && item.mediaUrl) url = item.mediaUrl;
        if (!url && item.videoUrl) url = item.videoUrl;
        if (!url && item.imageUrl) url = item.imageUrl;

        hydrated.push({ ...item, mediaUrl: url || undefined });
      });

      await Promise.all(promises);

      // ✅ Newest saved pehle
      hydrated.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

      this.ngZone.run(() => {
        this.savedItems     = hydrated;
        this.isLoadingSaved = false;
      });

    } catch (err) {
      console.error('loadSavedItems error:', err);
      this.ngZone.run(() => {
        this.savedItems     = [];
        this.isLoadingSaved = false;
      });
    }
  }

  // ✅ Saved item tap karo to reels page pe open ho
  openSavedItem(item: any) {
    localStorage.setItem('openReel', JSON.stringify({
      username:  item.username,
      caption:   item.caption,
      mediaUrl:  item.mediaUrl,
      mediaType: item.mediaType,
    }));
    this.router.navigate(['/reels']);
  }

  // ─── Subscriptions ───────────────────────────────────────────────────────────

  private setupSubscriptions() {
    const followSub = this.followService.getCount$().subscribe((count: number) => {
      this.ngZone.run(() => {
        if (count > 0) {
          this.followingCount = count;
        } else {
          this.loadFollowingCountFromStorage();
        }
      });
    });
    this.subscriptions.push(followSub);

    const listSub = this.followService.getFollowingList$().subscribe((list: any[]) => {
      this.ngZone.run(() => {
        this.followingList = [...list];
        if (list.length > 0) {
          this.followingCount = list.length;
        }
      });
    });
    this.subscriptions.push(listSub);

    const userSub = this.dateService.currentUser.subscribe((data: any) => {
      if (data) {
        if (data.name) this.userName = data.name;
        if (data.bio)  this.bio      = data.bio;
        if (data.followers !== undefined) this.followerCount = data.followers;
        if (data.likes     !== undefined) this.likesCount    = data.likes;
      }
    });
    this.subscriptions.push(userSub);

    const langSub = this.global.lang$.subscribe((lang: string) => {
      this.currentLang = lang;
      this.ui = this.translations[lang] || this.translations['English (US)'];
      document.documentElement.dir = (lang === 'Urdu' || lang === 'Arabic') ? 'rtl' : 'ltr';
    });
    this.subscriptions.push(langSub);
  }

  // ─── Follow helpers ──────────────────────────────────────────────────────────

  private refreshCounts() {
    const serviceCount = this.followService.getCurrentCount();

    if (serviceCount > 0) {
      this.followingCount = serviceCount;
      return;
    }

    const currentUserId = localStorage.getItem('userId') || 'guest';

    const serviceKey = `followingUsers_${currentUserId}`;
    const serviceRaw = localStorage.getItem(serviceKey);
    if (serviceRaw) {
      try {
        const list = JSON.parse(serviceRaw);
        if (Array.isArray(list) && list.length > 0) {
          this.followingCount = list.length;
          return;
        }
      } catch {}
    }

    const simpleKey = `vn_following_${currentUserId}`;
    const simpleRaw = localStorage.getItem(simpleKey);
    if (simpleRaw) {
      try {
        const list: string[] = JSON.parse(simpleRaw);
        if (Array.isArray(list)) {
          this.followingCount = list.length;
        }
      } catch {}
    }
  }

  private loadFollowingList() {
    this.followingList = [...this.followService.getCurrentFollowingList()];
  }

  async unfollowFromProfile(user: any, event: Event) {
    event?.stopPropagation();

    const isNowFollowing = this.followService.toggle(
      user.backendUserId || user.userId || '',
      user.channelTitle || user.name || '',
      user.profileImage || '',
      user.channelTitle
    );

    if (!isNowFollowing) {
      const currentUserId = localStorage.getItem('userId') || 'guest';
      const simpleKey = `vn_following_${currentUserId}`;
      const simpleRaw = localStorage.getItem(simpleKey);
      if (simpleRaw) {
        try {
          let list: string[] = JSON.parse(simpleRaw);
          list = list.filter(id => id !== (user.backendUserId || user.userId));
          localStorage.setItem(simpleKey, JSON.stringify(list));
        } catch {}
      }

      const toast = await this.toastController.create({
        message: `Unfollowed ${user.channelTitle || user.name}`,
        duration: 1500, position: 'bottom', color: 'dark'
      });
      await toast.present();

      this.loadFollowingCountFromStorage();
    }
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  async handleRefresh(event: any) {
    this.profileImage = '';
    this.refreshCounts();
    this.loadFollowingList();
    this.loadFollowingCountFromStorage();
    this.loadFollowerCountFromStorage();
    await this.loadSavedItems();
    await this.loadUserPosts();
    await this.loadMyProfile();
    const toast = await this.toastController.create({
      message: 'Profile refreshed', duration: 1000, position: 'bottom'
    });
    await toast.present();
    event.target.complete();
  }

  // ─── Share ───────────────────────────────────────────────────────────────────

  async shareProfile() {
    const shareData = {
      title: this.userName,
      text:  `Check out ${this.userName}'s profile on VibeNet AI!`,
      url:   'https://vibenet.ai/profile/' + this.userName.replace(/\s/g, '')
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        const toast = await this.toastController.create({
          message: 'Profile link copied!', duration: 1500, position: 'bottom'
        });
        await toast.present();
      }
    } catch (error) { console.log('Share failed', error); }
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  async goToUpload() {
    const { value: prefValue } = await Preferences.get({ key: 'isLoggedIn' });
    const localValue = localStorage.getItem('isLoggedIn');
    const isLoggedIn = prefValue === 'true' || localValue === 'true';

    if (!isLoggedIn) {
      const toast = await this.toastController.create({
        message: '❌ Pehle login karein',
        duration: 2000, position: 'bottom', color: 'danger'
      });
      await toast.present();
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/postupload']);
  }

  goToReelsPage()            { this.router.navigate(['/reels']); }
  replaceSpaces(str: string) { return str.replace(/\s/g, ''); }
  openPost(post: any)        { console.log('Open post:', post); }

  isVideoUrl(url: string): boolean {
    if (!url) return false;
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const lower = url.toLowerCase().split('?')[0];
    if (url.startsWith('blob:')) {
      return false;
    }
    return videoExts.some(ext => lower.endsWith(ext)) || lower.includes('video');
  }

  // ─── Google Identity ─────────────────────────────────────────────────────────

  initializeGoogleIdentityServices() {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_SIGN_IN_CLIENT_googleusercontent.com',
        callback: (response: any) => this.handleGoogleCredentialResponse(response)
      });
      google.accounts.id.renderButton(
        document.getElementById('googleBtnContainer'),
        { theme: 'outline', size: 'large', type: 'standard', shape: 'pill' }
      );
    }
  }

  handleGoogleCredentialResponse(response: any) {
    if (response?.credential) {
      const base64Url   = response.credential.split('.')[1];
      const base64      = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
      const googleUser = JSON.parse(jsonPayload);
      this.ngZone.run(() => {
        if (googleUser.name) this.userName = googleUser.name;
      });
    }
  }
isFollowersModalOpen = false;
followersList: any[] = [];
  // ─── Camera ──────────────────────────────────────────────────────────────────

  async openCamera(source: CameraSource) {
    this.showPhotoOptions = false;
    try {
      const image = await Camera.getPhoto({
        quality: 90, allowEditing: false,
        resultType: CameraResultType.Uri, source
      });
      if (image.webPath) this.profileImage = image.webPath;
    } catch (error) { console.log('Camera closed or failed', error); }
  }

  // ─── Edit modal ──────────────────────────────────────────────────────────────

  openEditModal() {
    this.tempName = this.userName;
    this.tempBio  = this.bio;
    this.isEditModalOpen = true;
  }

  saveProfile() {
    if (this.tempName.trim()) this.userName = this.tempName.trim();
    if (this.tempBio.trim())  this.bio      = this.tempBio.trim();
    this.isEditModalOpen = false;
  }

  // ─── Reels ───────────────────────────────────────────────────────────────────

  refreshAndLoadFreshLiveVideos(count: number = 6) {
    this.isLoadingLiveVideos = true;
    this.forYouReels = [];
    this.reelsService.resetPagination?.();

    this.reelsService.fetchPopularReels(count).subscribe({
      next: (reels: ForYouVideoItem[]) => {
        this.ngZone.run(() => {
          this.forYouReels         = reels;
          this.isLoadingLiveVideos = false;
          setTimeout(() => this.initVideoObserver(), 600);
        });
      },
      error: () => { this.isLoadingLiveVideos = false; }
    });
  }

  loadMoreForYouVideos(event: any) {
    if (this.isFetchingMore) { event.target.complete(); return; }
    this.isFetchingMore = true;

    this.reelsService.fetchReels(4).subscribe({
      next: (newReels: ForYouVideoItem[]) => {
        this.ngZone.run(() => {
          this.forYouReels    = [...this.forYouReels, ...newReels];
          this.isFetchingMore = false;
          event.target.complete();
          setTimeout(() => this.observeNewVideos(), 400);
        });
      },
      error: () => {
        this.isFetchingMore = false;
        event.target.complete();
      }
    });
  }

  initVideoObserver()              { this.disconnectObserver(); }
  toggleVideoPlayback(event: Event) {}
  toggleLike(reel: ForYouVideoItem) {}

  private observeNewVideos() {
    if (!this.reelVideoElements || !this.videoIntersectionObserver) return;
    this.reelVideoElements.forEach(el =>
      this.videoIntersectionObserver.observe(el.nativeElement)
    );
  }

  private disconnectObserver() {
    if (this.videoIntersectionObserver) this.videoIntersectionObserver.disconnect();
  }

  // ─── Segment ─────────────────────────────────────────────────────────────────

  onSegmentChange() {
    if (this.activeSegment === 'reels') {
      this.refreshAndLoadFreshLiveVideos(6);
    } else if (this.activeSegment === 'posts') {
      this.loadUserPosts();
    } else if (this.activeSegment === 'saved') {
      this.loadSavedItems();
    } else {
      this.reelVideoElements?.forEach(el => el.nativeElement.pause());
      this.disconnectObserver();
    }
  }

  // ─── Menu ────────────────────────────────────────────────────────────────────

  closeMenu()          { this.menuCtrl.close('vibenet-menu'); }

  goToReel(reelItem: ForYouVideoItem) {
    this.router.navigate(['/reels'], {
      state: { selectedReel: reelItem, allReels: this.forYouReels }
    });
  }

  goToBalance()        { this.closeMenu(); this.router.navigate(['/balance']); }
  goToActivityCenter() { this.closeMenu(); this.router.navigate(['/activity-center']); }
  goToQRCode()         { this.closeMenu(); this.router.navigate(['/qr-code']); }
  goToSettings()       { this.closeMenu(); this.router.navigate(['/setting']); }
  goToMyAccount()      { this.router.navigate(['/myaccount']); }
  goToNotifications()  { this.router.navigate(['/notification']); }
  openFollowingModal() {
  console.log('Following modal open');
  // TODO: yahan modal logic lagana hai
}

openFollowersModal() {
  console.log('Followers modal open');
  // TODO: yahan modal logic lagana hai
}
}