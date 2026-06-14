import { Injectable } from '@angular/core';
import {
  getFirestore, doc, getDoc, collection,
  getDocs, addDoc, serverTimestamp, setDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import OneSignal from 'onesignal-cordova-plugin';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private appId  = 'e90ae75b-a282-477d-bf79-86fcd45767ec';
  private apiKey = 'os_v2_app_5efoow5cqjdx3p3zq36niv3h5smqnxlrx5uehk43pa3vynxblg5ltuleuvuwe7igm452cqjryrbwwt3cnknqxlc4zvdlv3pszz2dsfa';
  private db   = getFirestore();
  private auth = getAuth();

  // ─── OneSignal Initialize ───────────────────────────────────────
  async initOneSignal() {
    OneSignal.initialize(this.appId);

    OneSignal.Notifications.requestPermission(true).then(async (accepted) => {
      console.log('Notification permission accepted:', accepted);
    });

    const pushSubscription = OneSignal.User.pushSubscription;
    const playerId = pushSubscription.id;
    const userId   = this.auth.currentUser?.uid;

    if (userId && playerId) {
      await setDoc(
        doc(this.db, 'users', userId, 'oneSignalTokens', playerId),
        { playerId, createdAt: serverTimestamp() }
      );
    }
  }

  // ─── Private: Send via OneSignal REST API ───────────────────────
  private async sendNotification(
    playerIds: string[],
    title: string,
    body: string,
    data: any = {}
  ) {
    if (!playerIds.length) return;
    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${this.apiKey}`
        },
        body: JSON.stringify({
          app_id: this.appId,
          include_player_ids: playerIds,
          headings: { en: title },
          contents: { en: body },
          data,
          small_icon: 'ic_stat_onesignal_default',
          large_icon: data.senderPhoto || ''
        })
      });
      const result = await response.json();
      console.log('✅ Notification sent:', result);
    } catch (error) {
      console.error('❌ Notification error:', error);
    }
  }

  // ─── Private: Get player IDs from Firestore ─────────────────────
  private async getPlayerIds(userId: string): Promise<string[]> {
    const snap = await getDocs(
      collection(this.db, 'users', userId, 'oneSignalTokens')
    );
    return snap.docs.map(d => d.data()['playerId']).filter(Boolean);
  }

  // ─── Private: Save notification record to Firestore ─────────────
  private async saveNotification(userId: string, notification: any) {
    await addDoc(
      collection(this.db, 'users', userId, 'notifications'),
      { ...notification, isRead: false, createdAt: serverTimestamp() }
    );
  }

  // ─── 1. LIKE NOTIFICATION ───────────────────────────────────────
  async sendLikeNotification(postOwnerId: string, postId: string) {
    const currentUser = this.auth.currentUser;
    if (!currentUser || currentUser.uid === postOwnerId) return;

    const userDoc  = await getDoc(doc(this.db, 'users', currentUser.uid));
    const username = userDoc.data()?.['username'] || 'Someone';
    const photoURL = userDoc.data()?.['photoURL'] || '';

    const playerIds = await this.getPlayerIds(postOwnerId);
    await this.sendNotification(
      playerIds,
      'New Like ❤️',
      `${username} liked your video`,
      { type: 'like', postId, senderId: currentUser.uid, senderPhoto: photoURL }
    );

    await this.saveNotification(postOwnerId, {
      type: 'like',
      title: 'New Like ❤️',
      body: `${username} liked your video`,
      senderId: currentUser.uid,
      senderName: username,
      senderPhoto: photoURL,
      postId
    });
  }

  // ─── 2. COMMENT NOTIFICATION ────────────────────────────────────
  async sendCommentNotification(
    postOwnerId: string,
    postId: string,
    commentText: string
  ) {
    const currentUser = this.auth.currentUser;
    if (!currentUser || currentUser.uid === postOwnerId) return;

    const userDoc  = await getDoc(doc(this.db, 'users', currentUser.uid));
    const username = userDoc.data()?.['username'] || 'Someone';
    const photoURL = userDoc.data()?.['photoURL'] || '';

    const short = commentText.length > 50
      ? commentText.substring(0, 50) + '...'
      : commentText;

    const playerIds = await this.getPlayerIds(postOwnerId);
    await this.sendNotification(
      playerIds,
      'New Comment 💬',
      `${username}: ${short}`,
      { type: 'comment', postId, senderId: currentUser.uid, senderPhoto: photoURL }
    );

    await this.saveNotification(postOwnerId, {
      type: 'comment',
      title: 'New Comment 💬',
      body: `${username}: ${short}`,
      senderId: currentUser.uid,
      senderName: username,
      senderPhoto: photoURL,
      postId
    });
  }

  // ─── 3. FOLLOW NOTIFICATION ─────────────────────────────────────
  async sendFollowNotification(targetUserId: string) {
    const currentUser = this.auth.currentUser;
    if (!currentUser || currentUser.uid === targetUserId) return;

    const userDoc  = await getDoc(doc(this.db, 'users', currentUser.uid));
    const username = userDoc.data()?.['username'] || 'Someone';
    const photoURL = userDoc.data()?.['photoURL'] || '';

    const playerIds = await this.getPlayerIds(targetUserId);
    await this.sendNotification(
      playerIds,
      'New Follower 🔔',
      `${username} started following you`,
      { type: 'follow', senderId: currentUser.uid, senderPhoto: photoURL }
    );

    await this.saveNotification(targetUserId, {
      type: 'follow',
      title: 'New Follower 🔔',
      body: `${username} started following you`,
      senderId: currentUser.uid,
      senderName: username,
      senderPhoto: photoURL
    });
  }

  // ─── 4. MESSAGE NOTIFICATION ────────────────────────────────────
  async sendMessageNotification(
    recipientId: string,
    messageText: string,
    chatId: string
  ) {
    const currentUser = this.auth.currentUser;
    if (!currentUser || currentUser.uid === recipientId) return;

    const userDoc  = await getDoc(doc(this.db, 'users', currentUser.uid));
    const username = userDoc.data()?.['username'] || 'Someone';
    const photoURL = userDoc.data()?.['photoURL'] || '';

    const short = messageText.length > 50
      ? messageText.substring(0, 50) + '...'
      : messageText;

    const playerIds = await this.getPlayerIds(recipientId);
    await this.sendNotification(
      playerIds,
      username,
      short,
      { type: 'message', chatId, senderId: currentUser.uid, senderPhoto: photoURL }
    );
  }

  // ─── 5. SHARE NOTIFICATION ──────────────────────────────────────
  async sendShareNotification(postOwnerId: string, postId: string) {
    const currentUser = this.auth.currentUser;
    if (!currentUser || currentUser.uid === postOwnerId) return;

    const userDoc  = await getDoc(doc(this.db, 'users', currentUser.uid));
    const username = userDoc.data()?.['username'] || 'Someone';
    const photoURL = userDoc.data()?.['photoURL'] || '';

    const playerIds = await this.getPlayerIds(postOwnerId);
    await this.sendNotification(
      playerIds,
      'Video Shared 🔁',
      `${username} shared your video`,
      { type: 'share', postId, senderId: currentUser.uid, senderPhoto: photoURL }
    );

    await this.saveNotification(postOwnerId, {
      type: 'share',
      title: 'Video Shared 🔁',
      body: `${username} shared your video`,
      senderId: currentUser.uid,
      senderName: username,
      senderPhoto: photoURL,
      postId
    });
  }
}