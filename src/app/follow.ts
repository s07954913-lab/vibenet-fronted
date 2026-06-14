// follow.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export interface FollowUser {
  channelTitle: string;
  followedAt: string;
  profileImage: string;
  backendUserId: string;
  userId?: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FollowService {

  private followingCount$ = new BehaviorSubject<number>(0);
  private followingList$  = new BehaviorSubject<FollowUser[]>([]);

  // ✅ Current logged-in user ki ID — yahan store hogi
  private currentUserId: string = '';
  private currentUserName: string = '';

  constructor(private http: HttpClient) {
    this.initCurrentUser();
  }

  // ══════════════════════════════════════════
  //  INIT — login hone par userId set karo
  // ══════════════════════════════════════════

  async initCurrentUser() {
    // Mobile: Capacitor Preferences se uthao
    let userId = '';
    let userName = '';
    
    if (Capacitor.isNativePlatform()) {
      const { value: userIdValue } = await Preferences.get({ key: 'userId' });
      const { value: userNameValue } = await Preferences.get({ key: 'userName' });
      userId = userIdValue || '';
      userName = userNameValue || '';
    }
    
    // Browser fallback
    if (!userId) {
      userId = localStorage.getItem('userId') || '';
      userName = localStorage.getItem('userName') || localStorage.getItem('username') || 'Someone';
    }

    if (userId) {
      this.currentUserId = userId;
      this.currentUserName = userName;
      this.loadFromStorage(userId);
    }
  }

  // ✅ Jab login ho (LoginPage se call karo)
  async setCurrentUser(userId: string, userName?: string) {
    this.currentUserId = userId;
    if (userName) {
      this.currentUserName = userName;
      localStorage.setItem('userName', userName);
    }
    await this.loadFromStorage(userId);
  }

  // ✅ Jab logout ho
  async clearCurrentUser() {
    this.currentUserId = '';
    this.currentUserName = '';
    this.followingList$.next([]);
    this.followingCount$.next(0);
  }

  // ══════════════════════════════════════════
  //  NOTIFICATION METHODS
  // ══════════════════════════════════════════

  /**
   * Save follow notification to target user's localStorage
   */
  private saveFollowNotification(
    fromId: string,
    fromName: string,
    toUserId: string
  ) {
    if (!toUserId || toUserId === 'guest') return;
    
    const notifKey = `vn_notifications_${toUserId}`;
    const raw = localStorage.getItem(notifKey);
    const existing: any[] = raw ? JSON.parse(raw) : [];

    const newNotif = {
      id: Date.now(),
      from_id: fromId,
      from_name: fromName,
      from_img: '',
      type: 'Follow',
      is_read: false,
      created_at: new Date().toISOString()
    };

    existing.unshift(newNotif); // newest first
    localStorage.setItem(notifKey, JSON.stringify(existing));
  }

  // ══════════════════════════════════════════
  //  STORAGE — HAR USER KI ALAG KEY
  // ══════════════════════════════════════════

  private storageKey(userId: string): string {
    // e.g. "followingUsers_uid_abc123"
    return `followingUsers_${userId}`;
  }

  private async loadFromStorage(userId: string) {
    try {
      const key = this.storageKey(userId);
      let saved: string | null = null;

      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key });
        saved = value;
      } else {
        saved = localStorage.getItem(key);
      }

      if (saved) {
        const users = JSON.parse(saved);
        this.followingList$.next(users);
        this.followingCount$.next(users.length);
      } else {
        // Storage mein nahi — backend se fetch karo
        this.syncFromBackend(userId);
      }
    } catch (e) {
      console.error('Error loading following list', e);
    }
  }

  private async saveToStorage(userId: string, list: FollowUser[]) {
    try {
      const key = this.storageKey(userId);
      const value = JSON.stringify(list);

      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key, value });
      }
      // Hamesha localStorage mein bhi save karo (browser + fallback)
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Error saving following list', e);
    }
  }

  // ══════════════════════════════════════════
  //  BACKEND SYNC
  // ══════════════════════════════════════════

  private get baseUrl(): string {
    return Capacitor.isNativePlatform()
      ? 'http://192.168.0.105:8000/api'
      : 'http://127.0.0.1:8000/api';
  }

  // Backend se following list fetch karo (first login ya fresh install)
  private syncFromBackend(userId: string) {
    if (!userId) return;
    this.http.get<any[]>(`${this.baseUrl}/users/${userId}/following/`).subscribe({
      next: (data) => {
        const list: FollowUser[] = (data || []).map((item: any) => ({
          channelTitle: item.name || item.username || 'User',
          followedAt: new Date().toISOString(),
          profileImage: item.img || '',
          backendUserId: item.user_id || '',
          userId: item.user_id || '',
          name: item.name || item.username
        }));
        this.followingList$.next(list);
        this.followingCount$.next(list.length);
        this.saveToStorage(userId, list);
      },
      error: () => {
        // Backend nahi mila — empty list rakhein
        this.followingList$.next([]);
        this.followingCount$.next(0);
      }
    });
  }

  // Backend ko follow/unfollow bhejo
  private syncFollowToBackend(
    action: 'follow' | 'unfollow',
    channelTitle: string,
    targetUserId?: string
  ) {
    if (!this.currentUserId || !targetUserId) return;

    const url = action === 'follow' 
      ? `${this.baseUrl}/users/follow/`
      : `${this.baseUrl}/users/unfollow/`;

    this.http.post(url, {
      follower_id: this.currentUserId,
      following_id: targetUserId
    }).subscribe({
      next: () => {},
      error: (err) => console.error('Backend follow sync error:', err)
    });
  }

  // ══════════════════════════════════════════
  //  PUBLIC API — UPDATED TOGGLE METHOD
  // ══════════════════════════════════════════

  /**
   * Check if following by userId or channelTitle
   */
  isFollowingById(userId: string): boolean {
    return this.followingList$.getValue()
      .some(u => u.backendUserId === userId || u.userId === userId);
  }

  isFollowing(channelTitle: string): boolean {
    return this.followingList$.getValue()
      .some(u => u.channelTitle === channelTitle);
  }

  /**
   * ✅ UPDATED: toggle method with notification
   * @param targetUserId - User ID to follow/unfollow
   * @param targetName - User name for notification
   * @param profileImage - Optional profile image
   * @param channelTitle - Optional channel title
   */
  toggle(
    targetUserId: string, 
    targetName: string,
    profileImage?: string,
    channelTitle?: string
  ): boolean {
    if (!this.currentUserId) {
      console.warn('FollowService: currentUserId set nahi hai!');
      return false;
    }

    // Apne aap ko follow nahi kar sakte
    if (targetUserId === this.currentUserId) {
      return false;
    }

    const currentList = this.followingList$.getValue();
    const existsIndex = currentList.findIndex(u => 
      u.backendUserId === targetUserId || u.userId === targetUserId
    );
    
    let updatedList: FollowUser[];
    let isNowFollowing: boolean;

    if (existsIndex !== -1) {
      // ─── UNFOLLOW ─────────────────────────
      updatedList = currentList.filter((_, i) => i !== existsIndex);
      isNowFollowing = false;
    } else {
      // ─── FOLLOW ───────────────────────────
      const newUser: FollowUser = {
        channelTitle: channelTitle || targetName,
        followedAt: new Date().toISOString(),
        profileImage: profileImage || '',
        backendUserId: targetUserId,
        userId: targetUserId,
        name: targetName
      };
      updatedList = [...currentList, newUser];
      isNowFollowing = true;

      // ✅ Send follow notification
      const currentUserName = this.currentUserName || 
                              localStorage.getItem('userName') || 
                              localStorage.getItem('username') || 
                              'Someone';
      this.saveFollowNotification(this.currentUserId, currentUserName, targetUserId);
    }

    this.followingList$.next(updatedList);
    this.followingCount$.next(updatedList.length);

    // ✅ Sirf IS USER ki key mein save — doosri IDs affect nahi hongi
    this.saveToStorage(this.currentUserId, updatedList);

    // Backend sync
    this.syncFollowToBackend(
      isNowFollowing ? 'follow' : 'unfollow',
      targetName,
      targetUserId
    );

    return isNowFollowing;
  }

  /**
   * Legacy toggle method (by channelTitle) for backward compatibility
   */
  toggleByChannelTitle(channelTitle: string, profileImage?: string, backendUserId?: string): boolean {
    if (!this.currentUserId) {
      console.warn('FollowService: currentUserId set nahi hai!');
      return false;
    }

    const currentList = this.followingList$.getValue();
    const existsIndex = currentList.findIndex(u => u.channelTitle === channelTitle);
    let updatedList: FollowUser[];
    let isNowFollowing: boolean;

    if (existsIndex !== -1) {
      updatedList = currentList.filter((_, i) => i !== existsIndex);
      isNowFollowing = false;
    } else {
      const newUser: FollowUser = {
        channelTitle,
        followedAt: new Date().toISOString(),
        profileImage: profileImage || '',
        backendUserId: backendUserId || '',
        userId: backendUserId || '',
        name: channelTitle
      };
      updatedList = [...currentList, newUser];
      isNowFollowing = true;

      // ✅ Send follow notification
      if (backendUserId) {
        const currentUserName = this.currentUserName || 
                                localStorage.getItem('userName') || 
                                'Someone';
        this.saveFollowNotification(this.currentUserId, currentUserName, backendUserId);
      }
    }

    this.followingList$.next(updatedList);
    this.followingCount$.next(updatedList.length);
    this.saveToStorage(this.currentUserId, updatedList);

    // Backend sync
    this.syncFollowToBackend(
      isNowFollowing ? 'follow' : 'unfollow',
      channelTitle,
      backendUserId
    );

    return isNowFollowing;
  }

  // ══════════════════════════════════════════
  //  GETTERS
  // ══════════════════════════════════════════

  getCount$() { return this.followingCount$.asObservable(); }
  getCurrentCount(): number { return this.followingCount$.getValue(); }
  getFollowingList$() { return this.followingList$.asObservable(); }
  getCurrentFollowingList(): FollowUser[] { return this.followingList$.getValue(); }
  getCurrentUserId(): string { return this.currentUserId; }

  // ══════════════════════════════════════════
  //  UTILITY
  // ══════════════════════════════════════════

  clearAllFollowing() {
    if (!this.currentUserId) return;
    const key = this.storageKey(this.currentUserId);
    this.followingList$.next([]);
    this.followingCount$.next(0);
    localStorage.removeItem(key);
    if (Capacitor.isNativePlatform()) {
      Preferences.remove({ key });
    }
  }
}