import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem,
  IonLabel, IonAvatar, IonIcon, IonButton, IonButtons, IonMenuButton,
  IonModal, IonInput, IonSelect, IonSelectOption, IonBadge, IonToast,
  IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, personOutline, settingsOutline, logOutOutline,
  bookmarkOutline, bookmark, notificationsOutline, notificationsOffOutline,
  chatbubbleEllipsesOutline, chatbubbleOutline, chatbubblesOutline,
  searchOutline, heartOutline, heart, shareSocialOutline, ellipsisVertical,
  add, home, timeOutline, trendingUpOutline, optionsOutline, arrowForwardOutline,
  hardwareChipOutline, paperPlane, copyOutline, thumbsDownOutline, thumbsUpOutline,
  ribbon, ribbonOutline, createOutline, codeSlashOutline, sparklesOutline,
  compassOutline, closeOutline, linkOutline, peopleOutline, chevronForwardOutline,
  documentTextOutline, checkmarkCircleOutline, trashOutline, shieldOutline,
  banOutline, eyeOutline, imageOutline
} from 'ionicons/icons';
import { Globall } from '../globall';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.page.html',
  styleUrls: ['./admin-panel.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem,
    IonLabel, IonAvatar, IonIcon, IonButton, IonButtons, IonMenuButton,
    IonModal, IonInput, IonSelect, IonSelectOption, IonBadge, IonToast,
    IonSearchbar, CommonModule, FormsModule
  ]
})
export class AdminPanelPage implements OnInit {

  private base = 'http://127.0.0.1:8000/api';

  ui: any;
  isRtl = false;

  showAllUsersModal      = false;
  showEditModal          = false;
  showReportDetailModal  = false;

  showToast  = false;
  toastMsg   = '';
  toastColor = 'success';

  editingUser: any = null;
  editName    = '';
  editEmail   = '';
  editStatus  = 'active';

  userSearchQuery = '';
  selectedReport: any = null;

  allUsers: any[] = [];
  reports:  any[] = [];

