import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonButtons,
  IonBackButton, IonFooter, IonInput, IonButton, IonIcon,
  IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sendOutline, cameraOutline, micOutline, callOutline,
  videocamOutline, ellipsisVerticalOutline, pinOutline,
  closeOutline, returnUpBackOutline, attachOutline,
  playOutline, searchOutline, personOutline,
  notificationsOffOutline, imageOutline, trashOutline,
  closeCircleOutline, informationCircleOutline,
  warningOutline, checkmarkCircleOutline
} from 'ionicons/icons';
import { Globall } from '../globall';
import { environment } from '../../environments/environment';

interface Reaction  { emoji: string; count: number; }
interface ChatMessage {
  id?:            number;
  text:           string;
  time:           string;
  sender:         string;
  image?:         string | null;
  translating?:   boolean;
  read?:          boolean;
  replyTo?:       string | null;
  reactions?:     Reaction[];
  isVoice?:       boolean;
  voiceDuration?: string;
  createdAt?:     Date;
}
interface ModalConfig {
  show: boolean; type: 'info'|'danger'|'success';
  icon: string; title: string; message: string;
  confirmLabel: string; confirmClass: string;
  cancelLabel: string|null; cancelable: boolean;
  onConfirm: (()=>void)|null;
}

@Component({
  selector:    'app-chat-detail',
  templateUrl: './chat-detail.page.html',
  styleUrls:   ['./chat-detail.page.scss'],
  standalone:  true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonButtons,
    IonBackButton, IonFooter, IonInput, IonButton, IonIcon,
    IonSearchbar, CommonModule, FormsModule
  ]
})
export class ChatDetailPage implements OnInit, OnDestroy {

  @ViewChild('contentArea') contentArea!: IonContent;
  @ViewChild('fileInput')   fileInput!:   ElementRef<HTMLInputElement>;
  @ViewChild('docInput')    docInput!:    ElementRef<HTMLInputElement>;

  // ─── WebSocket ───
  private ws!: WebSocket;
  private typingTimer: any;

  // ─── User info ───
  currentUserId   = '';
  currentUsername = '';

  // ─── Chat info ───
  convId:   string = '';
  chatName: string = '';
  chatImg:  string = '';

  // ─── Messages ───
  messages:         ChatMessage[] = [];
  filteredMessages: ChatMessage[] = [];
  newMessage        = '';
  isSending         = false;
  selectedImagePreview: string | null = null;
  selectedFile:         string | null = null;

  // ─── UI state ───
  showSearch   = false;
  searchQuery  = '';
  pinnedMessage: string | null = null;
  isTyping      = false;
  showMenu      = false;
  isMuted       = false;
  replyingTo:         ChatMessage | null = null;
  selectedMsg:        ChatMessage | null = null;
  showReactionPicker  = false;
  showEmojiBar        = false;
  quickEmojis = ['👍','❤️','😂','😮','😢','🔥','👏','😍'];
  allEmojis   = [
    '😀','😂','😍','😎','😢','😡','🤔','😴',
    '👍','👎','👏','🙌','🤝','💪','🙏','❤️',
    '🔥','⭐','🎉','✅','❌','💯','🚀','😊',
    '😘','🥰','😜','🤣','😅','😭','🤯','💀'
  ];

  // ─── Modal ───
  modal: ModalConfig = {
    show: false, type: 'info', icon: 'information-circle-outline',
    title: '', message: '', confirmLabel: 'OK',
    confirmClass: 'modal-btn-confirm', cancelLabel: null,
    cancelable: true, onConfirm: null
  };

  ui: any = { online: 'Online', placeholder: 'Type a message...' };
  currentLang = 'English (US)';

  constructor(
    private global: Globall,
    private http:   HttpClient,
    private route:  ActivatedRoute,
    
  ) {
    addIcons({
      sendOutline, cameraOutline, micOutline, callOutline,
      videocamOutline, ellipsisVerticalOutline, pinOutline,
      closeOutline, returnUpBackOutline, attachOutline,
      playOutline, searchOutline, personOutline,
      notificationsOffOutline, imageOutline, trashOutline,
      closeCircleOutline, informationCircleOutline,
      warningOutline, checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.currentUserId   = localStorage.getItem('userId')   || '';
    this.currentUsername = localStorage.getItem('username') || '';

    this.global.currentUser?.subscribe((user: any) => {
      if (user) {
        this.currentUserId   = String(user.id || user.userId || this.currentUserId);
        this.currentUsername = user.username || this.currentUsername;
      }
    });

    this.route.queryParams.subscribe(params => {
      this.convId        = params['id']     || '';
      this.chatName      = params['name']   || 'User';
      this.chatImg       = params['img']    || '';
      this.pinnedMessage = params['pinned'] || null;

      this.ws?.close();

      if (this.convId) {
        this.loadAllMessages();
        this.requestNotificationPermission();
        this.connectWebSocket();
      } else {
        this.loadDemoMessages();
      }
    });
  }

  ngOnDestroy() {
    this.ws?.close();
    clearTimeout(this.typingTimer);
  }

  // ─── Django WebSocket connect ───
  connectWebSocket() {
    const url = `${environment.wsUrl}/ws/chat/${this.convId}/`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected!');
    };

    this.ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (!data || !data.text) return;

      if (String(data.sender_id) !== String(this.currentUserId)) {
        const msg: ChatMessage = {
          text:      data.text,
          time:      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date(),
          sender:    'them',
          read:      false,
          reactions: []
        };
        this.messages.push(msg);
        this.filteredMessages = [...this.messages];
        this.scrollToBottom();
        this.showBrowserNotification(data.text);
        this.saveLocalNotification(data.text);
      }
    };

    this.ws.onerror = (e) => console.error('❌ WebSocket error', e);

    this.ws.onclose = () => {
      console.log('🔴 WebSocket disconnected — 3s mein reconnect...');
      setTimeout(() => this.connectWebSocket(), 3000);
    };
  }

