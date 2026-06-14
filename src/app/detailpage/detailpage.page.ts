import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButtons, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Globall } from '../globall';

@Component({
  selector: 'app-detailpage',
  templateUrl: './detailpage.page.html',
  styleUrls: ['./detailpage.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButtons, IonButton, IonIcon,
    CommonModule, FormsModule
  ]
})
export class DetailpagePage implements OnInit {

  private base   = 'http://127.0.0.1:8000/api';
  private userId = 1; // baad mein login se lena

  post: any;
  likesCount = 0;
  isLiked    = false;
  viewsCount = 0;

  currentUser: any;
  currentLang = 'English (US)';
  ui: any = {};

  translations: any = {
    'English (US)': {
      title: 'Art Details', likes: 'Likes', views: 'Views',
      gen_details: 'Generation Details',
      gen_desc: 'is dynamically loaded from AI collection.',
      download: 'DOWNLOAD TO GALLERY'
    },
    'Urdu': {
      title: 'آرٹ تفصیلات', likes: 'لائکس', views: 'ویوز',
      gen_details: 'تخلیق کی تفصیلات',
      gen_desc: 'AI مجموعے سے حاصل کیا گیا ہے۔',
      download: 'گیلری میں محفوظ کریں'
    },
    'Arabic': {
      title: 'تفاصيل الفن', likes: 'إعجابات', views: 'مشاهدات',
      gen_details: 'تفاصيل التوليد',
      gen_desc: 'تم تحميله ديناميكيًا من مجموعة الذكاء الاصطناعي.',
      download: 'تحميل إلى المعرض'
    },
    'Spanish': {
      title: 'Detalles del Arte', likes: 'Me gusta', views: 'Vistas',
      gen_details: 'Detalles de Generación',
      gen_desc: 'se carga dinámicamente desde la colección de IA.',
      download: 'DESCARGAR A GALERÍA'
    },
    'French': {
      title: 'Détails de l\'Art', likes: 'J\'aime', views: 'Vues',
      gen_details: 'Détails de Génération',
      gen_desc: 'est chargé dynamiquement depuis la collection IA.',
      download: 'TÉLÉCHARGER DANS LA GALERIE'
    },
    'Chinese': {
      title: '艺术详情', likes: '点赞', views: '浏览',
      gen_details: '生成详情',
      gen_desc: '从 AI 集合动态加载。',
      download: '下载到相册'
    }
  };

  constructor(
    private router: Router,
    private global: Globall,
    private http:   HttpClient
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.post = navigation.extras.state['data'];
    }
    this.currentUser = this.global.getUser();
  }

  ngOnInit() {
    this.global.currentUser.subscribe((user: any) => {
      this.currentUser = user;
    });

    this.global.lang$.subscribe((lang: string) => {
      this.currentLang = lang;
      this.ui = this.translations[lang] || this.translations['English (US)'];
      const isRtl = lang === 'Urdu' || lang === 'Arabic';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    });

    if (this.post?.id) {
      this.loadLikesCount();
      this.checkLikeStatus();
      this.loadViewsCount();
      this.saveView();
    }
  }

  // ── Likes count ──
  loadLikesCount() {
    this.http.get<any>(`${this.base}/detail/likes/${this.post.id}/`).subscribe({
      next: (res) => this.likesCount = res.likes
    });
  }

  // ── Like status ──
  checkLikeStatus() {
    this.http.get<any>(
      `${this.base}/detail/like/${this.userId}/${this.post.id}/`
    ).subscribe({
      next: (res) => this.isLiked = res.liked
    });
  }

  // ── Views count ──
  loadViewsCount() {
    this.http.get<any>(`${this.base}/detail/views/${this.post.id}/`).subscribe({
      next: (res) => this.viewsCount = res.views
    });
  }

  // ── View save ──
  saveView() {
    this.http.post(`${this.base}/detail/view/`, {
      user_id:   this.userId,
      post_id:   this.post.id,
      post_type: 'explore'
    }).subscribe();
  }

  // ── Like toggle ──
  toggleLike() {
    this.http.post<any>(`${this.base}/detail/like/`, {
      user_id:   this.userId,
      post_id:   this.post.id,
      post_type: 'explore'
    }).subscribe({
      next: (res) => {
        this.isLiked = res.liked;
        if (res.liked) {
          this.likesCount++;
        } else {
          this.likesCount--;
        }
      }
    });
  }

  // ── Back ──
  goBack() {
    window.history.back();
  }

  // ── Download ──
  downloadImage() {
    if (!this.post?.img) return;
    const link      = document.createElement('a');
    link.href       = this.post.img;
    link.download   = `${this.post.title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ── Share ──
  async sharePost() {
    if (navigator.share) {
      await navigator.share({
        title: this.post?.title,
        text:  this.post?.title,
        url:   this.post?.img
      });
    }
  }

  // ── Update username ──
  updateUserName() {
    this.global.setUser({ name: 'User from Detail Page 🔥' });
  }
}