  get filteredUsers() {
    const q = this.userSearchQuery.toLowerCase();
    if (!q) return this.allUsers;
    return this.allUsers.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  get pendingReports() {
    return this.reports.filter(r => r.status === 'pending');
  }

  get previewUsers() {
    return this.allUsers.slice(0, 3);
  }

  translations: any = {
    'English (US)': {
      title: 'Admin Control', welcome_title: 'VibeNet AI Analytics',
      welcome_desc: 'Real-time overview of platform performance.',
      total_users: 'TOTAL USERS', daily_posts: 'DAILY ACTIVE POSTS', ai_efficiency: 'AI EFFICIENCY',
      optimized: 'Optimized', growth_title: 'User Growth Trends',
      ai_focus: 'AI Focus Areas', image_analysis: 'Image Analysis', nlp: 'NLP Moderation', fraud: 'Fraud Detection',
      ai_insights: 'AI Insights', ai_insight_text: 'Efficiency rose by 12% following the v2.4 model update.',
      user_mgmt: 'User Management', view_all: 'View All', reported: 'Reported Content',
      keep: 'Keep', remove: 'Remove', edit: 'Edit', save: 'Save', cancel: 'Cancel',
      search_users: 'Search users...', status: 'Status', joined: 'Joined', posts: 'Posts',
      active: 'Active', suspended: 'Suspended', banned: 'Banned',
      edit_user: 'Edit User', full_name: 'Full Name', email: 'Email',
      report_detail: 'Report Detail', ai_confidence: 'AI Flag',
      kept_msg: 'Content approved and flag cleared.',
      removed_msg: 'Content removed from platform.',
      saved_msg: 'User profile updated successfully.',
      all_users: 'All Users', new_reports: 'New', ago: 'ago', view_detail: 'View Detail',
    },
    'Urdu': {
      title: 'ایڈمن کنٹرول', welcome_title: 'وائب نیٹ اے آئی تجزیات',
      welcome_desc: 'پلیٹ فارم کی کارکردگی کا ریئل ٹائم جائزہ۔',
      total_users: 'کل صارفین', daily_posts: 'روزانہ فعال پوسٹس', ai_efficiency: 'اے آئی کارکردگی',
      optimized: 'بہتر بنایا', growth_title: 'صارف نمو کے رجحانات',
      ai_focus: 'اے آئی فوکس علاقے', image_analysis: 'تصویر تجزیہ', nlp: 'این ایل پی', fraud: 'دھوکہ پتہ',
      ai_insights: 'اے آئی بصیرت', ai_insight_text: 'کارکردگی 12% بڑھی۔',
      user_mgmt: 'صارف انتظام', view_all: 'سب دیکھیں', reported: 'رپورٹ شدہ مواد',
      keep: 'رکھیں', remove: 'ہٹائیں', edit: 'ترمیم', save: 'محفوظ', cancel: 'منسوخ',
      search_users: 'صارفین تلاش کریں...', status: 'حیثیت', joined: 'شامل ہوا', posts: 'پوسٹس',
      active: 'فعال', suspended: 'معطل', banned: 'ممنوع',
      edit_user: 'صارف ترمیم', full_name: 'پورا نام', email: 'ای میل',
      report_detail: 'رپورٹ تفصیل', ai_confidence: 'اے آئی فلیگ',
      kept_msg: 'مواد منظور۔', removed_msg: 'مواد ہٹا دیا۔',
      saved_msg: 'پروفائل اپڈیٹ ہوا۔', all_users: 'تمام صارفین',
      new_reports: 'نئے', ago: 'پہلے', view_detail: 'تفصیل دیکھیں',
    },
  };

  constructor(
    private global: Globall,
    private http:   HttpClient
  ) {
    addIcons({
      homeOutline, personOutline, settingsOutline, logOutOutline,
      bookmarkOutline, bookmark, notificationsOutline, notificationsOffOutline,
      chatbubbleEllipsesOutline, chatbubbleOutline, chatbubblesOutline,
      searchOutline, heartOutline, heart, shareSocialOutline, ellipsisVertical,
      add, home, timeOutline, trendingUpOutline, optionsOutline, arrowForwardOutline,
      hardwareChipOutline, paperPlane, copyOutline, thumbsDownOutline, thumbsUpOutline,
      ribbon, ribbonOutline, createOutline, codeSlashOutline, sparklesOutline,
      compassOutline, closeOutline, linkOutline, peopleOutline, chevronForwardOutline,
      documentTextOutline, checkmarkCircleOutline, trashOutline, shieldOutline,
      banOutline, eyeOutline, imageOutline
    });
  }

  ngOnInit() {
    this.global.lang$.subscribe((lang: string) => {
      this.ui    = this.translations[lang] || this.translations['English (US)'];
      this.isRtl = lang === 'Urdu' || lang === 'Arabic';
      document.documentElement.dir = this.isRtl ? 'rtl' : 'ltr';
    });

    this.loadUsers();
    this.loadReports();
  }

  // ── Load Users ──
  loadUsers() {
    this.http.get<any[]>(`${this.base}/admin-users/`).subscribe({
      next: (data) => this.allUsers = data,
      error: () => {
        // fallback mock data
        this.allUsers = [
          { id: 1, name: 'Alex Murphy',  email: 'alex.m@vibenet.ai',  initials: 'AM', color: 'gray',   status: 'active',    joined: 'Jan 12, 2024', posts: 142 },
          { id: 2, name: 'Sarah Chen',   email: 'sarah.c@vibenet.ai', initials: 'SC', color: 'orange', status: 'active',    joined: 'Feb 3, 2024',  posts: 89  },
          { id: 3, name: 'James Wu',     email: 'j.wu@vibenet.ai',    initials: 'JW', color: 'gray',   status: 'active',    joined: 'Mar 7, 2024',  posts: 201 },
          { id: 4, name: 'Priya Sharma', email: 'priya.s@vibenet.ai', initials: 'PS', color: 'orange', status: 'suspended', joined: 'Apr 1, 2024',  posts: 34  },
        ];
      }
    });
  }

  // ── Load Reports ──
  loadReports() {
    this.http.get<any[]>(`${this.base}/admin-reports/?status=pending`).subscribe({
      next: (data) => this.reports = data,
      error: () => {
        // fallback mock data
        this.reports = [
          { id: 1, type: 'image', title: 'Flagged: Potential Misinfo',  desc: 'Post ID: #VX-9028-11', status: 'pending', detail: 'Misleading information. AI confidence: 87%.' },
          { id: 2, type: 'doc',   title: 'Flagged: Policy Violation',   desc: 'Toxicity threshold exceeded', status: 'pending', detail: 'Harmful language detected. Score: 0.91.' },
        ];
      }
    });
  }

  // ── User Management ──
  openAllUsers() { this.showAllUsersModal = true; }
  closeAllUsers() { this.showAllUsersModal = false; }

  openEdit(user: any) {
    this.editingUser = { ...user };
    this.editName    = user.name;
    this.editEmail   = user.email;
    this.editStatus  = user.status;
    this.showEditModal = true;
  }

  saveEdit() {
    this.http.patch(`${this.base}/admin-users/${this.editingUser.id}/`, {
      name:   this.editName,
      email:  this.editEmail,
      status: this.editStatus,
    }).subscribe({
      next: () => {
        const idx = this.allUsers.findIndex(u => u.id === this.editingUser.id);
        if (idx > -1) {
          this.allUsers[idx].name   = this.editName;
          this.allUsers[idx].email  = this.editEmail;
          this.allUsers[idx].status = this.editStatus;
        }
        this.showEditModal = false;
        this.toast(this.ui?.saved_msg, 'success');
      }
    });
  }

  // ── Reports ──
  openReportDetail(report: any) {
    this.selectedReport       = report;
    this.showReportDetailModal = true;
  }

  keepContent(report: any) {
    this.http.patch(`${this.base}/admin-reports/${report.id}/`, {
      status: 'kept'
    }).subscribe(() => {
      this.reports = this.reports.filter(r => r.id !== report.id);
      this.showReportDetailModal = false;
      this.toast(this.ui?.kept_msg, 'success');
    });
  }

  removeContent(report: any) {
    this.http.patch(`${this.base}/admin-reports/${report.id}/`, {
      status: 'removed'
    }).subscribe(() => {
      this.reports = this.reports.filter(r => r.id !== report.id);
      this.showReportDetailModal = false;
      this.toast(this.ui?.removed_msg, 'danger');
    });
  }

  // ── Toast ──
  toast(msg: string, color: string = 'success') {
    this.toastMsg   = msg;
    this.toastColor = color;
    this.showToast  = true;
  }

  getStatusColor(status: string) {
    if (status === 'active')    return '#22c55e';
    if (status === 'suspended') return '#f59e0b';
    if (status === 'banned')    return '#ef4444';
    return '#999';
  }
}