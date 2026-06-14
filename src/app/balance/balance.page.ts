import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline, caretDown, chevronForward, chevronBack,
  chevronForwardOutline, chevronBackOutline, chevronUpOutline, chevronDownOutline,
  arrowForward, arrowDownOutline, arrowUpOutline, addCircleOutline,
  gift, cashOutline, barChartOutline, helpCircleOutline, closeOutline,
  receiptOutline, walletOutline, timeOutline, eyeOutline,
  notificationsOutline, notificationsOffOutline, warningOutline,
  trendingUpOutline, trendingDownOutline, alertCircleOutline,
  checkmarkDoneOutline, removeCircleOutline, checkmarkCircleOutline
} from 'ionicons/icons';

import { Globall } from '../globall';

export interface Transaction      { id: string; type: 'credit' | 'debit'; amount: number; description: string; date: string; status: 'completed' | 'pending' | 'failed'; currency?: string; }
export interface RechargePackage  { emoji: string; label: string; amount: number; bonusCoins: number; }
export interface CurrencyOption   { code: string; symbol: string; label: string; rate: number; }
export interface CoinLog          { id: string; type: 'earned' | 'spent'; coins: number; description: string; date: string; }
export interface TransactionAlert { id: string; type: 'credit' | 'debit' | 'warning'; title: string; message: string; time: string; read: boolean; }
export interface BarHistory       { height: number; positive: boolean; label: string; }
export interface MonthStat        { month: string; amount: number; percent: number; isCurrentMonth: boolean; }
export interface TopSource        { name: string; icon: string; color: string; percent: number; }

