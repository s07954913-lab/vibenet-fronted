import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonBackButton, IonIcon, IonGrid,
  IonRow, IonCol, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, trendingUpOutline, analyticsOutline,
  peopleOutline, flashOutline, starOutline
} from 'ionicons/icons';
import { Globall } from '../globall';

@Component({
  selector: 'app-analytics-reports',
  templateUrl: './analytics-reports.page.html',
  styleUrls: ['./analytics-reports.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButtons, IonBackButton, IonIcon, IonGrid,
    IonRow, IonCol, IonCard, IonCardContent,
    CommonModule, FormsModule
  ]
})
export class AnalyticsReportsPage implements OnInit {

  private base   = 'http://127.0.0.1:8000/api';
  private userId = 1; // baad mein login se lena

  currentLang = 'English (US)';
  ui: any;

  // ── Analytics Data ──
  analytics = {
    new_followers: 0,
    engage_rate:   0.0,
    weekly_growth: 0.0,
    performance:   0.0,
    mon: 0, tue: 0, wed: 0, thu: 0, fri: 0,
  };

  get chartBars() {
    return [
      this.analytics.mon,
      this.analytics.tue,
      this.analytics.wed,
      this.analytics.thu,
      this.analytics.fri,
    ];
  }

  get maxBar() {
    return Math.max(...this.chartBars, 1);
  }

  translations: any = {
    'English (US)': {
      title: 'Detailed Report',
      ai_label: 'AI PERFORMANCE SUMMARY',
      ai_heading: 'Excellent!',
      ai_desc: 'Your profile is performing 45% better than last week.',
      followers: 'New Followers',
      engage: 'Engage Rate',
      weekly: 'Weekly Growth',
      days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      tip_title: 'AI Next Move',
      tip_desc: 'Post a "Behind the scenes" video tomorrow at 6 PM.'
    },
    'Urdu': {
      title: 'تفصیلی رپورٹ',
      ai_label: 'AI پرفارمنس خلاصہ',
      ai_heading: 'شاندار!',
      ai_desc: 'آپ کا پروفائل گزشتہ ہفتے سے 45% بہتر کارکردگی دکھا رہا ہے۔',
      followers: 'نئے فالوورز',
      engage: 'انگیجمنٹ ریٹ',
      weekly: 'ہفتہ وار ترقی',
      days: ['پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ'],
      tip_title: 'AI اگلا قدم',
      tip_desc: 'کل شام 6 بجے ویڈیو پوسٹ کریں۔'
    },
    'Arabic': {
      title: 'تقرير مفصل',
      ai_label: 'ملخص أداء الذكاء الاصطناعي',
      ai_heading: 'ممتاز!',
      ai_desc: 'ملفك الشخصي يؤدي أداءً أفضل بنسبة 45٪.',
      followers: 'متابعون جدد',
      engage: 'معدل التفاعل',
      weekly: 'النمو الأسبوعي',
      days: ['الإث', 'الثلا', 'الأرب', 'الخمي', 'الجمع'],
      tip_title: 'الخطوة التالية',
      tip_desc: 'انشر مقطع غداً الساعة 6 مساءً.'
    },
    'Spanish': {
      title: 'Informe Detallado',
      ai_label: 'RESUMEN DE RENDIMIENTO IA',
      ai_heading: '¡Excelente!',
      ai_desc: 'Tu perfil está rindiendo un 45% mejor.',
      followers: 'Nuevos Seguidores',
      engage: 'Tasa de Interacción',
      weekly: 'Crecimiento Semanal',
      days: ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'],
      tip_title: 'Próximo Movimiento IA',
      tip_desc: 'Publica un video mañana a las 6 PM.'
    },
    'French': {
      title: 'Rapport Détaillé',
      ai_label: 'RÉSUMÉ DES PERFORMANCES IA',
      ai_heading: 'Excellent !',
      ai_desc: 'Votre profil performe 45% mieux que la semaine dernière.',
      followers: 'Nouveaux Abonnés',
      engage: 'Taux d\'Engagement',
      weekly: 'Croissance Hebdomadaire',
      days: ['LUN', 'MAR', 'MER', 'JEU', 'VEN'],
      tip_title: 'Prochain Mouvement IA',
      tip_desc: 'Publiez une vidéo demain à 18h.'
    },
    'Chinese': {
      title: '详细报告',
      ai_label: 'AI 性能摘要',
      ai_heading: '优秀！',
      ai_desc: '您的个人资料比上周表现好 45%。',
      followers: '新关注者',
      engage: '互动率',
      weekly: '每周增长',
      days: ['周一', '周二', '周三', '周四', '周五'],
      tip_title: 'AI 下一步',
      tip_desc: '明天下午 6 点发布视频。'
    }
  };

  constructor(
    private global: Globall,
    private http:   HttpClient
  ) {
    addIcons({
      'arrow-back-outline':  arrowBackOutline,
      'trending-up-outline': trendingUpOutline,
      'analytics-outline':   analyticsOutline,
      'people-outline':      peopleOutline,
      'flash-outline':       flashOutline,
      'star-outline':        starOutline
    });
  }

  ngOnInit() {
    this.global.lang$.subscribe((lang: string) => {
      this.currentLang = lang;
      this.ui = this.translations[lang] || this.translations['English (US)'];
      const isRtl = lang === 'Urdu' || lang === 'Arabic';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    });

    this.loadAnalytics();
  }

  loadAnalytics() {
    this.http.get<any>(`${this.base}/analytics/${this.userId}/`).subscribe({
      next: (data) => {
        this.analytics = {
          new_followers: data.new_followers || 0,
          engage_rate:   data.engage_rate   || 0.0,
          weekly_growth: data.weekly_growth || 0.0,
          performance:   data.performance   || 0.0,
          mon: data.mon || 0,
          tue: data.tue || 0,
          wed: data.wed || 0,
          thu: data.thu || 0,
          fri: data.fri || 0,
        };
      }
    });
  }
}