// explore.page.ts — UPDATED (secure version)
// ─────────────────────────────────────────────────────────────
// Changes:
//   1. canMessage() — sirf following users ko message allow
//   2. openChat()   — check ke baad hi navigate kare
//   3. loadCurrentUser() — agar userId nahi to login redirect
// ─────────────────────────────────────────────────────────────

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ViewWillEnter, ToastController } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonButtons, IonMenuButton, IonSearchbar, IonChip,
  IonIcon, IonLabel, IonAvatar, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline, searchOutline,
  homeOutline, compassOutline, chatbubbleOutline,
  settingsOutline, personOutline, alertCircleOutline, closeOutline,
  playOutline, sparklesOutline, addOutline, personCircleOutline,
  peopleOutline, checkmarkCircle, personAddOutline, lockClosedOutline
} from 'ionicons/icons';

const VN_USERS_KEY = 'vn_users';

export interface AppUser {
  id      : string;
  username: string;
  name    : string;
  email   : string;
  avatar? : string;
  bio?    : string;
}

@Component({
  selector   : 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls  : ['./explore.page.scss'],
  standalone : true,
  imports    : [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonButtons, IonMenuButton, IonSearchbar, IonChip,
    IonIcon, IonLabel, IonAvatar, IonSpinner
  ]
})
export class ExplorePage implements OnInit, ViewWillEnter {
  activeTab     : string  = 'explore';
  searchQuery   : string  = '';
  isSearchActive: boolean = false;
  isLoading     : boolean = false;
  allUsers      : AppUser[] = [];
  searchResults : AppUser[] = [];

  private currentUserId: string = '';

  constructor(
    private router           : Router,
    private http             : HttpClient,
    private toastController  : ToastController
  ) {
    addIcons({
      notificationsOutline, searchOutline,
      homeOutline, compassOutline, chatbubbleOutline,
      settingsOutline, personOutline, alertCircleOutline, closeOutline,
      playOutline, sparklesOutline, addOutline, personCircleOutline,
      peopleOutline, checkmarkCircle, personAddOutline, lockClosedOutline
    });
  }

  ngOnInit()         { this.loadCurrentUser(); this.loadUsers(); }
  ionViewWillEnter() { this.activeTab = 'explore'; this.loadCurrentUser(); this.loadUsers(); }

