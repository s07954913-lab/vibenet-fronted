import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonBackButton, IonButton, IonChip,
  IonIcon, IonList, IonItem, IonAvatar, IonLabel,
  IonFooter, IonRefresher, IonRefresherContent, IonSkeletonText,
  IonItemSliding, IonItemOptions, IonItemOption, IonNote
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline, trendingUpOutline, sparklesOutline,
  homeOutline, searchOutline, notifications,
  notificationsOutline, personOutline,
  chatbubbleOutline, heart, heartOutline, trashOutline,
  personAddOutline
} from 'ionicons/icons';

import { Globall } from '../globall';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-notification',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButtons, IonBackButton, IonButton, IonChip,
    IonIcon, IonList, IonItem, IonAvatar, IonLabel,
    IonFooter, IonRefresher, IonRefresherContent,
    IonSkeletonText, IonItemSliding, IonItemOptions, IonItemOption, IonNote
  ]
})
export class NotificationPage implements OnInit {

  // ✅ Backend URL — platform ke hisaab se
  private get base(): string {
    return Capacitor.isNativePlatform()
      ? 'http://192.168.0.105:8000/api'
      : 'http://127.0.0.1:8000/api';
  }

  // ✅ User ID — localStorage ya Preferences se
  private userId: string | number = 1;

  userName  = '';
  userImage = '';
  ui: any;
  currentLang    = 'English (US)';
  selectedFilter = 'All';
  showAlert      = true;
  isLoading      = true;

  notificationsList: any[] = [];

  // ✅ Fallback notifications jab backend nahi mile
  private readonly FALLBACK_NOTIFICATIONS = [
    { id: 1, name: 'Alex Rivers',    img: 'assets/download (1).jpg', type: 'Follow',   is_read: false, time: '2h ago' },
    { id: 2, name: 'Marcus Chen',    img: 'assets/download (2).jpg', type: 'Likes',    is_read: false, time: '4h ago' },
    { id: 3, name: 'Sara Velasquez', img: 'assets/download (1).jpg', type: 'Comments', is_read: true,  time: '6h ago' },
  ];

  translations: any = {
    'English (US)': {
      title: 'Notifications', all: 'All', follow: 'Follow',
      likes: 'Likes', comments: 'Comments',
      mark_read: 'Mark all as read', reply: 'Reply', delete: 'Delete',
      ai_alert_title: 'AI TRENDING ALERT',
      ai_alert_msg: 'Your recent post about "AI Ethics" is going viral.',
      ai_alert_desc: 'Engagement is 85% higher than your average.',
      view_analytics: 'View Analytics', dismiss: 'Dismiss',
      action_follow: 'started following you',
      action_like: 'liked your photo',
      action_comment: 'commented on your post',
      no_notifications: 'No notifications yet'
    },
    'Urdu': {
      title: 'اطلاعات', all: 'سب', follow: 'فالو',
      likes: 'لائکس', comments: 'تبصرے',
      mark_read: 'سب کو پڑھا ہوا کریں', reply: 'جواب دیں', delete: 'ڈیلیٹ',
      ai_alert_title: 'اے آئی ٹرینڈنگ الرٹ',
      ai_alert_msg: 'آپ کی پوسٹ وائرل ہو رہی ہے۔',
      ai_alert_desc: 'انگیجمنٹ 85٪ زیادہ ہے۔',
      view_analytics: 'تجزیات دیکھیں', dismiss: 'خارج کریں',
      action_follow: 'نے آپ کو فالو کیا',
      action_like: 'نے لائک کیا',
      action_comment: 'نے تبصرہ کیا',
      no_notifications: 'ابھی کوئی اطلاع نہیں'
    },
    'Arabic': {
      title: 'الإشعارات', all: 'الكل', follow: 'متابعة',
      likes: 'إعجابات', comments: 'تعليقات',
      mark_read: 'تحديد الكل كمقروء', reply: 'رد', delete: 'حذف',
      ai_alert_title: 'تنبيه الذكاء الاصطناعي',
      ai_alert_msg: 'منشورك ينتشر بشكل واسع.',
      ai_alert_desc: 'التفاعل أعلى بنسبة 85٪.',
      view_analytics: 'عرض التحليلات', dismiss: 'تجاهل',
      action_follow: 'بدأ في متابعتك',
      action_like: 'أعجب بصورتك',
      action_comment: 'علّق على منشورك',
      no_notifications: 'لا توجد إشعارات'
    },
    'Spanish': {
      title: 'Notificaciones', all: 'Todo', follow: 'Seguir',
      likes: 'Me gusta', comments: 'Comentarios',
      mark_read: 'Marcar todo como leído', reply: 'Responder', delete: 'Eliminar',
      ai_alert_title: 'ALERTA DE IA',
      ai_alert_msg: 'Tu publicación se está volviendo viral.',
      ai_alert_desc: 'El compromiso es 85% más alto.',
      view_analytics: 'Ver Análisis', dismiss: 'Descartar',
      action_follow: 'comenzó a seguirte',
      action_like: 'le gustó tu foto',
      action_comment: 'comentó tu publicación',
      no_notifications: 'Sin notificaciones aún'
    },
    'French': {
      title: 'Notifications', all: 'Tout', follow: 'Suivre',
      likes: "J'aime", comments: 'Commentaires',
      mark_read: 'Tout marquer comme lu', reply: 'Répondre', delete: 'Supprimer',
      ai_alert_title: 'ALERTE IA',
      ai_alert_msg: 'Votre publication devient virale.',
      ai_alert_desc: "L'engagement est 85% plus élevé.",
      view_analytics: 'Voir les Analyses', dismiss: 'Ignorer',
      action_follow: 'a commencé à vous suivre',
      action_like: 'a aimé votre photo',
      action_comment: 'a commenté votre post',
      no_notifications: 'Pas encore de notifications'
    },
    'Chinese': {
      title: '通知', all: '全部', follow: '关注',
      likes: '点赞', comments: '评论',
      mark_read: '全部标记为已读', reply: '回复', delete: '删除',
      ai_alert_title: 'AI 趋势预警',
      ai_alert_msg: '您的帖子正在疯传。',
      ai_alert_desc: '互动率高出 85%。',
      view_analytics: '查看分析', dismiss: '忽略',
      action_follow: '开始关注您了',
      action_like: '点赞了您的照片',
      action_comment: '评论了您的帖子',
      no_notifications: '暂无通知'
    }
  };

