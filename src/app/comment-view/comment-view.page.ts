// comment-view.page.ts — COMPLETE WEBSOCKET-ENABLED VERSION
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonButtons, IonButton, IonIcon, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, sendOutline, chatbubbleEllipsesOutline,
  heartOutline, chatbubbleOutline, playOutline, happyOutline,
  ellipsisHorizontal, ellipsisVerticalOutline
} from 'ionicons/icons';
import { WebSocketService } from '../services/websocket';
import { Subscription } from 'rxjs';

interface Comment {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  text: string;
  timeAgo: string;
  createdAt: string;
  liked: boolean;
  likeCount: number;
  reactions: { emoji: string; count: number; active: boolean }[];
  replies: Comment[];
  showReply: boolean;
  replyText: string;
}

@Component({
  selector: 'app-comment-view',
  templateUrl: './comment-view.page.html',
  styleUrls: ['./comment-view.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
    IonButtons, IonButton, IonIcon
  ]
})
export class CommentViewPage implements OnInit, OnDestroy {

  post: any = null;
  comments: Comment[] = [];
  newCommentText = '';
  showEmoji = false;

  // ✅ Logged-in user info
  myName    = '';
  myInitial = '';
  myUserId  = '';

  emojiList = ['😍','❤️','😂','🔥','👏','😮','🎉','💯','😢','🙌'];

  private avatarColors = [
    { bg: '#FFF0EB', color: '#D94000' },
    { bg: '#E8F0FF', color: '#3880ff' },
    { bg: '#E8F4E8', color: '#2dd36f' },
    { bg: '#F3E8FF', color: '#7a4ff5' },
    { bg: '#FFF3CD', color: '#856404' },
  ];

  private wsSub: Subscription = new Subscription();

  constructor(
    private location: Location,
    private actionSheetCtrl: ActionSheetController,
    private wsService: WebSocketService
  ) {
    addIcons({
      arrowBackOutline, sendOutline, chatbubbleEllipsesOutline,
      heartOutline, chatbubbleOutline, playOutline, happyOutline,
      ellipsisHorizontal, ellipsisVerticalOutline
    });
  }

