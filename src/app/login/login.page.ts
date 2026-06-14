import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FollowService } from '../follow';
import {
  IonContent, IonInput, IonItem, IonLabel, IonNote,
  IonIcon, IonButton, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonModal
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, checkmarkCircle,
  arrowForwardOutline, closeCircle, checkmark, close
} from 'ionicons/icons';

// ✅ Users array ki key
const VN_USERS_KEY = 'vn_users';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonInput, IonItem, IonLabel, IonNote,
    IonIcon, IonButton, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonModal
  ]
})
export class LoginPage {
  email    = '';
  password = '';
  emailTouched    = false;
  passwordTouched = false;
  isModalOpen  = false;
  loginSuccess = false;
  modalMessage = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private followService: FollowService
  ) {
    addIcons({
      checkmarkCircleOutline, checkmarkCircle,
      arrowForwardOutline, closeCircle, checkmark, close
    });
  }

  private getBaseUrl(): string {
    return Capacitor.isNativePlatform()
      ? 'http://192.168.0.105:8000'
      : 'http://127.0.0.1:8000';
  }

  // ✅ User ko vn_users array mein save/update karo
  private saveUserToArray(uid: string, username: string, email: string, photoUrl: string) {
    try {
      const raw   = localStorage.getItem(VN_USERS_KEY);
      const users = raw ? JSON.parse(raw) : [];
      const idx   = users.findIndex((u: any) => u.id === uid);
      const entry = { id: uid, username, name: username, email, avatar: photoUrl, bio: '' };
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...entry };
      } else {
        users.push(entry);
      }
      localStorage.setItem(VN_USERS_KEY, JSON.stringify(users));
    } catch { }
  }

  get isEmailValid(): boolean {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(this.email);
  }
  get hasMinLen(): boolean  { return this.password.length >= 8; }
  get hasMaxLen(): boolean  { return this.password.length <= 20; }
  get hasUpper(): boolean   { return /[A-Z]/.test(this.password); }
  get hasLower(): boolean   { return /[a-z]/.test(this.password); }
  get hasNumber(): boolean  { return /[0-9]/.test(this.password); }
  get hasSpecial(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.password); }
  get isPasswordValid(): boolean {
    return this.hasMinLen && this.hasMaxLen && this.hasUpper &&
           this.hasLower && this.hasNumber && this.hasSpecial;
  }

  setOpen(isOpen: boolean) { this.isModalOpen = isOpen; }
  goToSignUpPage() { this.router.navigate(['/signup']); }

  handleModalClose() {
    this.isModalOpen = false;
    if (this.loginSuccess) {
      setTimeout(() => this.router.navigate(['/homefeed']), 300);
    }
  }

  // ✅ Firebase Email/Password Login
  async login() {
    this.emailTouched    = true;
    this.passwordTouched = true;

    if (!this.email || !this.password) {
      this.loginSuccess = false;
      this.modalMessage = 'Please enter email and password';
      this.setOpen(true);
      return;
    }

    try {
      const result = await FirebaseAuthentication.signInWithEmailAndPassword({
        email:    this.email,
        password: this.password
      });

      const user = result.user;

      if (user) {
        const username = user.displayName ?? this.email.split('@')[0];
        const photoUrl = user.photoUrl ?? '';

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId',     user.uid);
        localStorage.setItem('username',   username);
        localStorage.setItem('email',      user.email ?? '');
        localStorage.setItem('photoUrl',   photoUrl);

        await Preferences.set({ key: 'isLoggedIn', value: 'true' });
        await Preferences.set({ key: 'userId',     value: user.uid });
        await Preferences.set({ key: 'username',   value: username });
        await Preferences.set({ key: 'email',      value: user.email ?? '' });
        await Preferences.set({ key: 'photoUrl',   value: photoUrl });

        // ✅ Users array mein save karo
        this.saveUserToArray(user.uid, username, user.email ?? '', photoUrl);

        await this.followService.setCurrentUser(user.uid);

        this.http.post<any>(`${this.getBaseUrl()}/api/login/`, {
          email:    this.email,
          password: this.password
        }).subscribe({ next: () => {}, error: () => {} });

        this.loginSuccess = true;
        this.modalMessage = 'Login successful!';
      }

    } catch (error: any) {
      this.loginSuccess = false;
      if (error.code === 'auth/user-not-found') {
        this.modalMessage = 'Account not found!';
      } else if (error.code === 'auth/wrong-password') {
        this.modalMessage = 'Wrong password!';
      } else if (error.code === 'auth/invalid-credential') {
        this.modalMessage = 'Invalid email or password!';
      } else {
        this.modalMessage = error.message || 'Login failed!';
      }
    }

    this.setOpen(true);
  }

  // ✅ Google Login
  async loginWithGoogle() {
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const user   = result.user;

      if (!user) {
        this.loginSuccess = false;
        this.modalMessage = 'Google login failed.';
        this.setOpen(true);
        return;
      }

      const username = user.displayName
        ? user.displayName.replace(/\s/g, '_').toLowerCase()
        : (user.email ?? '').split('@')[0];
      const photoUrl = user.photoUrl ?? '';

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId',     user.uid);
      localStorage.setItem('username',   username);
      localStorage.setItem('email',      user.email ?? '');
      localStorage.setItem('photoUrl',   photoUrl);

      await Preferences.set({ key: 'isLoggedIn', value: 'true' });
      await Preferences.set({ key: 'userId',     value: user.uid });
      await Preferences.set({ key: 'username',   value: username });
      await Preferences.set({ key: 'email',      value: user.email ?? '' });
      await Preferences.set({ key: 'photoUrl',   value: photoUrl });

      // ✅ Users array mein save karo
      this.saveUserToArray(user.uid, username, user.email ?? '', photoUrl);

      await this.followService.setCurrentUser(user.uid);

      const payload = {
        google_id: user.uid,
        email:     user.email ?? '',
        username,
        name:      user.displayName ?? '',
        photo_url: photoUrl
      };

      this.http.post<any>(`${this.getBaseUrl()}/api/google-auth/`, payload)
        .subscribe({
          next:  () => this.router.navigate(['/homefeed']),
          error: () => this.router.navigate(['/homefeed'])
        });

    } catch (error: any) {
      this.loginSuccess = false;
      this.modalMessage = error?.message || 'Google signin failed.';
      this.setOpen(true);
    }
  }
}