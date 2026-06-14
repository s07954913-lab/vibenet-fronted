import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home', 
    pathMatch: 'full',
  },
  {
    path: 'homefeed',
    loadComponent: () => import('./homefeed/homefeed.page').then( m => m.HomefeedPage)
  },
  {
    path: 'notification',
    loadComponent: () => import('./notification/notification.page').then( m => m.NotificationPage)
  },
  {
    path: 'setting',
    loadComponent: () => import('./setting/setting.page').then( m => m.SettingPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'ai-assistant',
    loadComponent: () => import('./ai-assistant/ai-assistant.page').then( m => m.AiAssistantPage)
  },
  {
    path: 'admin-panel',
    loadComponent: () => import('./admin-panel/admin-panel.page').then( m => m.AdminPanelPage)
  },
  {
    path: 'reels',
    loadComponent: () => import('./reels/reels.page').then( m => m.ReelsPage)
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.page').then( m => m.SignupPage)
  },
  
  {
    path: 'userprofile',
    loadComponent: () => import('./userprofile/userprofile.page').then( m => m.UserprofilePage)
  },
  {
    path: 'explore',
    loadComponent: () => import('./explore/explore.page').then( m => m.ExplorePage)
  },
  {
    path: 'chatsystem',
    loadComponent: () => import('./chatsystem/chatsystem.page').then( m => m.ChatsystemPage)
  },
  {
    path: 'chat-detail',
    loadComponent: () => import('./chat-detail/chat-detail.page').then( m => m.ChatDetailPage)
  },
  {
    path: 'analytics-reports',
    loadComponent: () => import('./analytics-reports/analytics-reports.page').then( m => m.AnalyticsReportsPage)
  },
  {
  path: 'ai-assistant',
  loadComponent: () =>
    import('./ai-assistant/ai-assistant.page')
    .then(m => m.AiAssistantPage),
},
{
  path: 'chat-system',
  loadComponent: () => import('./chatsystem/chatsystem.page').then( m => m.ChatsystemPage)
},
  {
    path: 'detailpage',
    loadComponent: () => import('./detailpage/detailpage.page').then( m => m.DetailpagePage)
  },
  {
    path: 'activity-center',
    loadComponent: () => import('./activity-center/activity-center.page').then( m => m.ActivityCenterPage)
  },
  {
    path: 'balance',
    loadComponent: () => import('./balance/balance.page').then( m => m.BalancePage)
  },
  {
    path: 'qr-code',
    loadComponent: () => import('./qr-code/qr-code.page').then( m => m.QrCodePage)
  },
  {
    path: 'detailvibenet',
    loadComponent: () => import('./detailvibenet/detailvibenet.page').then( m => m.DetailvibenetPage)
  },
  {
    path: 'myaccount',
    loadComponent: () => import('./myaccount/myaccount.page').then( m => m.MyaccountPage)
  },
  {
    path: 'postupload',
    loadComponent: () => import('./postupload/postupload.page').then( m => m.PostuploadPage)
  },
  {
    path: 'public-profile',
    loadComponent: () => import('./public-profile/public-profile.page').then( m => m.PublicProfilePage)
  },
  {
    path: 'user-search',
    loadComponent: () => import('./user-search/user-search.page').then( m => m.UserSearchPage)
  },
  {
    path: 'comment-system',
    loadComponent: () => import('./comment-system/comment-system.page').then( m => m.CommentSystemPage)
  },
  {
    path: 'comment-view',
    loadComponent: () => import('./comment-view/comment-view.page').then( m => m.CommentViewPage)
  },
 
  

];
