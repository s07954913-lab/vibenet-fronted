import { Injectable } from '@angular/core';
import {
  getFirestore, collection, addDoc, getDocs,
  serverTimestamp, doc, updateDoc, increment,
  query, orderBy, where
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Preferences } from '@capacitor/preferences';

export interface Post {
  id?: string;
  ownerId: string;
  ownerName: string;
  ownerPhoto: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  commentsCount: number;
  shares: number;
  createdAt: any;
}

@Injectable({ providedIn: 'root' })
export class PostUploadService {
  private db   = getFirestore();
  private auth = getAuth();

  private cloudName    = 'dgg8qfnrh';
  private uploadPreset = 'vibenet_videos';

  // ✅ Current user ka wait karo
  private waitForUser(): Promise<any> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  async uploadPost(
    videoFile: File,
    caption: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {

    const currentUser = await this.waitForUser();

    let userId    = currentUser?.uid;
    let userName  = currentUser?.displayName || 'User';
    let userPhoto = currentUser?.photoURL    || '';

    // ✅ Firebase user nahi mila toh Preferences se lo (mobile fallback)
    if (!userId) {
      const { value: uid }   = await Preferences.get({ key: 'userId' });
      const { value: uname } = await Preferences.get({ key: 'username' });
      const { value: photo } = await Preferences.get({ key: 'photoUrl' });
      userId    = uid;
      userName  = uname  || 'User';
      userPhoto = photo  || '';
    }

    if (!userId) throw new Error('User not logged in');

    const videoUrl = await this.uploadToCloudinary(videoFile, onProgress);

    const postRef = await addDoc(collection(this.db, 'posts'), {
      ownerId:       userId,
      ownerName:     userName,
      ownerPhoto:    userPhoto,
      videoUrl,
      thumbnailUrl:  '',
      caption,
      likes:         0,
      commentsCount: 0,
      shares:        0,
      createdAt:     serverTimestamp()
    });

    return postRef.id;
  }

  // ✅ Firestore se current user ki posts fetch karo
  async getUserPosts(userId: string): Promise<Post[]> {
    try {
      const q = query(
        collection(this.db, 'posts'),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
    } catch (err) {
      console.error('getUserPosts error:', err);
      return [];
    }
  }

  private uploadToCloudinary(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('resource_type', 'video');

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('Upload failed: ' + xhr.statusText));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));

      xhr.open('POST',
        `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`
      );
      xhr.send(formData);
    });
  }

  async incrementLike(postId: string) {
    try {
      await updateDoc(doc(this.db, 'posts', postId), { likes: increment(1) });
    } catch {}
  }

  async decrementLike(postId: string) {
    try {
      await updateDoc(doc(this.db, 'posts', postId), { likes: increment(-1) });
    } catch {}
  }

  async incrementComment(postId: string) {
    try {
      await updateDoc(doc(this.db, 'posts', postId), { commentsCount: increment(1) });
    } catch {}
  }

  async incrementShare(postId: string) {
    try {
      await updateDoc(doc(this.db, 'posts', postId), { shares: increment(1) });
    } catch {}
  }
}