@Component({
  selector: 'app-balance',
  templateUrl: './balance.page.html',
  styleUrls: ['./balance.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class BalancePage implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private base      = 'http://127.0.0.1:8000/api';
  private userId    = 1; // baad mein login se lena

  // ── Balance ──
  estimatedBalanceUSD  = 0;
  totalCoins           = 0;
  lowBalanceThreshold  = 5;

  // ── Currency ──
  currency         = 'USD';
  showCurrencyMenu = false;
  currencyList: CurrencyOption[] = [
    { code: 'USD', symbol: '$',  label: 'US Dollar',      rate: 1    },
    { code: 'PKR', symbol: '₨', label: 'Pakistani Rupee', rate: 278  },
    { code: 'EUR', symbol: '€',  label: 'Euro',            rate: 0.92 },
    { code: 'GBP', symbol: '£',  label: 'British Pound',   rate: 0.79 },
  ];

  get currentRate():     number { return this.currencyList.find(c => c.code === this.currency)?.rate ?? 1; }
  get currencySymbol():  string { return this.currencyList.find(c => c.code === this.currency)?.symbol ?? '$'; }
  get convertedBalance():number { return this.estimatedBalanceUSD * this.currentRate; }

  // ── Analytics ──
  balanceHistory: BarHistory[] = [];
  showAnalytics  = false;
  monthlyStats:  MonthStat[]   = [];
  topSources:    TopSource[]   = [];

  // ── Transactions ──
  allTransactions:      Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  searchQuery      = '';
  activeFilter     = 'all';
  activeDateRange  = 'all';
  currentPage      = 1;
  pageSize         = 8;

  transactionFilters = [
    { label: 'All',     value: 'all',    icon: 'list-outline'         },
    { label: 'Income',  value: 'credit', icon: 'trending-up-outline'  },
    { label: 'Expense', value: 'debit',  icon: 'trending-down-outline' },
  ];

  dateRanges = [
    { label: 'All',        value: 'all'   },
    { label: 'Today',      value: 'today' },
    { label: 'This Week',  value: 'week'  },
    { label: 'This Month', value: 'month' },
  ];

  get paginatedTransactions(): Transaction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTransactions.slice(start, start + this.pageSize);
  }
  get totalPages(): number {
    return Math.ceil(this.filteredTransactions.length / this.pageSize);
  }

  // ── Modals ──
  showTxDetailModal      = false;
  selectedTransaction: Transaction | null = null;
  showRechargeModal      = false;
  selectedPackage: RechargePackage | null = null;
  rechargePaymentMethod  = 'wallet';
  rechargePackages: RechargePackage[] = [
    { emoji: '🥉', label: '$1',  amount: 1,  bonusCoins: 10  },
    { emoji: '🥈', label: '$5',  amount: 5,  bonusCoins: 60  },
    { emoji: '🥇', label: '$10', amount: 10, bonusCoins: 130 },
    { emoji: '💎', label: '$20', amount: 20, bonusCoins: 280 },
  ];

  showWithdrawModal      = false;
  withdrawAmount: number | null = null;
  withdrawAmountUSD      = 0;
  selectedPaymentMethod  = 'easypaisa';
  showCoinHistoryModal   = false;
  coinHistory: CoinLog[] = [];
  showNotificationsModal = false;
  alertsEnabled          = true;
  transactionAlerts: TransactionAlert[] = [];

  get unreadAlerts(): number {
    return this.transactionAlerts.filter(a => !a.read).length;
  }

  isLoading     = false;
  isProcessing  = false;

  // ── Language ──
  ui: any;
  currentLang = 'English (US)';

  translations: any = {
    'English (US)': {
      title: 'Balance', secure: 'Secure', estimated_bal: 'Estimated balance', trend_30day: '30-day trend',
      coins_label: 'Coins', get_coins: 'Get Coins', low_bal_warning: 'Low balance! Recharge karo abhi.',
      recharge: 'Recharge', withdraw: 'Withdraw', coin_log: 'Coin Log', monthly_earnings: 'Monthly Earnings',
      show: 'Show', hide: 'Hide', top_sources_title: 'Top Earning Sources', tx_history: 'Transactions',
      view_all: 'View all', search_placeholder: 'Search transaction...', loading: 'Loading...',
      empty_tx: 'No transactions found', empty_tx_sub: 'Change filter and try again',
      filter_all: 'All', filter_income: 'Income', filter_expense: 'Expense',
      dr_all: 'All', dr_today: 'Today', dr_week: 'This Week', dr_month: 'This Month',
      status_completed: 'Completed', status_pending: 'Pending', status_failed: 'Failed',
      src_referrals: 'Referrals', src_rewards: 'Content Rewards',
      m_mar: 'Mar', m_apr: 'Apr', m_may: 'May',
      recharge_title: 'Recharge / Top-up', package_choose: 'Choose package!',
      payment_method: 'Payment Method', proceed: 'Proceed Payment',
      withdraw_title: 'Withdraw Earnings', enter_amount: 'Enter amount in USD',
      coin_history_title: 'Coin Logs History', alert_title: 'Notifications / Alerts'
    },
    'Urdu': {
      title: 'بیلنس', secure: 'محفوظ', estimated_bal: 'اندازہ شدہ بیلنس', trend_30day: '30 دن کا ٹرینڈ',
      coins_label: 'کوائنز', get_coins: 'کوائنز حاصل کریں', low_bal_warning: 'بیلنس کم ہے! ابھی ریچارج کریں۔',
      recharge: 'ریچارج', withdraw: 'رقم نکالیں', coin_log: 'کوائن لاگ', monthly_earnings: 'ماہانہ آمدنی',
      show: 'دیکھیں', hide: 'چھپائیں', top_sources_title: 'آمدنی کے اہم ذرائع', tx_history: 'لین دین',
      view_all: 'سب دیکھیں', search_placeholder: 'لین دین ڈھونڈیں...', loading: 'لوڈ ہو رہا ہے...',
      empty_tx: 'کوئی لین دین نہیں ملا', empty_tx_sub: 'فلٹر تبدیل کریں',
      filter_all: 'سب', filter_income: 'آمدنی', filter_expense: 'اخراجات',
      dr_all: 'سب', dr_today: 'آج', dr_week: 'اس ہفتے', dr_month: 'اس مہینے',
      status_completed: 'مکمل', status_pending: 'زیر التوا', status_failed: 'ناکام',
      src_referrals: 'ریفرلز', src_rewards: 'مواد کے انعامات',
      m_mar: 'مارچ', m_apr: 'اپریل', m_may: 'مئی',
      recharge_title: 'ریچارج / ٹاپ اپ', package_choose: 'پیکج منتخب کریں!',
      payment_method: 'ادائیگی کا طریقہ', proceed: 'ادائیگی جاری رکھیں',
      withdraw_title: 'رقم نکلوانا', enter_amount: 'رقم USD میں درج کریں',
      coin_history_title: 'کوائن لاگ کی تفصیلات', alert_title: 'اطلاعات / الرٹس'
    },
    'Arabic': {
      title: 'الرصيد', secure: 'آمن', estimated_bal: 'الرصيد التقديري', trend_30day: 'اتجاه 30 يومًا',
      coins_label: 'عملات', get_coins: 'احصل على عملات', low_bal_warning: 'الرصيد منخفض! اشحن الآن.',
      recharge: 'إعادة الشحن', withdraw: 'سحب', coin_log: 'سجل العملات', monthly_earnings: 'الأرباح الشهرية',
      show: 'عرض', hide: 'إخفاء', top_sources_title: 'مصادر الكسب العلوية', tx_history: 'المعاملات',
      view_all: 'عرض الكل', search_placeholder: 'ابحث عن معاملة...', loading: 'جاري التحميل...',
      empty_tx: 'لم يتم العثور على أي معاملة', empty_tx_sub: 'غير الفلتر وحاول مرة أخرى',
      filter_all: 'الكل', filter_income: 'الدخل', filter_expense: 'المصروفات',
      dr_all: 'الكل', dr_today: 'اليوم', dr_week: 'هذا الأسبوع', dr_month: 'هذا الشهر',
      status_completed: 'مكتمل', status_pending: 'قيد الانتظار', status_failed: 'فاشل',
      src_referrals: 'الإحالات', src_rewards: 'مكافآت المحتوى',
      m_mar: 'مارس', m_apr: 'أبريل', m_may: 'مايو',
      recharge_title: 'إعادة الشحن', package_choose: 'اختر باقة!',
      payment_method: 'طريقة الدفع', proceed: 'متابعة الدفع',
      withdraw_title: 'سحب الأرباح', enter_amount: 'أدخل المبلغ بالدولار',
      coin_history_title: 'سجل عملاتك', alert_title: 'الإشعارات والتنبيهات'
    },
    'Spanish': {
      title: 'Saldo', secure: 'Seguro', estimated_bal: 'Saldo estimado', trend_30day: 'Tendencia de 30 días',
      coins_label: 'Monedas', get_coins: 'Obtener Monedas', low_bal_warning: '¡Saldo bajo! Recarga ahora.',
      recharge: 'Recargar', withdraw: 'Retirar', coin_log: 'Log de Monedas', monthly_earnings: 'Ganancias Mensuales',
      show: 'Mostrar', hide: 'Ocultar', top_sources_title: 'Fuentes Principales', tx_history: 'Transacciones',
      view_all: 'Ver todo', search_placeholder: 'Buscar transacción...', loading: 'Cargando...',
      empty_tx: 'No se encontraron transacciones', empty_tx_sub: 'Cambia el filtro',
      filter_all: 'Todo', filter_income: 'Ingresos', filter_expense: 'Gastos',
      dr_all: 'Todo', dr_today: 'Hoy', dr_week: 'Esta Semana', dr_month: 'Este Mes',
      status_completed: 'Completado', status_pending: 'Pendiente', status_failed: 'Fallido',
      src_referrals: 'Referencias', src_rewards: 'Premios de Contenido',
      m_mar: 'Mar', m_apr: 'Abr', m_may: 'May',
      recharge_title: 'Recargar', package_choose: 'Elija el paquete!',
      payment_method: 'Método de pago', proceed: 'Proceder al pago',
      withdraw_title: 'Retirar ganancias', enter_amount: 'Ingrese el monto en USD',
      coin_history_title: 'Historial de Monedas', alert_title: 'Notificaciones'
    },
    'French': {
      title: 'Solde', secure: 'Sécurisé', estimated_bal: 'Solde estimé', trend_30day: 'Tendance de 30 jours',
      coins_label: 'Pièces', get_coins: 'Obtenir des Pièces', low_bal_warning: 'Solde bas! Rechargez maintenant.',
      recharge: 'Recharger', withdraw: 'Retirer', coin_log: 'Log des Pièces', monthly_earnings: 'Gains Mensuels',
      show: 'Afficher', hide: 'Masquer', top_sources_title: 'Principales Sources', tx_history: 'Transactions',
      view_all: 'Voir tout', search_placeholder: 'Chercher transaction...', loading: 'Chargement...',
      empty_tx: 'Aucune transaction trouvée', empty_tx_sub: 'Changez le filtre',
      filter_all: 'Tout', filter_income: 'Revenu', filter_expense: 'Dépense',
      dr_all: 'Tout', dr_today: "Aujourd'hui", dr_week: 'Cette Semaine', dr_month: 'Ce Mois',
      status_completed: 'Terminé', status_pending: 'En attente', status_failed: 'Échoué',
      src_referrals: 'Parrainages', src_rewards: 'Récompenses',
      m_mar: 'Mars', m_apr: 'Avr', m_may: 'Mai',
      recharge_title: 'Recharge', package_choose: 'Choisissez un forfait!',
      payment_method: 'Mode de paiement', proceed: 'Procéder au paiement',
      withdraw_title: 'Retirer des gains', enter_amount: 'Entrez le montant en USD',
      coin_history_title: 'Historique des pièces', alert_title: 'Notifications'
    },
    'Chinese': {
      title: '余额', secure: '安全', estimated_bal: '预估余额', trend_30day: '30天趋势',
      coins_label: '硬币', get_coins: '获取硬币', low_bal_warning: '余额不足！请立即充值。',
      recharge: '充值', withdraw: '提现', coin_log: '硬币记录', monthly_earnings: '月度收入',
      show: '显示', hide: '隐藏', top_sources_title: '主要收入来源', tx_history: '交易记录',
      view_all: '查看全部', search_placeholder: '搜索交易...', loading: '加载中...',
      empty_tx: '未找到交易记录', empty_tx_sub: '更换过滤器后重试',
      filter_all: '全部', filter_income: '收入', filter_expense: '支出',
      dr_all: '全部', dr_today: '今天', dr_week: '本周', dr_month: '本月',
      status_completed: '已完成', status_pending: '进行中', status_failed: '已失败',
      src_referrals: '推荐奖励', src_rewards: '内容创作奖励',
      m_mar: '三月', m_apr: '四月', m_may: '五月',
      recharge_title: '充值中心', package_choose: '选择充值礼包!',
      payment_method: '支付方式', proceed: '立即支付',
      withdraw_title: '提取收益', enter_amount: '请输入美元金额',
      coin_history_title: '硬币明细', alert_title: '系统通知'
    }
  };

  constructor(
    private router:   Router,
    private http:     HttpClient,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public global:    Globall,
    private cdr:      ChangeDetectorRef
  ) {
    addIcons({
      shieldCheckmarkOutline, caretDown, chevronForward, chevronBack,
      chevronForwardOutline, chevronBackOutline, chevronUpOutline, chevronDownOutline,
      arrowForward, arrowDownOutline, arrowUpOutline, addCircleOutline, gift,
      cashOutline, barChartOutline, helpCircleOutline, closeOutline,
      receiptOutline, walletOutline, timeOutline, eyeOutline,
      notificationsOutline, notificationsOffOutline, warningOutline,
      trendingUpOutline, trendingDownOutline, alertCircleOutline,
      checkmarkDoneOutline, removeCircleOutline, checkmarkCircleOutline
    });
  }

  // =========================================
  // LIFECYCLE
  // =========================================

  ngOnInit() {
    this.global.lang$.pipe(takeUntil(this.destroy$)).subscribe((lang: string) => {
      this.currentLang = lang;
      this.ui          = this.translations[lang] || this.translations['English (US)'];
      document.documentElement.dir = (lang === 'Urdu' || lang === 'Arabic') ? 'rtl' : 'ltr';
      this.cdr.detectChanges();
    });

    this.loadBalanceData();
    this.loadTransactions();
    this.loadCoinHistory();
    this.loadAlerts();
    this.loadAnalytics();
    this.buildMiniChart();
  }

  ionViewWillEnter() {
    const savedLang  = localStorage.getItem('selectedLanguage') || 'English (US)';
    this.currentLang = savedLang;
    this.ui          = this.translations[savedLang] || this.translations['English (US)'];
    document.documentElement.dir = (savedLang === 'Urdu' || savedLang === 'Arabic') ? 'rtl' : 'ltr';
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================
  // LOAD DATA — DATABASE
  // =========================================

  loadBalanceData() {
    this.http.get<any>(`${this.base}/balance/${this.userId}/`).subscribe({
      next: (data) => {
        this.estimatedBalanceUSD = data.balance_usd             || 0;
        this.totalCoins          = data.total_coins             || 0;
        this.lowBalanceThreshold = data.low_balance_threshold   || 5.0;
      },
      error: () => {
        this.estimatedBalanceUSD = 125.50;
        this.totalCoins          = 420;
      }
    });
  }

  loadTransactions() {
    this.http.get<any[]>(`${this.base}/transactions/${this.userId}/`).subscribe({
      next: (data) => {
        this.allTransactions = data;
        this.applyFilters();
      },
      error: () => {
        this.allTransactions = [
          { id: 'TX101', type: 'credit', amount: 50.00, description: 'Referral Bonus', date: '2026-05-12', status: 'completed' },
          { id: 'TX102', type: 'debit',  amount: 12.00, description: 'AI Image Prompt', date: '2026-05-13', status: 'completed' },
        ];
        this.applyFilters();
      }
    });
  }

  loadCoinHistory() {
    this.http.get<any[]>(`${this.base}/coins/${this.userId}/`).subscribe({
      next: (data) => {
        this.coinHistory = data.map(c => ({
          id:          String(c.id),
          type:        c.type,
          coins:       c.coins,
          description: c.description,
          date:        new Date(c.created_at).toLocaleDateString(),
        }));
      },
      error: () => {
        this.coinHistory = [
          { id: '1', type: 'earned', coins: 100, description: 'Recharge Bonus', date: '12 May 2026' },
          { id: '2', type: 'spent',  coins: 30,  description: 'AI Video Upscale', date: '13 May 2026' },
        ];
      }
    });
  }

  loadAlerts() {
    this.http.get<any[]>(`${this.base}/alerts/${this.userId}/`).subscribe({
      next: (data) => {
        this.transactionAlerts = data.map(a => ({
          id:      String(a.id),
          type:    a.type,
          title:   a.title,
          message: a.message,
          time:    new Date(a.created_at).toLocaleTimeString(),
          read:    a.is_read,
        }));
      },
      error: () => {
        this.transactionAlerts = [
          { id: 'A1', type: 'credit', title: 'Earned!', message: 'Referral synced.', time: 'Just now', read: false },
        ];
      }
    });
  }

  loadAnalytics() {
    this.monthlyStats = [
      { month: 'Mar', amount: 120, percent: 40,  isCurrentMonth: false },
      { month: 'Apr', amount: 240, percent: 80,  isCurrentMonth: false },
      { month: 'May', amount: 310, percent: 100, isCurrentMonth: true  },
    ];
    this.topSources = [
      { name: 'Referrals',       icon: 'gift',         color: '#ff6b00', percent: 65 },
      { name: 'Content Rewards', icon: 'cash-outline', color: '#2ed573', percent: 35 },
    ];
  }

  buildMiniChart() {
    this.balanceHistory = [
      { height: 25, positive: true,  label: 'W1' },
      { height: 45, positive: true,  label: 'W2' },
      { height: 15, positive: false, label: 'W3' },
      { height: 60, positive: true,  label: 'W4' },
    ];
  }

  // =========================================
  // RECHARGE — DATABASE
  // =========================================

  executeRecharge() {
    if (!this.selectedPackage) return;

    this.http.post<any>(`${this.base}/coins/${this.userId}/add/`, {
      type:        'earned',
      coins:       this.selectedPackage.bonusCoins,
      description: `Recharge: ${this.selectedPackage.label}`,
    }).subscribe({
      next: () => {
        this.totalCoins       += this.selectedPackage!.bonusCoins;
        this.showRechargeModal = false;
        this.showToast('Recharge Successful! 🎉', 'success');
        this.loadBalanceData();
        this.loadCoinHistory();
      },
      error: () => {
        // fallback
        this.totalCoins       += this.selectedPackage!.bonusCoins;
        this.showRechargeModal = false;
        this.showToast('Recharge done (offline)', 'warning');
      }
    });
  }

  // =========================================
  // WITHDRAWAL — DATABASE
  // =========================================

  executeWithdrawal() {
    if (!this.withdrawAmount || this.withdrawAmount <= 0) return;

    this.http.post<any>(`${this.base}/transactions/${this.userId}/create/`, {
      type:        'debit',
      amount:      this.withdrawAmount,
      description: `Withdrawal via ${this.selectedPaymentMethod}`,
      status:      'pending',
      currency:    'USD',
    }).subscribe({
      next: () => {
        this.estimatedBalanceUSD -= this.withdrawAmount!;
        this.showWithdrawModal    = false;
        this.showToast('Withdrawal request submitted! ✅', 'success');
        this.loadTransactions();
        this.loadBalanceData();
      },
      error: () => {
        this.estimatedBalanceUSD -= this.withdrawAmount!;
        this.showWithdrawModal    = false;
        this.showToast('Withdrawal submitted (offline)', 'warning');
      }
    });
  }

  // =========================================
  // ALERTS — DATABASE
  // =========================================

  markAlertRead(alert: any) {
    alert.read = true;
    if (alert.id && !isNaN(Number(alert.id))) {
      this.http.patch(`${this.base}/alerts/read/${alert.id}/`, {}).subscribe();
    }
  }

  markAllRead() {
    this.transactionAlerts.forEach(a => a.read = true);
    this.http.patch(`${this.base}/alerts/${this.userId}/read-all/`, {}).subscribe();
  }

  // =========================================
  // FILTERS
  // =========================================

  setFilter(val: string)       { this.activeFilter    = val;   this.applyFilters(); }
  setDateRange(range: string)  { this.activeDateRange = range; this.applyFilters(); }
  onSearchChange()             { this.applyFilters(); }

  applyFilters() {
    let output = [...this.allTransactions];

    if (this.searchQuery.trim()) {
      output = output.filter(tx =>
        tx.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    if (this.activeFilter !== 'all') {
      output = output.filter(tx => tx.type === this.activeFilter);
    }

    if (this.activeDateRange === 'today') {
      const today = new Date().toDateString();
      output = output.filter(tx => new Date(tx.date).toDateString() === today);
    } else if (this.activeDateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      output = output.filter(tx => new Date(tx.date) >= weekAgo);
    } else if (this.activeDateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      output = output.filter(tx => new Date(tx.date) >= monthAgo);
    }

    this.filteredTransactions = output;
    this.currentPage          = 1;
  }

  // =========================================
  // MODAL CONTROLS
  // =========================================

  openNotificationsModal() { this.showNotificationsModal = true; }
  openRechargeModal()       { this.showRechargeModal      = true; }
  openWithdrawModal()       { this.showWithdrawModal      = true; }
  openCoinHistoryModal()    { this.showCoinHistoryModal   = true; }
  toggleCurrencyMenu()      { this.showCurrencyMenu       = !this.showCurrencyMenu; }
  toggleAnalytics()         { this.showAnalytics          = !this.showAnalytics; }

  selectCurrency(cur: any) {
    this.currency         = cur.code;
    this.showCurrencyMenu = false;
  }

  selectPackage(pkg: RechargePackage) {
    this.selectedPackage = pkg;
  }

  openTransactionDetail(tx: Transaction) {
    this.selectedTransaction = tx;
    this.showTxDetailModal   = true;
  }

  viewAllTransactions() {
    this.activeFilter  = 'all';
    this.searchQuery   = '';
    this.applyFilters();
  }

  changePage(dir: number) {
    this.currentPage += dir;
  }

  // =========================================
  // LABEL HELPERS
  // =========================================

  getFilterLabel(f: any): string {
    if (f.value === 'all')    return this.ui?.filter_all    || 'All';
    if (f.value === 'credit') return this.ui?.filter_income || 'Income';
    if (f.value === 'debit')  return this.ui?.filter_expense || 'Expense';
    return f.label;
  }

  getDateRangeLabel(d: any): string {
    if (d.value === 'all')   return this.ui?.dr_all   || 'All';
    if (d.value === 'today') return this.ui?.dr_today || 'Today';
    if (d.value === 'week')  return this.ui?.dr_week  || 'This Week';
    if (d.value === 'month') return this.ui?.dr_month || 'This Month';
    return d.label;
  }

  getStatusLabel(status: string): string {
    if (status === 'completed') return this.ui?.status_completed || 'Completed';
    if (status === 'pending')   return this.ui?.status_pending   || 'Pending';
    if (status === 'failed')    return this.ui?.status_failed    || 'Failed';
    return status;
  }

  getLocalizedMonth(month: string): string {
    if (month === 'Mar') return this.ui?.m_mar || 'Mar';
    if (month === 'Apr') return this.ui?.m_apr || 'Apr';
    if (month === 'May') return this.ui?.m_may || 'May';
    return month;
  }

  getLocalizedSourceName(name: string): string {
    if (name === 'Referrals')       return this.ui?.src_referrals || 'Referrals';
    if (name === 'Content Rewards') return this.ui?.src_rewards   || 'Content Rewards';
    return name;
  }

  // =========================================
  // TOAST
  // =========================================

  async showToast(msg: string, color: string = 'dark') {
    const t = await this.toastCtrl.create({
      message:  msg,
      duration: 2500,
      color:    color,
      position: 'bottom',
    });
    await t.present();
  }
}