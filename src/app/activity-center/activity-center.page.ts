import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  playCircleOutline, chatbubbleEllipsesOutline, searchOutline,
  linkOutline, atOutline, personOutline, hourglassOutline,
  copyOutline, trashOutline, eyeOutline, chatbubblesOutline,
  videocamOutline, chevronForwardOutline, closeOutline,
  globeOutline, peopleOutline, lockClosedOutline, banOutline,
  musicalNotesOutline, refreshOutline, imageOutline,
  documentTextOutline, pencilOutline, keyOutline
} from 'ionicons/icons';
import { Globall } from '../globall';

@Component({
  selector: 'app-activity-center',
  templateUrl: './activity-center.page.html',
  styleUrls: ['./activity-center.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ActivityCenterPage implements OnInit {

  ui: any;
  isRtl = false;
  modalOpen = false;
  activeType = '';
  activeModal: any = null;
  showToast = false;
  toastMsg = '';

  // ---- Settings State ----
  postVisibility = 'everyone';
  commentPerm = 'everyone';
  screenLimitEnabled = false;
  reusePerms = { followers: true, everyone: false, audio: true };

  // ---- Mock Data ----
  searchHistory = [
    { query: 'AI Art trends 2025', time: '2h ago' },
    { query: 'Abstract wallpapers', time: '5h ago' },
    { query: 'Cyberpunk city', time: 'Yesterday' },
    { query: 'Neural network art', time: '2 days ago' },
    { query: 'Neon illustrations', time: '3 days ago' },
  ];

  adsHistory = [
    { title: 'ProArt Software', url: 'proart.io/deal', time: '1h ago' },
    { title: 'CreativeCloud', url: 'adobe.com/offer', time: 'Yesterday' },
    { title: 'Canva Pro', url: 'canva.com/pro', time: '3 days ago' },
  ];

  mentionHistory = [
    { user: '@alex_design', context: 'Tagged you in a post', time: '30m ago', avatar: 'assets/download (1).jpg' },
    { user: '@vibenet_official', context: 'Mentioned you in comments', time: '2h ago', avatar: 'assets/download (8).jpg' },
    { user: '@sara_art', context: 'Tagged you in a story', time: 'Yesterday', avatar: 'assets/download (1).jpg' },
  ];

  accountHistory = [
    { action: 'Password changed', detail: 'From Android device', time: '1 day ago', icon: 'key-outline' },
    { action: 'Email updated', detail: 'new@email.com', time: '3 days ago', icon: 'pencil-outline' },
    { action: 'Profile photo updated', detail: 'New avatar set', time: '1 week ago', icon: 'image-outline' },
    { action: 'Username changed', detail: '@vibenet_user', time: '2 weeks ago', icon: 'person-outline' },
  ];

  screenTime = {
    today: '2h 14m',
    week: '14h 32m',
    avg: '2h 04m',
    month: '58h 10m'
  };

  reuseHistory = [
    { content: 'Abstract Waves Post', by: '@remix_king', time: '1h ago' },
    { content: 'Cyber City Reel', by: '@techvibe99', time: 'Yesterday' },
    { content: 'AI Art Story', by: '@neural_art', time: '2 days ago' },
  ];

  deletedItems = [
    { title: 'Sunset Photo Post', date: 'May 10, 2025', icon: 'image-outline' },
    { title: 'My First Reel', date: 'May 8, 2025', icon: 'videocam-outline' },
    { title: 'Travel Story', date: 'May 5, 2025', icon: 'document-text-outline' },
  ];

  // ---- Modal Config ----
  modalConfig: any = {
    search:        { icon: 'search-outline',           titleKey: 'search' },
    ads:           { icon: 'link-outline',             titleKey: 'ads' },
    mention:       { icon: 'at-outline',               titleKey: 'mention' },
    account:       { icon: 'person-outline',           titleKey: 'account' },
    screen:        { icon: 'hourglass-outline',        titleKey: 'screen' },
    reuse:         { icon: 'copy-outline',             titleKey: 'reuse' },
    deleted:       { icon: 'trash-outline',            titleKey: 'deleted' },
    visibility:    { icon: 'eye-outline',              titleKey: 'visibility' },
    comments_perm: { icon: 'chatbubbles-outline',      titleKey: 'comments_perm' },
    reuse_perm:    { icon: 'videocam-outline',         titleKey: 'reuse_perm' },
  };

  translations: any = {
    'English (US)': {
      title: 'Activity Center',
      search: 'Search History', search_desc: 'View and clear your past searches.',
      ads: 'Ad Link History', ads_desc: 'See the history of ad links you have clicked.',
      mention: 'Tag History', mention_desc: 'Check where you have been tagged or mentioned (@).',
      account: 'Account History', account_desc: 'View changes made to your account over time.',
      screen: 'Screen Time', screen_desc: 'Monitor how much time you spend on the app.',
      reuse: 'Content Reuse History', reuse_desc: 'Check the history of your reused content.',
      deleted: 'Recently Deleted', deleted_desc: 'View and restore items you recently deleted.',
      visibility: 'Manage Post Visibility', visibility_desc: 'Control who can see your posts.',
      comments_perm: 'Manage Comment Permissions', comments_perm_desc: 'Control who is allowed to comment on your posts.',
      reuse_perm: 'Post Reuse Permission', reuse_perm_desc: 'Allow or block others from reusing your posts.',
      clear_all: 'Clear All', delete_all: 'Delete All Permanently',
      restore: 'Restore', deleted_on: 'Deleted on', reused_by: 'Reused by',
      today: 'Today', this_week: 'This Week', daily_avg: 'Daily Avg', this_month: 'This Month',
      set_limit: 'Set Daily Limit',
      everyone: 'Everyone', followers_only: 'Followers Only', only_me: 'Only Me', no_one: 'No One',
      allow_followers: 'Allow Followers', allow_everyone: 'Allow Everyone', allow_audio: 'Allow Audio Reuse',
      save_changes: 'Save Changes', saved: 'Settings saved!'
    },
    'Urdu': {
      title: 'سرگرمی مرکز',
      search: 'تلاش کی تاریخ', search_desc: 'اپنی پچھلی تلاش دیکھیں اور صاف کریں۔',
      ads: 'اشتہار لنک کی تاریخ', ads_desc: 'آپ کے کلک کردہ اشتہار لنک کی تاریخ دیکھیں۔',
      mention: 'ٹیگ کی تاریخ', mention_desc: 'دیکھیں کہ آپ کو کہاں ٹیگ یا ذکر کیا گیا۔',
      account: 'اکاؤنٹ کی تاریخ', account_desc: 'اپنے اکاؤنٹ میں ہونے والی تبدیلیاں دیکھیں۔',
      screen: 'اسکرین ٹائم', screen_desc: 'ایپ پر گزارا وقت مانیٹر کریں۔',
      reuse: 'مواد دوبارہ استعمال کی تاریخ', reuse_desc: 'آپ کے دوبارہ استعمال شدہ مواد کی تاریخ۔',
      deleted: 'حال ہی میں حذف شدہ', deleted_desc: 'حذف شدہ آئٹمز دیکھیں اور بحال کریں۔',
      visibility: 'پوسٹ نمائش منظم کریں', visibility_desc: 'کنٹرول کریں کہ آپ کی پوسٹ کون دیکھ سکتا ہے۔',
      comments_perm: 'تبصرہ اجازت منظم کریں', comments_perm_desc: 'کنٹرول کریں کہ آپ کی پوسٹ پر کون تبصرہ کر سکتا ہے۔',
      reuse_perm: 'پوسٹ دوبارہ استعمال کی اجازت', reuse_perm_desc: 'دوسروں کو آپ کی پوسٹ دوبارہ استعمال کرنے کی اجازت دیں یا روکیں۔',
      clear_all: 'سب صاف کریں', delete_all: 'مستقل طور پر حذف کریں',
      restore: 'بحال کریں', deleted_on: 'حذف تاریخ', reused_by: 'دوبارہ استعمال',
      today: 'آج', this_week: 'اس ہفتے', daily_avg: 'روزانہ اوسط', this_month: 'اس مہینے',
      set_limit: 'روزانہ حد مقرر کریں',
      everyone: 'سب', followers_only: 'صرف فالوورز', only_me: 'صرف میں', no_one: 'کوئی نہیں',
      allow_followers: 'فالوورز کو اجازت', allow_everyone: 'سب کو اجازت', allow_audio: 'آڈیو دوبارہ استعمال',
      save_changes: 'تبدیلیاں محفوظ کریں', saved: 'ترتیبات محفوظ!'
    },
    'Arabic': {
      title: 'مركز النشاط',
      search: 'سجل البحث', search_desc: 'عرض وحذف عمليات البحث السابقة.',
      ads: 'سجل روابط الإعلانات', ads_desc: 'عرض سجل روابط الإعلانات التي نقرت عليها.',
      mention: 'سجل الإشارات', mention_desc: 'تحقق من أين تمت الإشارة إليك أو ذكرك.',
      account: 'سجل الحساب', account_desc: 'عرض التغييرات التي أُجريت على حسابك.',
      screen: 'وقت الشاشة', screen_desc: 'راقب المدة التي تقضيها في التطبيق.',
      reuse: 'سجل إعادة استخدام المحتوى', reuse_desc: 'تحقق من سجل المحتوى المُعاد استخدامه.',
      deleted: 'المحذوف مؤخراً', deleted_desc: 'عرض العناصر المحذوفة مؤخراً واستعادتها.',
      visibility: 'إدارة ظهور المنشورات', visibility_desc: 'تحكم في من يمكنه رؤية منشوراتك.',
      comments_perm: 'إدارة أذونات التعليقات', comments_perm_desc: 'تحكم في من يُسمح له بالتعليق.',
      reuse_perm: 'إذن إعادة استخدام المنشور', reuse_perm_desc: 'السماح أو منع الآخرين من إعادة استخدام منشوراتك.',
      clear_all: 'مسح الكل', delete_all: 'حذف نهائي',
      restore: 'استعادة', deleted_on: 'تاريخ الحذف', reused_by: 'أعيد استخدامه من',
      today: 'اليوم', this_week: 'هذا الأسبوع', daily_avg: 'المتوسط اليومي', this_month: 'هذا الشهر',
      set_limit: 'تعيين حد يومي',
      everyone: 'الجميع', followers_only: 'المتابعون فقط', only_me: 'أنا فقط', no_one: 'لا أحد',
      allow_followers: 'السماح للمتابعين', allow_everyone: 'السماح للجميع', allow_audio: 'إعادة استخدام الصوت',
      save_changes: 'حفظ التغييرات', saved: 'تم الحفظ!'
    },
    'Spanish': {
      title: 'Centro de Actividad',
      search: 'Historial de Búsqueda', search_desc: 'Ver y borrar tus búsquedas anteriores.',
      ads: 'Historial de Anuncios', ads_desc: 'Historial de enlaces de anuncios en los que hiciste clic.',
      mention: 'Historial de Etiquetas', mention_desc: 'Verifica dónde te han etiquetado o mencionado.',
      account: 'Historial de Cuenta', account_desc: 'Ver los cambios realizados en tu cuenta.',
      screen: 'Tiempo de Pantalla', screen_desc: 'Monitorea cuánto tiempo pasas en la app.',
      reuse: 'Historial de Reutilización', reuse_desc: 'Revisa el historial de contenido reutilizado.',
      deleted: 'Eliminados Recientemente', deleted_desc: 'Ver y restaurar elementos eliminados recientemente.',
      visibility: 'Gestionar Visibilidad', visibility_desc: 'Controla quién puede ver tus publicaciones.',
      comments_perm: 'Permisos de Comentarios', comments_perm_desc: 'Controla quién puede comentar en tus posts.',
      reuse_perm: 'Permiso de Reutilización', reuse_perm_desc: 'Permitir o bloquear la reutilización de tus posts.',
      clear_all: 'Borrar Todo', delete_all: 'Eliminar Permanentemente',
      restore: 'Restaurar', deleted_on: 'Eliminado el', reused_by: 'Reutilizado por',
      today: 'Hoy', this_week: 'Esta Semana', daily_avg: 'Prom. Diario', this_month: 'Este Mes',
      set_limit: 'Establecer Límite Diario',
      everyone: 'Todos', followers_only: 'Solo Seguidores', only_me: 'Solo Yo', no_one: 'Nadie',
      allow_followers: 'Permitir Seguidores', allow_everyone: 'Permitir Todos', allow_audio: 'Permitir Audio',
      save_changes: 'Guardar Cambios', saved: '¡Guardado!'
    },
    'French': {
      title: "Centre d'Activité",
      search: 'Historique de Recherche', search_desc: 'Voir et effacer vos recherches passées.',
      ads: 'Historique des Annonces', ads_desc: 'Voir l\'historique des liens publicitaires cliqués.',
      mention: 'Historique des Mentions', mention_desc: 'Vérifiez où vous avez été mentionné ou tagué.',
      account: 'Historique du Compte', account_desc: 'Voir les modifications apportées à votre compte.',
      screen: "Temps d'Écran", screen_desc: "Surveillez le temps passé sur l'application.",
      reuse: 'Historique de Réutilisation', reuse_desc: 'Vérifiez l\'historique du contenu réutilisé.',
      deleted: 'Récemment Supprimés', deleted_desc: 'Voir et restaurer les éléments supprimés récemment.',
      visibility: 'Gérer la Visibilité', visibility_desc: 'Contrôlez qui peut voir vos publications.',
      comments_perm: 'Permissions de Commentaires', comments_perm_desc: 'Contrôlez qui peut commenter vos posts.',
      reuse_perm: 'Permission de Réutilisation', reuse_perm_desc: 'Autoriser ou bloquer la réutilisation de vos posts.',
      clear_all: 'Tout Effacer', delete_all: 'Supprimer Définitivement',
      restore: 'Restaurer', deleted_on: 'Supprimé le', reused_by: 'Réutilisé par',
      today: "Aujourd'hui", this_week: 'Cette Semaine', daily_avg: 'Moy. Quotidienne', this_month: 'Ce Mois',
      set_limit: 'Définir une Limite Quotidienne',
      everyone: 'Tout le Monde', followers_only: 'Abonnés Seulement', only_me: 'Moi Seul', no_one: 'Personne',
      allow_followers: 'Autoriser Abonnés', allow_everyone: 'Autoriser Tous', allow_audio: 'Réutilisation Audio',
      save_changes: 'Enregistrer', saved: 'Enregistré!'
    },
    'Chinese': {
      title: '活动中心',
      search: '搜索历史', search_desc: '查看并清除您的历史搜索记录。',
      ads: '广告链接历史', ads_desc: '查看您点击过的广告链接记录。',
      mention: '标记历史', mention_desc: '查看您被标记或提及的位置。',
      account: '账户历史', account_desc: '查看对您的账户所做的更改。',
      screen: '屏幕时间', screen_desc: '监控您在应用上花费的时间。',
      reuse: '内容重用历史', reuse_desc: '查看您内容被重用的历史记录。',
      deleted: '最近删除', deleted_desc: '查看并恢复最近删除的项目。',
      visibility: '管理帖子可见性', visibility_desc: '控制谁可以看到您的帖子。',
      comments_perm: '管理评论权限', comments_perm_desc: '控制谁可以评论您的帖子。',
      reuse_perm: '帖子重用权限', reuse_perm_desc: '允许或阻止他人重用您的帖子。',
      clear_all: '清除全部', delete_all: '永久删除',
      restore: '恢复', deleted_on: '删除于', reused_by: '被重用',
      today: '今天', this_week: '本周', daily_avg: '日均', this_month: '本月',
      set_limit: '设置每日限制',
      everyone: '所有人', followers_only: '仅粉丝', only_me: '仅自己', no_one: '无人',
      allow_followers: '允许粉丝', allow_everyone: '允许所有人', allow_audio: '允许音频重用',
      save_changes: '保存更改', saved: '已保存!'
    }
  };

  constructor(private global: Globall) {
    addIcons({
      playCircleOutline, chatbubbleEllipsesOutline, searchOutline,
      linkOutline, atOutline, personOutline, hourglassOutline,
      copyOutline, trashOutline, eyeOutline, chatbubblesOutline,
      videocamOutline, chevronForwardOutline, closeOutline,
      globeOutline, peopleOutline, lockClosedOutline, banOutline,
      musicalNotesOutline, refreshOutline, imageOutline,
      documentTextOutline, pencilOutline, keyOutline
    });
  }

  ngOnInit() {
    this.global.lang$.subscribe((lang: string) => {
      this.ui = this.translations[lang] || this.translations['English (US)'];
      this.isRtl = lang === 'Urdu' || lang === 'Arabic';
      document.documentElement.dir = this.isRtl ? 'rtl' : 'ltr';
    });
  }

  openModal(type: string) {
    this.activeType = type;
    const config = this.modalConfig[type];
    this.activeModal = {
      icon: config.icon,
      title: this.ui[config.titleKey]
    };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.activeType = '';
    this.activeModal = null;
  }

  clearList(type: string) {
    if (type === 'search') this.searchHistory = [];
    else if (type === 'ads') this.adsHistory = [];
    else if (type === 'deleted') this.deletedItems = [];
    this.toastMsg = this.ui?.clear_all + ' ✓';
    this.showToast = true;
  }

  restoreItem(item: any) {
    this.deletedItems = this.deletedItems.filter(d => d !== item);
    this.toastMsg = item.title + ' restored!';
    this.showToast = true;
  }

  saveVisibility() {
    this.toastMsg = this.ui?.saved;
    this.showToast = true;
    this.closeModal();
  }

  saveCommentPerm() {
    this.toastMsg = this.ui?.saved;
    this.showToast = true;
    this.closeModal();
  }

  saveReusePerm() {
    this.toastMsg = this.ui?.saved;
    this.showToast = true;
    this.closeModal();
  }
}