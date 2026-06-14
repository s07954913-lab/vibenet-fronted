import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {

  private sockets: { [key: string]: WebSocket } = {};
  private BASE_URL = 'wss://vibenet-backend-production.up.railway.app';

  // Live streams
  public newComment$      = new BehaviorSubject<any>(null);
  public newNotification$ = new BehaviorSubject<any>(null);
  public newMessage$      = new BehaviorSubject<any>(null);
  public isConnected$     = new BehaviorSubject<boolean>(false);

  // ── Chat connect ──────────────────────────────────────
  connectChat(roomName: string) {
    const url = `${this.BASE_URL}/ws/chat/${roomName}/`;
    const ws  = new WebSocket(url);

    ws.onopen = () => {
      console.log('✅ Chat connected');
      this.isConnected$.next(true);
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      this.newMessage$.next(data);
    };

    ws.onerror = (e) => console.error('❌ Chat error', e);

    ws.onclose = () => {
      this.isConnected$.next(false);
      console.log('🔴 Chat disconnected — 3s mein reconnect...');
      setTimeout(() => this.connectChat(roomName), 3000);
    };

    this.sockets['chat'] = ws;
  }

  // ── Message bhejo ─────────────────────────────────────
  sendChatMessage(message: string, senderId: string, userName: string) {
    const ws = this.sockets['chat'];
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message, sender: senderId, sender_name: userName }));
    }
  }

  // ── Comments connect ──────────────────────────────────
  connectComments(postId: string) {
    const url = `${this.BASE_URL}/ws/comments/${postId}/`;
    const ws  = new WebSocket(url);

    ws.onopen    = () => console.log('✅ Comments connected for post', postId);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      this.newComment$.next(data);
    };
    ws.onclose = () => {
      setTimeout(() => this.connectComments(postId), 3000);
    };

    this.sockets['comments_' + postId] = ws;
  }

  // ── Comment bhejo ─────────────────────────────────────
  sendComment(postId: string, text: string, userName: string, userId: string) {
    const ws = this.sockets['comments_' + postId];
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        text,
        user_name: userName,
        user_id:   userId,
      }));
    }
  }

  // ── Notifications connect ─────────────────────────────
  connectNotifications(userId: string) {
    const url = `${this.BASE_URL}/ws/notifications/${userId}/`;
    const ws  = new WebSocket(url);

    ws.onopen    = () => console.log('✅ Notifications connected for user', userId);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log('🔔 Live notification:', data);
      this.newNotification$.next(data);
    };
    ws.onclose = () => {
      setTimeout(() => this.connectNotifications(userId), 3000);
    };

    this.sockets['notifications'] = ws;
  }

  // ── Disconnect ────────────────────────────────────────
  disconnect(type: string) {
    this.sockets[type]?.close();
  }

  disconnectAll() {
    Object.values(this.sockets).forEach(ws => ws?.close());
  }
}