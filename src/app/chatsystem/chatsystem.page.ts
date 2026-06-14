import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ViewWillEnter } from '@ionic/angular';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonAvatar, IonLabel,
  IonSearchbar, IonFab, IonButton, IonIcon, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  menuOutline, paperPlaneOutline, createOutline,
  homeOutline, compassOutline, ribbonOutline,
  chatbubbleOutline, personOutline, notificationsOutline,
  sparklesOutline, settingsOutline, playOutline, personCircleOutline
} from 'ionicons/icons';
import { Globall } from '../globall';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-chatsystem',
  templateUrl: './chatsystem.page.html',
  styleUrls: ['./chatsystem.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonAvatar, IonLabel,
    IonSearchbar, IonFab, IonButton, IonIcon, IonButtons,
    CommonModule, FormsModule
  ]
})
export class ChatsystemPage implements OnInit, ViewWillEnter {

  private base   = 'http://127.0.0.1:8000/api';
  private userId = 1; // baad mein login se lena

  currentUser: any;
  activeTab   = 'chat';
  currentLang = 'English (US)';
  ui: any      = {};

  chats:         any[] = [];
  filteredChats: any[] = [];

  translations: any = {
    'English (US)': {
      title: 'VibeNet',
      search_placeholder: 'Search conversations...',
      no_results: 'No conversations found',
      new_message: 'NEW MESSAGE',
      nav_home: 'Home', nav_explore: 'Explore',
      nav_chat: 'Chat', nav_setting: 'Setting', nav_profile: 'Profile'
    },
    'Urdu': {
      title: 'وائب نیٹ',
      search_placeholder: 'گفتگو تلاش کریں...',
      no_results: 'کوئی گفتگو نہیں ملی',
      new_message: 'نیا پیغام',
      nav_home: 'ہوم', nav_explore: 'دریافت',
      nav_chat: 'چیٹ', nav_setting: 'ترتیبات', nav_profile: 'پروفائل'
    },
    'Arabic': {
      title: 'فايب نت',
      search_placeholder: 'ابحث في المحادثات...',
      no_results: 'لم يتم العثور على محادثات',
      new_message: 'رسالة جديدة',
      nav_home: 'الرئيسية', nav_explore: 'استكشاف',
      nav_chat: 'الدردشة', nav_setting: 'الإعدادات', nav_profile: 'الملف'
    },
    'Spanish': {
      title: 'VibeNet',
      search_placeholder: 'Buscar conversaciones...',
      no_results: 'No se encontraron conversaciones',
      new_message: 'NUEVO MENSAJE',
      nav_home: 'Inicio', nav_explore: 'Explorar',
      nav_chat: 'Chat', nav_setting: 'Ajustes', nav_profile: 'Perfil'
    },
    'French': {
      title: 'VibeNet',
      search_placeholder: 'Rechercher des conversations...',
      no_results: 'Aucune conversation trouvée',
      new_message: 'NOUVEAU MESSAGE',
      nav_home: 'Accueil', nav_explore: 'Explorer',
      nav_chat: 'Chat', nav_setting: 'Paramètres', nav_profile: 'Profil'
    },
    'Chinese': {
      title: '活力网',
      search_placeholder: '搜索对话...',
      no_results: '未找到对话',
      new_message: '新消息',
      nav_home: '主页', nav_explore: '探索',
      nav_chat: '聊天', nav_setting: '设置', nav_profile: '个人资料'
    }
  };

  constructor(
    private router: Router,
    private global: Globall,
    private http:   HttpClient
  ) {
    addIcons({
      menuOutline, paperPlaneOutline, createOutline,
      homeOutline, compassOutline, ribbonOutline,
      chatbubbleOutline, personOutline, notificationsOutline,
      sparklesOutline, settingsOutline, playOutline, personCircleOutline
    });
  }

  // =========================================
  // LIFECYCLE
  // =========================================

  ngOnInit() {
    this.currentUser = this.global.getUser();

    this.global.currentUser.subscribe((user: any) => {
      this.currentUser = user;
    });

    this.global.lang$.subscribe((lang: string) => {
      this.currentLang = lang;
      this.ui          = this.translations[lang] || this.translations['English (US)'];
      const isRtl      = lang === 'Urdu' || lang === 'Arabic';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    });

    this.loadConversations();
  }

  ionViewWillEnter() {
    this.activeTab = 'chat';
    this.loadConversations();
  }

  // =========================================
  // LOAD CONVERSATIONS — DATABASE
  // =========================================

  loadConversations() {
    this.http.get<any[]>(`${this.base}/conversations/${this.userId}/`).subscribe({
      next: (data) => {
        this.chats = data.map(c => ({
          id:      c.id,
          name:    c.other_name,
          msg:     c.last_message || 'No messages yet',
          time:    this.timeAgo(c.updated_at),
          online:  c.is_online,
          img:     c.other_img || 'assets/download (1).jpg',
        }));
        this.filteredChats = [...this.chats];
      },
      error: () => {
        // fallback mock data
        this.chats = [
          { id: 1, name: 'Alex Rivers',   msg: 'Discussing Q4 project...', time: '2m ago', online: true,  img: 'assets/download (1).jpg' },
          { id: 2, name: 'Sarah Chen',    msg: 'Venue confirmed...',        time: '1h ago', online: true,  img: 'assets/download (2).jpg' },
          { id: 3, name: 'Jordan Miller', msg: 'Designs ready...',          time: '5h ago', online: false, img: 'assets/images (1).jpg'   },
        ];
        this.filteredChats = [...this.chats];
      }
    });
  }

  // ── Time ago helper ──
  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)   return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24)   return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // =========================================
  // SEARCH
  // =========================================

  handleSearch(event: any) {
    const query = event.target.value?.toLowerCase() || '';
    if (query.trim()) {
      this.filteredChats = this.chats.filter(chat =>
        chat.name.toLowerCase().includes(query) ||
        chat.msg.toLowerCase().includes(query)
      );
    } else {
      this.filteredChats = [...this.chats];
    }
  }

  // =========================================
  // OPEN CHAT
  // =========================================

  openChat(chat: any) {
    this.router.navigate(['/chat-detail'], {
      queryParams: {
        id:   chat.id,
        name: chat.name,
        img:  chat.img,
      }
    });
  }

  // =========================================
  // NEW CHAT — DATABASE
  // =========================================

  startNewChat() {
    const name = prompt('Enter contact name:');
    if (!name) return;

    this.http.post<any>(`${this.base}/conversations/${this.userId}/create/`, {
      other_name:   name,
      other_img:    'assets/download (1).jpg',
      last_message: '',
      is_online:    false,
    }).subscribe({
      next: () => {
        this.loadConversations();
      },
      error: () => {
        alert('Could not create conversation');
      }
    });
  }

  // =========================================
  // NAVIGATION
  // =========================================

  navigateTo(tab: string, route: string) {
    this.activeTab = tab;
    this.router.navigate([route]);
  }

  setTab(tab: string) {
    this.activeTab = tab.toLowerCase();
    switch (tab) {
      case 'Home':    this.router.navigate(['/homefeed']);     break;
      case 'Explore': this.router.navigate(['/explore']);      break;
      case 'Chat':    this.router.navigate(['/chatsystem']);   break;
      case 'AI':      this.router.navigate(['/ai-assistant']); break;
      case 'Profile': this.router.navigate(['/userprofile']);  break;
    }
  }

  updateUserFromChat() {
    this.global.setUser({ name: 'Chat User Updated 🔥' });
  }
}