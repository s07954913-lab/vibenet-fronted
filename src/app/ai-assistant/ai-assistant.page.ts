import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonContent,
  IonHeader,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonChip,
  IonItem,
  IonInput,
  IonButton,
  ToastController
} from '@ionic/angular/standalone';

import { NavController, ViewWillEnter } from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  homeOutline,
  personOutline,
  settingsOutline,
  logOutOutline,
  bookmarkOutline,
  notificationsOutline,
  chatbubblesOutline,
  paperPlane,
  copyOutline,
  thumbsDownOutline,
  thumbsUpOutline,
  thumbsUp,
  thumbsDown,
  ribbon,
  ribbonOutline,
  createOutline,
  codeSlashOutline,
  sparklesOutline,
  compassOutline,
  closeOutline,
  trendingUpOutline,
  micOutline,
  micOffOutline,
  chatbubbleOutline,
  playOutline,
  addOutline,
  personCircleOutline,
  searchOutline
} from 'ionicons/icons';

import { AiService, ChatMessage } from '../services/ai';
import { Globall } from '../globall';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-ai-assistant',
  templateUrl: './ai-assistant.page.html',
  styleUrls: ['./ai-assistant.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonFooter,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonChip,
    IonItem,
    IonInput,
    IonButton
  ]
})
export class AiAssistantPage implements OnInit, ViewWillEnter {

  // ───────────── CONFIG ─────────────
  private base   = 'http://127.0.0.1:8000/api';
  private userId = 1; // baad mein login se lena

  // ───────────── NAV STATE ─────────────
  activeTab: string = 'AI';
  showMenu  = false;

  // ───────────── ADD SHEET ─────────────
  addSheetOpen = false;

  // ───────────── CHAT STATE ─────────────
  userMessage: string  = '';
  isLoading:   boolean = false;
  isListening: boolean = false;
  messages:    any[]   = [];

  private recognition: any;

  // ───────────── LANGUAGE ─────────────
  currentLang = 'English (US)';
  ui: any;