  ngOnInit() {
    // ✅ Logged-in user info
    this.myUserId  = localStorage.getItem('userId') || 'guest';
    const storedName  = localStorage.getItem('username') || localStorage.getItem('email') || 'User';
    this.myName       = storedName;
    this.myInitial    = storedName.charAt(0).toUpperCase();

    // Post load
    const raw = localStorage.getItem('activeCommentPost');
    if (raw) this.post = JSON.parse(raw);

    // ✅ Comments load — har baar fresh localStorage se
    if (this.post) {
      const saved = localStorage.getItem('comments_' + this.post.id);
      this.comments = saved ? JSON.parse(saved) : [];

      // ✅ WebSocket connect — live comments
      this.wsService.connectComments(this.post.id);

      this.wsSub.add(
        this.wsService.newComment$.subscribe((data: any) => {
          if (data) {
            const c = this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)];
            this.comments.push({
              id         : Date.now().toString(),
              name       : data.user_name,
              initials   : data.user_name?.charAt(0).toUpperCase() || 'U',
              avatarBg   : c.bg,
              avatarColor: c.color,
              text       : data.text,
              timeAgo    : 'Just now',
              createdAt  : new Date().toISOString(),
              liked      : false,
              likeCount  : 0,
              reactions  : [],
              replies    : [],
              showReply  : false,
              replyText  : ''
            });
            localStorage.setItem('comments_' + this.post.id, JSON.stringify(this.comments));
            this.updatePostCommentCount();
          }
        })
      );
    }
  }

  ngOnDestroy() {
    if (this.post) {
      this.wsService.disconnect('comments_' + this.post.id);
    }
    this.wsSub.unsubscribe();
  }

  goBack() {
    // ✅ Wapas jaane se pehle comment count update karo
    this.updatePostCommentCount();
    this.location.back();
  }

  getTimeAgo(createdAt: string): string {
    if (!createdAt) return 'Just now';
    const diff  = Date.now() - new Date(createdAt).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'Just now';
    if (mins  < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days}d ago`;
  }

  // ✅ Comments save + post count update
  private saveComments() {
    if (this.post) {
      localStorage.setItem('comments_' + this.post.id, JSON.stringify(this.comments));
      this.updatePostCommentCount();
    }
  }

  // ✅ Post ka comment count update — SARI USERS ki posts mein
  private updatePostCommentCount() {
    if (!this.post) return;
    const count = this.comments.length;

    // Sab localStorage keys scan karo
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vn_posts_')) {
        try {
          const posts = JSON.parse(localStorage.getItem(key) || '[]');
          const idx   = posts.findIndex((p: any) => p.id === this.post.id);
          if (idx !== -1) {
            posts[idx].comments = count;
            localStorage.setItem(key, JSON.stringify(posts));
          }
        } catch { }
      }
    }
  }

  // ✅ Comment submit — ab WebSocket se bhejta hai
  submitComment() {
    const text = this.newCommentText.trim();
    if (!text) return;

    this.wsService.sendComment(this.post.id, text, this.myName, this.myUserId);

    this.newCommentText = '';
    this.showEmoji      = false;
  }

  likeComment(c: Comment) {
    c.liked      = !c.liked;
    c.likeCount += c.liked ? 1 : -1;
    this.saveComments();
  }

  toggleReaction(c: Comment, r: any) {
    r.active  = !r.active;
    r.count  += r.active ? 1 : -1;
    if (r.count <= 0) c.reactions = c.reactions.filter((x: any) => x !== r);
    this.saveComments();
  }

  toggleReply(c: Comment) {
    c.showReply = !c.showReply;
  }

  // ✅ Reply submit
  submitReply(c: Comment) {
    const text = c.replyText?.trim();
    if (!text) return;

    const col = this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)];
    const now = new Date().toISOString();

    c.replies.push({
      id         : Date.now().toString(),
      name       : this.myName,
      initials   : this.myInitial,
      avatarBg   : col.bg,
      avatarColor: col.color,
      text,
      timeAgo    : 'Just now',
      createdAt  : now,
      liked      : false,
      likeCount  : 0,
      reactions  : [],
      replies    : [],
      showReply  : false,
      replyText  : ''
    });

    c.replyText  = '';
    c.showReply  = false;
    this.saveComments();
  }

  async openOptions(c: Comment) {
    const isOwn = c.name === this.myName;
    const sheet = await this.actionSheetCtrl.create({
      header: 'Comment Options',
      buttons: [
        ...(isOwn ? [
          {
            text: 'Edit',
            icon: 'pencil-outline',
            handler: () => {
              const newText = prompt('Comment edit karein:', c.text);
              if (newText?.trim()) {
                c.text = newText.trim() + ' (edited)';
                this.saveComments();
              }
            }
          },
          {
            text   : 'Delete',
            icon   : 'trash-outline',
            role   : 'destructive',
            handler: () => {
              this.comments = this.comments.filter(x => x.id !== c.id);
              this.saveComments();
            }
          }
        ] : []),
        {
          text   : 'React ❤️',
          icon   : 'heart-outline',
          handler: () => {
            const ex = c.reactions.find(r => r.emoji === '❤️');
            if (ex) { ex.count++; ex.active = true; }
            else    { c.reactions.push({ emoji: '❤️', count: 1, active: true }); }
            this.saveComments();
          }
        },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await sheet.present();
  }

  toggleEmoji() {
    this.showEmoji = !this.showEmoji;
  }

  addEmoji(e: string) {
    this.newCommentText += e;
  }

  autoResize(event: any) {
    const el        = event.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 80) + 'px';
  }
}