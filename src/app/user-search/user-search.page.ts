import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';

import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonSearchbar, IonList, IonItem, IonAvatar,
  IonLabel, IonButton, IonIcon, IonButtons,
  IonBackButton, IonBadge, IonSkeletonText,
  IonNote
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  searchOutline, chatbubbleOutline, personAddOutline,
  checkmarkOutline, personOutline, closeOutline
} from 'ionicons/icons';

interface UserResult {
  id:         number;
  username:   string;
  name:       string;
  email:      string;
  avatar:     string;
  bio:        string;
  isFollowing?: boolean;
  isLoading?:   boolean;
}

@Component({
  selector:    'app-user-search',
  templateUrl: './user-search.page.html',
  styleUrls:   ['./user-search.page.scss'],
  standalone:  true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonSearchbar, IonList, IonItem, IonAvatar,
    IonLabel, IonButton, IonIcon, IonButtons,
    IonBackButton, IonBadge, IonSkeletonText, IonNote
  ]
})
export class UserSearchPage implements OnInit, OnDestroy {

  searchQuery   = '';
  users:         UserResult[] = [];
  isSearching    = false;
  hasSearched    = false;
  currentUserId  = '';
  currentUsername = '';

  private searchTimer: any;
  private baseUrl     = '';

  constructor(
    private http:   HttpClient,
    private router: Router
  ) {
    addIcons({
      searchOutline, chatbubbleOutline, personAddOutline,
      checkmarkOutline, personOutline, closeOutline
    });
  }

  ngOnInit() {
    this.baseUrl        = this.getBaseUrl();
    this.currentUserId  = localStorage.getItem('userId')   || '';
    this.currentUsername = localStorage.getItem('username') || '';
  }

  ngOnDestroy() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  private getBaseUrl(): string {
    return Capacitor.isNativePlatform()
      ? 'http://192.168.0.105:8000'
      : 'http://127.0.0.1:8000';
  }

  // ─── Search with debounce ───
  onSearchInput() {
    if (this.searchTimer) clearTimeout(this.searchTimer);

    const q = this.searchQuery.trim();

    if (!q) {
      this.users      = [];
      this.hasSearched = false;
      return;
    }

    this.isSearching = true;
    this.searchTimer = setTimeout(() => this.doSearch(q), 400);
  }

  private doSearch(query: string) {
    this.http.get<UserResult[]>(
      `${this.baseUrl}/api/users/search/?q=${encodeURIComponent(query)}`
    ).subscribe({
      next: (data) => {
        // Apne aap ko list se hatao
        this.users = data
          .filter(u => String(u.id) !== this.currentUserId)
          .map(u => ({ ...u, isFollowing: false, isLoading: false }));

        this.isSearching = false;
        this.hasSearched = true;
      },
      error: () => {
        // Demo users agar backend na mile
        this.users = this.getDemoUsers(query);
        this.isSearching = false;
        this.hasSearched = true;
      }
    });
  }

  // ─── Follow / Unfollow ───
  toggleFollow(user: UserResult) {
    user.isLoading = true;

    const endpoint = user.isFollowing
      ? `${this.baseUrl}/api/follow/unfollow/`
      : `${this.baseUrl}/api/follow/follow/`;

    this.http.post(endpoint, {
      follower_id: this.currentUserId,
      following_id: user.id
    }).subscribe({
      next: () => {
        user.isFollowing = !user.isFollowing;
        user.isLoading   = false;
      },
      error: () => {
        // Locally toggle even if backend fails
        user.isFollowing = !user.isFollowing;
        user.isLoading   = false;
      }
    });
  }

  // ─── Message: conversation banao ya dhundho ───
  openChat(user: UserResult) {
    this.http.post<any>(`${this.baseUrl}/api/conversations/get-or-create/`, {
      user1_id: this.currentUserId,
      user2_id: user.id
    }).subscribe({
      next: (conv) => {
        this.router.navigate(['/chat-detail'], {
          queryParams: {
            id:   conv.id,
            name: user.name || user.username,
            img:  user.avatar || ''
          }
        });
      },
      error: () => {
        // Demo mode: direct navigate without convId
        this.router.navigate(['/chat-detail'], {
          queryParams: {
            id:   0,
            name: user.name || user.username,
            img:  user.avatar || ''
          }
        });
      }
    });
  }

  // ─── Avatar initials ───
  getInitials(user: UserResult): string {
    const n = user.name || user.username || '?';
    return n.charAt(0).toUpperCase();
  }

  clearSearch() {
    this.searchQuery = '';
    this.users       = [];
    this.hasSearched = false;
  }

  // ─── Demo fallback ───
  private getDemoUsers(query: string): UserResult[] {
    const demo: UserResult[] = [
      { id: 2, username: 'bb',      name: 'BB User',    email: 'bb@gmail.com',    avatar: '', bio: 'Hello!',         isFollowing: false, isLoading: false },
      { id: 3, username: 'ali123',  name: 'Ali Khan',   email: 'ali@gmail.com',   avatar: '', bio: 'Hey there 👋',   isFollowing: false, isLoading: false },
      { id: 4, username: 'sara99',  name: 'Sara Ahmed', email: 'sara@gmail.com',  avatar: '', bio: 'Photographer 📷', isFollowing: false, isLoading: false },
    ];
    return demo.filter(u =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}