  translations: any = {
    'English (US)': {
      logo: 'VibeNet AI',
      welcome: 'WELCOME TO APP',
      placeholder: 'Ask any question...',
      thinking: 'Thinking...',
      copy_done: 'Copied!',
      clear_done: 'Chat history cleared!',
      mic_error: 'Browser does not support voice',
      listening: 'Listening... 🎤',
      title: 'Pulse AI Assistant',
      subtitle: 'Ask any question — AI will answer.',
      summarize: 'Summarize',
      coding: 'Coding Help',
      caption: 'Caption',
      ai_name: 'VibeNet AI',
      clear_history: '🗑️ Clear Chat History',
      home: 'Home', profile: 'Profile', saved: 'Saved',
      trending: 'Trending', settings: 'Settings',
      nav_home: 'Home', nav_explore: 'Explore',
      nav_ai: 'AI', nav_chat: 'Chat',
      nav_reels: 'Reels', nav_add: 'Add', nav_profile: 'Profile'
    },
    'Urdu': {
      logo: 'وائب نیٹ اے آئی',
      welcome: 'ایپ میں خوش آمدید',
      placeholder: 'کوئی بھی سوال پوچھیں...',
      thinking: 'سوچ رہا ہوں...',
      copy_done: 'کاپی ہو گیا!',
      clear_done: 'چیٹ ہسٹری صاف ہو گئی!',
      mic_error: 'براؤزر آواز سپورٹ نہیں کرتا',
      listening: 'سن رہا ہوں... 🎤',
      title: 'پلس اے آئی اسسٹنٹ',
      subtitle: 'کوئی بھی سوال پوچھیں — اے آئی جواب دے گا۔',
      summarize: 'خلاصہ', coding: 'کوڈنگ مدد', caption: 'کیپشن',
      ai_name: 'وائب نیٹ اے آئی',
      clear_history: '🗑️ چیٹ ہسٹری صاف کریں',
      home: 'ہوم', profile: 'پروفائل', saved: 'محفوظ',
      trending: 'ٹرینڈنگ', settings: 'سیٹنگز',
      nav_home: 'ہوم', nav_explore: 'دریافت',
      nav_ai: 'اے آئی', nav_chat: 'چیٹ',
      nav_reels: 'ریلز', nav_add: 'شامل', nav_profile: 'پروفائل'
    },
    'Arabic': {
      logo: 'فايب نت AI',
      welcome: 'مرحباً بك في التطبيق',
      placeholder: 'اطرح أي سؤال...',
      thinking: 'أفكر...',
      copy_done: 'تم النسخ!',
      clear_done: 'تم مسح السجل!',
      mic_error: 'المتصفح لا يدعم الصوت',
      listening: 'أستمع... 🎤',
      title: 'مساعد Pulse AI',
      subtitle: 'اطرح أي سؤال — سيجيب الذكاء الاصطناعي.',
      summarize: 'تلخيص', coding: 'مساعدة البرمجة', caption: 'تعليق',
      ai_name: 'VibeNet AI',
      clear_history: '🗑️ مسح سجل الدردشة',
      home: 'الرئيسية', profile: 'الملف', saved: 'المحفوظ',
      trending: 'الرائج', settings: 'الإعدادات',
      nav_home: 'الرئيسية', nav_explore: 'استكشاف',
      nav_ai: 'AI', nav_chat: 'دردشة',
      nav_reels: 'ريلز', nav_add: 'إضافة', nav_profile: 'الملف'
    },
    'Spanish': {
      logo: 'VibeNet AI',
      welcome: 'BIENVENIDO A LA APP',
      placeholder: 'Haz cualquier pregunta...',
      thinking: 'Pensando...',
      copy_done: '¡Copiado!',
      clear_done: '¡Historial borrado!',
      mic_error: 'El navegador no soporta voz',
      listening: 'Escuchando... 🎤',
      title: 'Asistente Pulse AI',
      subtitle: 'Haz cualquier pregunta — la IA responderá.',
      summarize: 'Resumir', coding: 'Ayuda con código', caption: 'Título',
      ai_name: 'VibeNet AI',
      clear_history: '🗑️ Borrar Historial',
      home: 'Inicio', profile: 'Perfil', saved: 'Guardado',
      trending: 'Tendencias', settings: 'Ajustes',
      nav_home: 'Inicio', nav_explore: 'Explorar',
      nav_ai: 'IA', nav_chat: 'Chat',
      nav_reels: 'Reels', nav_add: 'Agregar', nav_profile: 'Perfil'
    },
    'French': {
      logo: 'VibeNet AI',
      welcome: 'BIENVENUE DANS L\'APP',
      placeholder: 'Posez n\'importe quelle question...',
      thinking: 'Je réfléchis...',
      copy_done: 'Copié !',
      clear_done: 'Historique effacé !',
      mic_error: 'Le navigateur ne supporte pas la voix',
      listening: 'J\'écoute... 🎤',
      title: 'Assistant Pulse AI',
      subtitle: 'Posez n\'importe quelle question — l\'IA répondra.',
      summarize: 'Résumer', coding: 'Aide au code', caption: 'Légende',
      ai_name: 'VibeNet AI',
      clear_history: '🗑️ Effacer l\'Historique',
      home: 'Accueil', profile: 'Profil', saved: 'Enregistré',
      trending: 'Tendances', settings: 'Paramètres',
      nav_home: 'Accueil', nav_explore: 'Explorer',
      nav_ai: 'IA', nav_chat: 'Chat',
      nav_reels: 'Reels', nav_add: 'Ajouter', nav_profile: 'Profil'
    },
    'Chinese': {
      logo: 'VibeNet AI',
      welcome: '欢迎使用应用',
      placeholder: '提出任何问题...',
      thinking: '思考中...',
      copy_done: '已复制！',
      clear_done: '聊天记录已清除！',
      mic_error: '浏览器不支持语音',
      listening: '正在听... 🎤',
      title: 'Pulse AI 助手',
      subtitle: '提出任何问题 — AI 将回答。',
      summarize: '总结', coding: '编程帮助', caption: '标题',
      ai_name: 'VibeNet AI',
      clear_history: '🗑️ 清除聊天记录',
      home: '主页', profile: '个人资料', saved: '已保存',
      trending: '热门', settings: '设置',
      nav_home: '主页', nav_explore: '探索',
      nav_ai: 'AI', nav_chat: '聊天',
      nav_reels: '短视频', nav_add: '添加', nav_profile: '个人资料'
    }
  };

  constructor(
    private toastCtrl: ToastController,
    private aiService: AiService,
    private global:    Globall,
    private router:    Router,
    private navCtrl:   NavController,
    private http:      HttpClient
  ) {
    addIcons({
      homeOutline, personOutline, settingsOutline,
      logOutOutline, bookmarkOutline, notificationsOutline,
      chatbubblesOutline, paperPlane, copyOutline,
      thumbsDownOutline, thumbsUpOutline, thumbsUp, thumbsDown,
      ribbon, ribbonOutline, createOutline, codeSlashOutline,
      sparklesOutline, compassOutline, closeOutline,
      trendingUpOutline, micOutline, chatbubbleOutline,
      micOffOutline, playOutline, addOutline,
      personCircleOutline, searchOutline,
    });
  }

  // =========================================
  // LIFECYCLE
  // =========================================

  ionViewWillEnter() {
    this.activeTab = 'AI';
  }

  ngOnInit() {
    this.activeTab = 'AI';
    this.loadHistory();
    this.setupSpeechRecognition();

    this.global.lang$.subscribe((lang: string) => {
      this.currentLang = lang;
      this.ui = this.translations[lang] || this.translations['English (US)'];
      const isRtl = lang === 'Urdu' || lang === 'Arabic';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    });
  }

  // =========================================
  // FOOTER NAV
  // =========================================

  setTab(tab: string) {
    switch (tab) {
      case 'Home':    this.navCtrl.navigateForward('/homefeed');     break;
      case 'Chat':    this.navCtrl.navigateForward('/chatsystem');   break;
      case 'Reels':   this.navCtrl.navigateForward('/reels');        break;
      case 'AI':      this.navCtrl.navigateForward('/ai-assistant'); break;
      case 'Profile': this.navCtrl.navigateForward('/userprofile');  break;
      case 'Explore': this.navCtrl.navigateRoot('/explore');         break;
    }
  }

