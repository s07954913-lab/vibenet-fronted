import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NotificationService } from './notification.service'; // ✅ aapki existing path

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent implements OnInit {

  showSplash = true; // ✅ splash screen control

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    // ✅ Splash screen 2 second baad hide ho jayega
    setTimeout(() => {
      this.showSplash = false;
    }, 2000);

    // ✅ OneSignal initialize - sirf mobile device pe kaam karta hai
    this.initNotifications();

    // ✅ Aapka existing login check preserved
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  // ✅ try/catch wrap - web browser mein crash nahi hoga
  private async initNotifications() {
    try {
      await this.notificationService.initOneSignal();
    } catch (err) {
      console.warn('OneSignal init skipped (web):', err);
    }
  }
}