  private getBaseUrl(): string {
    return environment.apiUrl;
  }

  loadAllMessages() {
    this.http.get<any[]>(
      `${this.getBaseUrl()}/api/conversations/${this.convId}/messages/`
    ).subscribe({
      next: (data) => {
        this.messages         = data.map(m => this.mapMessage(m));
        this.filteredMessages = [...this.messages];
        this.scrollToBottom();
        this.markAsRead();
      },
      error: () => this.loadDemoMessages()
    });
  }

  async sendMessage() {
    const hasText  = this.newMessage.trim();
    const hasImage = this.selectedImagePreview;
    if ((!hasText && !hasImage) || this.isSending) return;

    this.isSending = true;
    const text     = this.newMessage.trim();
    this.newMessage = '';
    const imageData           = this.selectedImagePreview;
    this.selectedImagePreview = null;
    const replyText = this.replyingTo?.text || null;
    this.replyingTo = null;

    const localMsg: ChatMessage = {
      text, image: imageData,
      time:      this.getCurrentTime(),
      createdAt: new Date(),
      sender:    'me', read: false,
      replyTo:   replyText, reactions: []
    };
    this.messages.push(localMsg);
    this.filteredMessages = [...this.messages];
    this.scrollToBottom();

    // Django WebSocket se bhejo
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        text,
        sender_id:   this.currentUserId,
        sender_name: this.currentUsername
      }));
    }

    if (this.convId && text) {
      this.http.post<any>(
        `${this.getBaseUrl()}/api/conversations/${this.convId}/messages/`,
        { sender_id: this.currentUserId, text }
      ).subscribe({
        next: (res) => {
          localMsg.id   = res.id;
          localMsg.read = res.is_read ?? false;
          this.sendNotificationToOtherUser(text);
        },
        error: () => {}
      });
    }

    this.isSending    = false;
    this.showEmojiBar = false;
  }

  onInput() {
    this.filteredMessages = [...this.messages];
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {}, 1500);
  }

  private sendNotificationToOtherUser(text: string) {
    if (!text) return;
    const otherId = this.getOtherUserId();
    if (!otherId) return;
    this.http.post(
      `${this.getBaseUrl()}/api/notifications/${otherId}/create/`,
      {
        from_name: this.currentUsername,
        from_img:  localStorage.getItem('photoUrl') || '',
        type:      'Message',
        text:      text.length > 50 ? text.slice(0, 50) + '...' : text,
        is_read:   false
      }
    ).subscribe();
  }

  private requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private showBrowserNotification(text: string) {
    if (!text) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(this.chatName, { body: text, icon: this.chatImg || 'assets/logo.jpg' });
    }
  }

  private saveLocalNotification(text: string) {
    if (!text) return;
    const notifKey = `vn_notifications_${this.currentUserId}`;
    try {
      const raw      = localStorage.getItem(notifKey);
      const existing = raw ? JSON.parse(raw) : [];
      existing.unshift({
        id: Date.now(), from_name: this.chatName,
        from_img: this.chatImg || '', type: 'Message',
        text: text.length > 60 ? text.slice(0, 60) + '...' : text,
        is_read: false, created_at: new Date().toISOString()
      });
      localStorage.setItem(notifKey, JSON.stringify(existing.slice(0, 50)));
    } catch (e) { console.error('Notification save error:', e); }
  }

  private getOtherUserId(): string {
    return localStorage.getItem(`conv_other_${this.convId}`) || '';
  }

  private mapMessage(m: any): ChatMessage {
    return {
      id: m.id, text: m.text || '',
      time:      new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date(m.created_at),
      sender:    String(m.sender_id) === String(this.currentUserId) ? 'me' : 'them',
      image: null, read: m.is_read ?? false, reactions: []
    };
  }

  loadDemoMessages() {
    this.messages = [
      { text: 'Hi! Kya haal hai?',     time: '10:00 AM', sender: 'them', createdAt: new Date(), reactions: [] },
      { text: 'Sab theek! Aap batao.', time: '10:01 AM', sender: 'me',   createdAt: new Date(), reactions: [] },
    ];
    this.filteredMessages = [...this.messages];
    this.scrollToBottom();
  }

  markAsRead() {
    if (!this.convId) return;
    this.http.patch(`${this.getBaseUrl()}/api/conversations/${this.convId}/read/`, {}).subscribe();
  }

  showModalAlert(options: any) {
    const icons: any = { info: 'information-circle-outline', danger: 'warning-outline', success: 'checkmark-circle-outline' };
    const type = options.type || 'info';
    this.modal = {
      show: true, type, icon: options.icon || icons[type],
      title: options.title, message: options.message,
      confirmLabel: options.confirmLabel || 'OK',
      confirmClass: options.confirmClass || 'modal-btn-confirm',
      cancelLabel:  options.cancelLabel  || null,
      cancelable:   options.cancelable   !== false,
      onConfirm:    options.onConfirm    || null
    };
  }
  closeModal()   { this.modal.show = false; }
  confirmModal() { const cb = this.modal.onConfirm; this.modal.show = false; if (cb) cb(); }
  toggleMenu()   { this.showMenu = !this.showMenu; }
  closeMenu()    { this.showMenu = false; }

  menuAction(action: string) {
    this.closeMenu();
    switch (action) {
      case 'clear':
        this.showModalAlert({
          type: 'danger', icon: 'trash-outline', title: 'Clear Chat?',
          message: 'Sab messages delete ho jayenge.',
          confirmLabel: 'Clear', confirmClass: 'modal-btn-danger', cancelLabel: 'Cancel',
          onConfirm: () => { this.messages = []; this.filteredMessages = []; }
        });
        break;
      case 'mute':
        this.isMuted = !this.isMuted;
        this.showModalAlert({ type: 'success', title: this.isMuted ? 'Muted' : 'Unmuted', message: '' });
        break;
      case 'search': this.showSearch = true; break;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.selectedImagePreview = reader.result as string; event.target.value = ''; };
    reader.readAsDataURL(file);
  }
  cancelImage() { this.selectedImagePreview = null; }
  onDocSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.messages.push({ text: `📄 ${file.name}`, image: null, time: this.getCurrentTime(), createdAt: new Date(), sender: 'me', read: false, reactions: [] });
    this.filteredMessages = [...this.messages];
    this.scrollToBottom();
    event.target.value = '';
  }

  toggleEmojiBar()              { this.showEmojiBar = !this.showEmojiBar; }
  insertEmoji(emoji: string)    { this.newMessage += emoji; }
  toggleSearch()                { this.showSearch = !this.showSearch; this.searchQuery = ''; this.filteredMessages = [...this.messages]; }
  filterMessages()              { const q = this.searchQuery.trim().toLowerCase(); this.filteredMessages = q ? this.messages.filter(m => m.text?.toLowerCase().includes(q)) : [...this.messages]; }
  onLongPress(msg: ChatMessage) { this.selectedMsg = msg; this.showReactionPicker = true; }
  onRightClick(e: Event, msg: ChatMessage) { e.preventDefault(); this.onLongPress(msg); }

  addReaction(msg: ChatMessage|null, emoji: string) {
    if (!msg) return;
    if (!msg.reactions) msg.reactions = [];
    const ex = msg.reactions.find(r => r.emoji === emoji);
    ex ? ex.count++ : msg.reactions.push({ emoji, count: 1 });
    this.showReactionPicker = false; this.selectedMsg = null;
  }
  toggleReaction(msg: ChatMessage, emoji: string) {
    if (!msg.reactions) return;
    const r = msg.reactions.find(x => x.emoji === emoji);
    if (!r) return;
    r.count > 1 ? r.count-- : msg.reactions.splice(msg.reactions.indexOf(r), 1);
  }
  onBubbleClick(msg: ChatMessage) {
    if (this.showReactionPicker) { this.showReactionPicker = false; return; }
    if (this.showMenu)           { this.closeMenu(); return; }
    this.replyingTo = msg;
  }
  cancelReply() { this.replyingTo = null; }
  startCall()   { console.log('Voice call'); }
  startVideo()  { console.log('Video call'); }
  recordVoice() {
    this.messages.push({ text: '', image: null, time: this.getCurrentTime(), createdAt: new Date(), sender: 'me', read: false, isVoice: true, voiceDuration: '0:05', reactions: [] });
    this.filteredMessages = [...this.messages];
    this.scrollToBottom();
  }

  isDifferentDay(a: ChatMessage, b: ChatMessage): boolean {
    if (!a.createdAt || !b.createdAt) return false;
    const da = new Date(a.createdAt), db = new Date(b.createdAt);
    return da.getFullYear() !== db.getFullYear() || da.getMonth() !== db.getMonth() || da.getDate() !== db.getDate();
  }
  formatDateLabel(time: string): string { return 'Today'; }
  getCurrentTime(): string { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  scrollToBottom() { setTimeout(() => this.contentArea?.scrollToBottom(300), 100); }
}