  // =========================================
  // ADD SHEET
  // =========================================

  openAddSheet()  { this.addSheetOpen = true;  }
  closeAddSheet() { this.addSheetOpen = false; }

  addSheetAction(action: 'camera' | 'gallery' | 'cancel') {
    this.closeAddSheet();
    if (action === 'camera')  console.log('Camera selected');
    if (action === 'gallery') console.log('Gallery selected');
  }

  // =========================================
  // CHAT HISTORY — DATABASE
  // =========================================

  loadHistory() {
    this.http.get<any[]>(`${this.base}/chat/${this.userId}/`).subscribe({
      next: (data) => {
        this.messages = data.map(m => ({
          id:       m.id,
          role:     m.role,
          content:  m.content,
          liked:    m.liked,
          disliked: m.disliked,
        }));
      },
      error: () => {
        // fallback — localStorage se lo
        try {
          const saved = localStorage.getItem('vibenet_chat_history');
          if (saved) this.messages = JSON.parse(saved);
        } catch (e) {
          this.messages = [];
        }
      }
    });
  }

  // ── Ek message DB mein save karo ──
  saveMessageToDB(role: string, content: string): Promise<any> {
    return this.http.post<any>(`${this.base}/chat/${this.userId}/`, {
      role:     role,
      content:  content,
      liked:    false,
      disliked: false,
    }).toPromise().then(res => {
      if (res && res.id) {
        // Last message ko DB ka id do
        const last = this.messages[this.messages.length - 1];
        if (last) last.id = res.id;
      }
    }).catch(() => {});
  }

  // ── Poori history clear karo ──
  clearHistory() {
    this.http.delete(`${this.base}/chat/${this.userId}/clear/`).subscribe({
      next: () => {
        this.messages = [];
        this.presentToast(this.ui?.clear_done || 'Chat history cleared!');
      },
      error: () => {
        this.messages = [];
        localStorage.removeItem('vibenet_chat_history');
        this.presentToast(this.ui?.clear_done || 'Chat history cleared!');
      }
    });
  }

  // =========================================
  // SEND MESSAGE
  // =========================================

  async sendMessage() {
    const text = this.userMessage.trim();
    if (!text || this.isLoading) return;

    // 1. User message UI mein add karo
    this.messages.push({ role: 'user', content: text });

    // 2. User message DB mein save karo
    await this.saveMessageToDB('user', text);

    this.userMessage = '';
    this.isLoading   = true;

    try {
      const reply = await this.aiService.sendMessage(this.messages, this.currentLang);

      // 3. AI reply UI mein add karo
      this.messages.push({
        role:     'assistant',
        content:  reply,
        liked:    false,
        disliked: false,
      });

      // 4. AI reply bhi DB mein save karo
      await this.saveMessageToDB('assistant', reply);

    } catch (error: any) {
      this.presentToast('Error: ' + (error.message || 'Kuch masla ho gaya'));
      this.messages.pop();
    } finally {
      this.isLoading = false;
    }
  }

  // =========================================
  // LIKE / DISLIKE — DATABASE
  // =========================================

  toggleLike(index: number) {
    const msg  = this.messages[index];
    msg.liked  = !msg.liked;
    if (msg.liked) msg.disliked = false;

    if (msg.id) {
      this.http.patch(`${this.base}/chat/message/${msg.id}/`, {
        liked: msg.liked
      }).subscribe();
    }
  }

  toggleDislike(index: number) {
    const msg    = this.messages[index];
    msg.disliked = !msg.disliked;
    if (msg.disliked) msg.liked = false;

    if (msg.id) {
      this.http.patch(`${this.base}/chat/message/${msg.id}/`, {
        disliked: msg.disliked
      }).subscribe();
    }
  }

  // =========================================
  // COPY
  // =========================================

  async copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    this.presentToast(this.ui?.copy_done || 'Copy ho gaya!');
  }

  // =========================================
  // VOICE
  // =========================================

  setupSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    this.recognition                = new SpeechRecognition();
    this.recognition.lang           = 'ur-PK';
    this.recognition.continuous     = false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.userMessage = transcript;
      this.isListening = false;
      this.presentToast((this.ui?.listening || 'Heard: ') + transcript);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      if (event.error !== 'aborted') {
        this.presentToast(this.ui?.mic_error || 'Mic error');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  toggleVoice() {
    if (!this.recognition) {
      this.presentToast(this.ui?.mic_error || 'Browser voice support nahi karta');
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      this.recognition.start();
      this.isListening = true;
      this.presentToast(this.ui?.listening || 'Bol rahe hain... 🎤');
    }
  }

  // =========================================
  // TOAST
  // =========================================

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color:    'dark'
    });
    await toast.present();
  }

  // =========================================
  // NOTIFICATIONS
  // =========================================

  goToNotifications() {
    this.router.navigate(['/notification']);
  }
}