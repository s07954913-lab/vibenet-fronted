// src/app/saved.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UnifiedPost {
  id: string;
  mediaUrl?: string;
  caption: string;
  hashtags: string[];
  location?: string;
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
  timeAgo: string;
  createdAt: string;
  type: 'photo' | 'video';
  username: string;
  userInitial: string;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class Saved {
  private postsSubject = new BehaviorSubject<UnifiedPost[]>([]);
  posts$: Observable<UnifiedPost[]> = this.postsSubject.asObservable();

  private readonly DB_NAME = 'vibenet_db';
  private readonly STORE_NAME = 'unified_posts';
  private readonly MEDIA_STORE = 'media_store';

  constructor() {
    this.loadFromIndexedDB();
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 3);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.MEDIA_STORE)) {
          db.createObjectStore(this.MEDIA_STORE);
        }
      };
      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  async saveMedia(key: string, file: File): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.MEDIA_STORE, 'readwrite');
      const store = tx.objectStore(this.MEDIA_STORE);
      const request = store.put(file, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadMedia(key: string): Promise<string | null> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(this.MEDIA_STORE, 'readonly');
      const store = tx.objectStore(this.MEDIA_STORE);
      const request = store.get(key);
      request.onsuccess = (event: any) => {
        const result = event.target.result;
        if (result instanceof File || result instanceof Blob) {
          resolve(URL.createObjectURL(result));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  async deleteMedia(key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.MEDIA_STORE, 'readwrite');
      const store = tx.objectStore(this.MEDIA_STORE);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addPost(post: UnifiedPost): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put(post);
      request.onsuccess = () => {
        this.loadFromIndexedDB();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updatePost(postId: string, updates: Partial<UnifiedPost>): Promise<void> {
    const currentPosts = this.postsSubject.value;
    const postIndex = currentPosts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      const updatedPost = { ...currentPosts[postIndex], ...updates };
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      await store.put(updatedPost);
      await this.loadFromIndexedDB();
    }
  }

  async deletePost(postId: string): Promise<void> {
    await this.deleteMedia('post_' + postId);
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.delete(postId);
      request.onsuccess = () => {
        this.loadFromIndexedDB();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async loadFromIndexedDB(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.getAll();
      request.onsuccess = async () => {
        const posts = request.result;
        for (const post of posts) {
          const mediaUrl = await this.loadMedia('post_' + post.id);
          if (mediaUrl) {
            post.mediaUrl = mediaUrl;
          }
        }
        posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.postsSubject.next(posts);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  getPosts(): UnifiedPost[] {
    return this.postsSubject.value;
  }

  getSavedPosts(): UnifiedPost[] {
    return this.postsSubject.value.filter(post => post.saved === true);
  }

  getUserPosts(userId: string): UnifiedPost[] {
    return this.postsSubject.value.filter(post => post.userId === userId);
  }

  async toggleLike(postId: string): Promise<void> {
    const post = this.postsSubject.value.find(p => p.id === postId);
    if (post) {
      const newLiked = !post.liked;
      const newLikes = post.likes + (newLiked ? 1 : -1);
      await this.updatePost(postId, { liked: newLiked, likes: newLikes });
    }
  }

  async toggleSave(postId: string): Promise<void> {
    const post = this.postsSubject.value.find(p => p.id === postId);
    if (post) {
      await this.updatePost(postId, { saved: !post.saved });
    }
  }
}