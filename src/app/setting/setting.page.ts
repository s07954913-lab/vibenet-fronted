import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonItem,
  IonIcon,
  IonLabel,
  IonNote,
  IonToggle,
  IonButton,
  IonFooter,
  IonModal,
  IonRadio,
  IonRadioGroup,
  IonList,
  IonInput,
  IonToast
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  personOutline,
  lockClosedOutline,
  languageOutline,
  moonOutline,
  apertureOutline,
  logOutOutline,
  homeOutline,
  searchOutline,
  notificationsOutline,
  settings,
  chatbubblesOutline,
  checkmarkCircle,
  cameraOutline,
  trashOutline
} from 'ionicons/icons';

import {
  Camera,
  CameraResultType,
  CameraSource
} from '@capacitor/camera';

import { Globall } from '../globall';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonItem,
    IonIcon,
    IonLabel,
    IonNote,
    IonToggle,
    IonButton,
    IonFooter,
    IonModal,
    IonRadio,
    IonRadioGroup,
    IonList,
    IonInput,
    IonToast
  ]
})
export class SettingPage implements OnInit {

  // ================= USER =================
  userName = '';
  userEmail = '';
  profileImage = '';

  // ================= THEME =================
  isDarkMode = false;

  // ================= MODALS =================
  isModalOpen = false;
  isAccountModalOpen = false;
  isPrivacyModalOpen = false;

  // ================= TEMP =================
  tempName = '';
  tempEmail = '';
  tempLanguage = 'English (US)';

  // ================= TOAST =================
  showToast = false;

  // ================= FOOTER =================
  activeTab: string = 'Settings';

  // ================= LANGUAGE =================
  selectedLanguage = 'English (US)';

  // ================= TRANSLATIONS =================
  translations: any = {
    'English (US)': {
      title: 'Settings', general: 'GENERAL', account: 'Account', privacy: 'Privacy', lang: 'Language', dark: 'Dark Mode',
      assistant: 'AI ASSISTANT', logout: 'Logout', edit_p: 'Edit Profile', save: 'SAVE', cancel: 'CANCEL',
      visibility: 'VISIBILITY', p_vis: 'Profile Visibility', act_stat: 'Activity Status', clear: 'Clear History',
      name: 'Your Name', email: 'Your Email', select_l: 'Select Language', ai_engine: 'Hyper-Tech Engine',
      ai_desc: 'Customize your AI persona', resp_style: 'RESPONSE STYLE', voice_model: 'VOICE MODEL', creative: 'Creative', energetic: 'Energetic'
    },
    'Urdu': {
      title: 'ترتیبات', general: 'عمومی', account: 'اکاؤنٹ', privacy: 'رازداری', lang: 'زبان', dark: 'ڈارک موڈ',
      assistant: 'AI اسسٹنٹ', logout: 'لاگ آؤٹ', edit_p: 'پروفائل تبدیل کریں', save: 'محفوظ کریں', cancel: 'منسوخ',
      visibility: 'رازداری', p_vis: 'پروفائل ویزیبلٹی', act_stat: 'ایکٹیویٹی اسٹیٹس', clear: 'ہسٹری صاف کریں',
      name: 'آپ کا نام', email: 'آپ کا ای میل', select_l: 'زبان منتخب کریں', ai_engine: 'ہائپر ٹیک انجن',
      ai_desc: 'اپنی AI شخصیت کو ترتیب دیں', resp_style: 'جواب کا انداز', voice_model: 'آواز ماڈل', creative: 'تخلیقی', energetic: 'پرجوش'
    },
    'Arabic': {
      title: 'الإعدادات', general: 'عام', account: 'الحساب', privacy: 'الخصوصية', lang: 'اللغة', dark: 'الوضع الداكن',
      assistant: 'مساعد AI', logout: 'تسجيل الخروج', edit_p: 'تعديل الملف الشخصي', save: 'حفظ', cancel: 'إلغاء',
      visibility: 'الرؤية', p_vis: 'رؤية الملف الشخصي', act_stat: 'حالة النشاط', clear: 'مسح السجل',
      name: 'اسمك', email: 'بريدك الإلكتروني', select_l: 'اختر اللغة', ai_engine: 'محرك الهايبر تيك',
      ai_desc: 'تخصيص شخصية الذكاء الاصطناعي', resp_style: 'أسلوب الاستجابة', voice_model: 'نموذج الصوت', creative: 'مبدع', energetic: 'نشيط'
    },
    'Spanish': {
      title: 'Ajustes', general: 'GENERAL', account: 'Cuenta', privacy: 'Privacidad', lang: 'Idioma', dark: 'Modo Oscuro',
      assistant: 'ASISTENTE AI', logout: 'Cerrar Sesión', edit_p: 'Editar Perfil', save: 'GUARDAR', cancel: 'CANCELAR',
      visibility: 'VISIBILIDAD', p_vis: 'Visibilidad del Perfil', act_stat: 'Estado de Actividad', clear: 'Borrar Historial',
      name: 'Tu Nombre', email: 'Tu Email', select_l: 'Seleccionar Idioma', ai_engine: 'Motor Hyper-Tech',
      ai_desc: 'Personaliza tu persona de IA', resp_style: 'ESTILO DE RESPUESTA', voice_model: 'MODELO DE VOZ', creative: 'Creativo', energetic: 'Enérgico'
    },
    'French': {
      title: 'Paramètres', general: 'GÉNÉRAL', account: 'Compte', privacy: 'Confidentialité', lang: 'Langue', dark: 'Mode Sombre',
      assistant: 'ASSISTANT IA', logout: 'Déconnexion', edit_p: 'Modifier le Profil', save: 'ENREGISTRER', cancel: 'ANNULER',
      visibility: 'VISIBILITÉ', p_vis: 'Visibilité du Profil', act_stat: 'Statut d\'Activité', clear: 'Effacer l\'Historique',
      name: 'Votre Nom', email: 'Votre E-mail', select_l: 'Choisir la Langue', ai_engine: 'Moteur Hyper-Tech',
      ai_desc: 'Personnalisez votre persona IA', resp_style: 'STYLE DE RÉPONSE', voice_model: 'MODÈLE DE VOIX', creative: 'Créatif', energetic: 'Énergique'
    },
    'Chinese': {
      title: '设置', general: '通用', account: '账户', privacy: '隐私', lang: '语言', dark: '深色模式',
      assistant: 'AI 助手', logout: '退出登录', edit_p: '编辑个人资料', save: '保存', cancel: '取消',
      visibility: '可见性', p_vis: '个人资料可见性', act_stat: '活动状态', clear: '清除历史记录',
      name: '您的姓名', email: '您的邮箱', select_l: '选择语言', ai_engine: '超级技术引擎',
      ai_desc: '自定义您的 AI 角色', resp_style: '回复风格', voice_model: '声音模型', creative: '创造性', energetic: '充满活力'
    }
  };