  // ─── ✅ FIX 1: Agar userId nahi to login pe bhejo ───
  private loadCurrentUser() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUserId = userId;
  }

  private loadUsers() {
    try {
      const raw        = localStorage.getItem(VN_USERS_KEY);
      const all: AppUser[] = raw ? JSON.parse(raw) : [];
      // Apne aap ko list se nikalo
      this.allUsers = all.filter(u => String(u.id) !== String(this.currentUserId));
    } catch {
      this.allUsers = [];
    }
  }

  onSearch() {
    const q = this.searchQuery.trim().toLowerCase();
    this.isSearchActive = true;

    if (!q) {
      this.searchResults  = [];
      this.isSearchActive = false;
      return;
    }

    this.searchResults = this.allUsers.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q)     ||
      u.email?.toLowerCase().includes(q)
    );
  }

  onClear() {
    this.searchQuery    = '';
    this.isSearchActive = false;
    this.searchResults  = [];
    this.isLoading      = false;
  }

  onUserClick(user: AppUser) {
    this.router.navigate(['/userprofile'], {
      state: {
        userId  : user.id,
        username: user.name || user.username,
        email   : user.email,
        avatar  : user.avatar || '',
        bio     : user.bio || ''
      }
    });
  }

  navigateTo(tab: string, route: string) {
    this.activeTab = tab;
    this.router.navigate([route]);
  }

  getInitials(user: AppUser): string {
    const name = user.name || user.username || '?';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  // ─── ✅ FIX 2: Sirf following users ko message allow ───
  canMessage(user: AppUser): boolean {
    return this.isFollowing(user.id);
  }

  openChat(user: AppUser, event: Event) {
    event.stopPropagation();

    // ✅ Check: sirf following users ko message
    if (!this.canMessage(user)) {
      this.showToast(
        `Pehle ${user.name || user.username} ko follow karein, phir message karein`,
        'warning'
      );
      return;
    }

    const myId    = String(this.currentUserId);
    const otherId = String(user.id);
    const roomId  = [myId, otherId].sort().join('-');

    localStorage.setItem(`conv_other_${roomId}`, otherId);

    this.router.navigate(['/chat-detail'], {
      queryParams: {
        id  : roomId,
        name: user.name || user.username,
        img : user.avatar || ''
      }
    });
  }

  // ─── Follow / Unfollow ───
  followUser(user: AppUser, event: Event) {
    event.stopPropagation();

    if (String(user.id) === String(this.currentUserId)) {
      this.showToast('Aap apne aap ko follow nahi kar sakte', 'warning');
      return;
    }

    const currentUserName = localStorage.getItem('username') || 'Someone';
    const key             = `vn_following_${this.currentUserId}`;
    const raw             = localStorage.getItem(key);
    let followingList: string[] = raw ? JSON.parse(raw) : [];

    const alreadyFollowing = followingList.includes(String(user.id));

    if (alreadyFollowing) {
      followingList = followingList.filter(id => id !== String(user.id));
      this.showToast(`Unfollowed ${user.name || user.username}`, 'dark');
    } else {
      followingList.push(String(user.id));
      this.sendFollowNotification(this.currentUserId, currentUserName, String(user.id));
      this.showToast(`Followed ${user.name || user.username} — ab message kar sakte hain!`, 'success');
    }

    localStorage.setItem(key, JSON.stringify(followingList));
  }

  isFollowing(userId: string): boolean {
    const key             = `vn_following_${this.currentUserId}`;
    const raw             = localStorage.getItem(key);
    const followingList: string[] = raw ? JSON.parse(raw) : [];
    return followingList.includes(String(userId));
  }

  private sendFollowNotification(fromId: string, fromName: string, toUserId: string) {
    const notifKey        = `vn_notifications_${toUserId}`;
    const raw             = localStorage.getItem(notifKey);
    const existing: any[] = raw ? JSON.parse(raw) : [];

    existing.unshift({
      id        : Date.now(),
      from_id   : fromId,
      from_name : fromName,
      from_img  : '',
      type      : 'follow',
      is_read   : false,
      created_at: new Date().toISOString()
    });

    localStorage.setItem(notifKey, JSON.stringify(existing));
  }

  followSingleUser(user: AppUser, event: Event) { this.followUser(user, event); }

  followMultipleUsers(users: AppUser[]) {
    const currentUserName = localStorage.getItem('username') || 'Someone';
    const key             = `vn_following_${this.currentUserId}`;
    const raw             = localStorage.getItem(key);
    let followingList: string[] = raw ? JSON.parse(raw) : [];
    let followedCount = 0;

    users.forEach(user => {
      if (String(user.id) === String(this.currentUserId)) return;
      if (followingList.includes(String(user.id))) return;
      followingList.push(String(user.id));
      this.sendFollowNotification(this.currentUserId, currentUserName, String(user.id));
      followedCount++;
    });

    localStorage.setItem(key, JSON.stringify(followingList));

    if (followedCount > 0) {
      this.showToast(`${followedCount} user${followedCount > 1 ? 's' : ''} follow ho gaye!`, 'success');
    } else {
      this.showToast('No new users to follow', 'medium');
    }
  }

  followAllSearchResults() {
    if (!this.searchResults || this.searchResults.length === 0) {
      this.showToast('No search results to follow', 'warning');
      return;
    }
    this.followMultipleUsers(this.searchResults);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message, duration: 2500, position: 'bottom', color
    });
    await toast.present();
  }
}