  constructor(
    private router: Router,
    private global: Globall,
    private http:   HttpClient
  ) {
    addIcons({
      arrowBackOutline, trendingUpOutline, sparklesOutline,
      homeOutline, searchOutline, notifications,
      notificationsOutline, personOutline,
      chatbubbleOutline, heart, heartOutline, trashOutline,
      personAddOutline
    });
  }

  async ngOnInit() {
    // ✅ Language setup
    this.global.lang$.subscribe((lang: string) => {
      this.currentLang = lang;
      this.ui = this.translations[lang] || this.translations['English (US)'];
      const isRtl = lang === 'Urdu' || lang === 'Arabic';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    });

    // ✅ Real user ID lao
    await this.loadUserId();
    this.loadNotifications();
  }

  // ✅ User ID — Preferences (mobile) ya localStorage (web) se
  private async loadUserId() {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: 'userId' });
        if (value) { this.userId = value; return; }
      }
      const localId = localStorage.getItem('userId');
      if (localId) { this.userId = localId; }
    } catch (_) {
      // fallback: userId = 1
    }
  }

  // ✅ Notifications backend se load karo
  loadNotifications() {
    this.isLoading = true;
    this.http.get<any[]>(`${this.base}/notifications/${this.userId}/`).subscribe({
      next: (data) => {
        this.notificationsList = data.map(n => ({
          id:      n.id,
          name:    n.from_name  || 'Unknown',
          img:     n.from_img   || 'assets/download (1).jpg',
          type:    n.type,
          is_read: n.is_read,
          time:    this.timeAgo(n.created_at),
        }));
        this.isLoading = false;
      },
      error: () => {
        // ✅ Backend down ho toh fallback data dikhao
        this.notificationsList = this.FALLBACK_NOTIFICATIONS;
        this.isLoading = false;
      }
    });
  }

  // ✅ Pull to refresh
  handleRefresh(event: any) {
    this.http.get<any[]>(`${this.base}/notifications/${this.userId}/`).subscribe({
      next: (data) => {
        this.notificationsList = data.map(n => ({
          id:      n.id,
          name:    n.from_name  || 'Unknown',
          img:     n.from_img   || 'assets/download (1).jpg',
          type:    n.type,
          is_read: n.is_read,
          time:    this.timeAgo(n.created_at),
        }));
        event.target.complete();
      },
      error: () => event.target.complete()
    });
  }

  // ✅ Delete notification — backend + local list
  deleteNote(note: any) {
    this.http.delete(`${this.base}/notifications/delete/${note.id}/`).subscribe({
      next:  () => { this.removeLocally(note.id); },
      error: () => { this.removeLocally(note.id); } // local se bhi hata do
    });
  }

  private removeLocally(id: number) {
    this.notificationsList = this.notificationsList.filter(n => n.id !== id);
  }

  // ✅ Mark all read — backend + local
  markAllRead() {
    this.http.patch(`${this.base}/notifications/${this.userId}/read-all/`, {}).subscribe({
      next:  () => { this.notificationsList.forEach(n => n.is_read = true); },
      error: () => { this.notificationsList.forEach(n => n.is_read = true); }
    });
  }

  // Filter
  setFilter(category: string) { this.selectedFilter = category; }

  get filteredNotifications() {
    if (this.selectedFilter === 'All') return this.notificationsList;
    return this.notificationsList.filter(n => n.type === this.selectedFilter);
  }

  getFilterLabel(cat: string): string {
    if (cat === 'All')      return this.ui?.all      || 'All';
    if (cat === 'Likes')    return this.ui?.likes    || 'Likes';
    if (cat === 'Comments') return this.ui?.comments || 'Comments';
    if (cat === 'Follow')   return this.ui?.follow   || 'Follow';
    return cat;
  }

  getActionText(note: any): string {
    if (note.type === 'Follow')   return this.ui?.action_follow  || 'started following you';
    if (note.type === 'Likes')    return this.ui?.action_like    || 'liked your photo';
    if (note.type === 'Comments') return this.ui?.action_comment || 'commented on your post';
    return '';
  }

  getNotificationTime(note: any): string { return note.time || ''; }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  goToReports()  { this.router.navigate(['/analytics-report']); }
  dismissAlert() { this.showAlert = false; }
  doReply(note: any) { alert(`${this.ui?.reply}: ${note.name}`); }
  goToSearchUser() {
  this.router.navigate(['/user-search']);
}

goToPublicProfile() {
  this.router.navigate(['/public-profile']);
}
}