  ui: any = this.translations['English (US)'];

  constructor(
    private router: Router,
    public global: Globall
  ) {
    addIcons({
      personOutline,
      lockClosedOutline,
      languageOutline,
      moonOutline,
      apertureOutline,
      logOutOutline,
      homeOutline,
      searchOutline,
      notificationsOutline,
      settings,
      chatbubblesOutline,
      checkmarkCircle,
      cameraOutline,
      trashOutline
    });
  }

  // ================= INIT =================
  ngOnInit() {
    // 👤 USER DATA
    this.global.currentUser.subscribe((user: any) => {
      if (user) {
        this.userName = user.name;
        this.userEmail = user.email;
        this.profileImage = user.image;
      }
    });

    // 🌙 THEME
    this.global.theme$.subscribe((theme: boolean) => {
      this.isDarkMode = theme;
    });

    // 🌐 LANGUAGE SYNC
    this.global.lang$.subscribe((lang: string) => {
      this.selectedLanguage = lang;
      this.updateContent();
    });
  }

  // ================= LANGUAGE =================
  updateContent() {
    this.ui = this.translations[this.selectedLanguage] || this.translations['English (US)'];
    
    const isRtl = this.selectedLanguage === 'Urdu' || this.selectedLanguage === 'Arabic';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }

  confirmLanguage() {
    this.selectedLanguage = this.tempLanguage;
    this.global.setLanguage(this.selectedLanguage);
    this.isModalOpen = false;
  }

  languageChanged(ev: any) {
    this.tempLanguage = ev.detail.value;
  }

  // ================= PROFILE =================
  async changeProfilePic() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt
      });

      if (image.webPath) {
        this.profileImage = image.webPath;
        this.global.setUser({ image: image.webPath });
      }
    } catch (e) {
      console.log(e);
    }
  }

  saveProfile() {
    this.userName = this.tempName;
    this.userEmail = this.tempEmail;

    this.global.setUser({
      name: this.userName,
      email: this.userEmail
    });

    this.isAccountModalOpen = false;
    this.showToast = true;
  }

  // ================= THEME =================
  toggleTheme(ev: any) {
    this.isDarkMode = ev.detail.checked;
    this.global.setTheme(this.isDarkMode);
  }

  // ================= MODALS =================
  setOpen(val: boolean) {
    this.isModalOpen = val;
    if (val) {
      this.tempLanguage = this.selectedLanguage;
    }
  }

  setAccountOpen(val: boolean) {
    this.isAccountModalOpen = val;
    if (val) {
      this.tempName = this.userName;
      this.tempEmail = this.userEmail;
    }
  }

  setPrivacyOpen(val: boolean) {
    this.isPrivacyModalOpen = val;
  }

  // ================= FOOTER NAV =================
  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'Home') {
      this.router.navigate(['/homefeed']);
    } else if (tab === 'Search') {
      this.router.navigate(['/explore']);
    } else if (tab === 'Notify') {
      this.router.navigate(['/chatsystem']);
    } else if (tab === 'Chat') {
      this.router.navigate(['/chat']);
    } else if (tab === 'Settings') {
      this.router.navigate(['/userprofile']);
    }
  }
}
