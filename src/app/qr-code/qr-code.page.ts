import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';

import { addIcons } from 'ionicons';
import { scanOutline, linkOutline, shareOutline, logoTiktok } from 'ionicons/icons';

import { Globall } from '../globall';

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.page.html',
  styleUrls: ['./qr-code.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class QrCodePage implements OnInit {

  // ================= USER =================
  userName: string = '';
  profileImage: string = '';
  profileLink: string = '';

  // ================= LANGUAGE =================
  currentLang = 'English (US)';
  ui: any = {};

  // ================= TRANSLATIONS =================
  translations: any = {
    'English (US)': {
      copy_link: 'Copy link',
      share_link: 'Share link',
      footer_text: 'Tap background to change style',
      toast_copied: 'Link copied to clipboard!',
      share_title: 'Follow me',
      share_text: 'Check out my profile'
    },
    'Urdu': {
      copy_link: 'لنک کاپی کریں',
      share_link: 'لنک شیئر کریں',
      footer_text: 'اسٹائل بدلنے کے لیے پس منظر پر ٹیپ کریں',
      toast_copied: 'لنک کلپ بورڈ پر کاپی ہو گیا!',
      share_title: 'مجھے فالو کریں',
      share_text: 'میری پروفائل دیکھیں'
    },
    'Arabic': {
      copy_link: 'نسخ الرابط',
      share_link: 'مشاركة الرابط',
      footer_text: 'اضغط على الخلفية لتغيير النمط',
      toast_copied: 'تم نسخ الرابط إلى الحافظة!',
      share_title: 'تابعني',
      share_text: 'تحقق من ملفي الشخصي'
    },
    'Spanish': {
      copy_link: 'Copiar enlace',
      share_link: 'Compartir enlace',
      footer_text: 'Toca el fondo para cambiar el estilo',
      toast_copied: '¡Enlace copiado al portapapeles!',
      share_title: 'Sígueme',
      share_text: 'Mira mi perfil'
    },
    'French': {
      copy_link: 'Copier le lien',
      share_link: 'Partager le lien',
      footer_text: 'Appuyez sur le fond pour changer le style',
      toast_copied: 'Lien copié dans le presse-papiers !',
      share_title: 'Suivez-moi',
      share_text: 'Consultez mon profil'
    },
    'Chinese': {
      copy_link: '复制链接',
      share_link: '分享链接',
      footer_text: '点击背景更改样式',
      toast_copied: '链接已复制到剪贴板！',
      share_title: '关注我',
      share_text: '查看我的个人资料'
    }
  };

  constructor(
    private global: Globall,
    private toastCtrl: ToastController
  ) {
    addIcons({ scanOutline, linkOutline, shareOutline, logoTiktok });
  }

  // ================= INIT =================
  ngOnInit() {
    // 👤 USER SYNC
    this.global.currentUser.subscribe((data: any) => {
      if (data) {
        this.userName     = data.name;
        this.profileImage = data.image;

        const cleanName = this.userName
          .replace(/[^\x00-\x7F]/g, '')
          .replace(/\s+/g, '')
          .toLowerCase();

        this.profileLink = `https://tiktok.com@${cleanName}`;
      }
    });

    // 🌐 LANGUAGE SYNC
    this.global.lang$.subscribe((lang: string) => {
      this.currentLang = lang;
      this.ui = this.translations[lang] || this.translations['English (US)'];

      const isRtl = lang === 'Urdu' || lang === 'Arabic';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    });
  }

  // ================= COPY LINK =================
  async copyLink() {
    const el = document.createElement('textarea');
    el.value = this.profileLink;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    const toast = await this.toastCtrl.create({
      message: this.ui?.toast_copied || 'Link copied to clipboard!',
      duration: 2000,
      color: 'dark'
    });
    toast.present();
  }

  // ================= SHARE LINK =================
  async shareLink() {
    if (navigator.share) {
      await navigator.share({
        title: this.ui?.share_title || 'Follow me',
        text: `${this.ui?.share_text || 'Check out my profile'}: ${this.userName}`,
        url: this.profileLink,
      });
    } else {
      this.copyLink();
    }
  }

  // ================= QR URL =================
  getSafeQRUrl() {
    const cleanName = encodeURIComponent(
      this.userName.replace(/[^\x00-\x7F]/g, '').trim()
    );
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://tiktok.com@${cleanName}`;
  }
}