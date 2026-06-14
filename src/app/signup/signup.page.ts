import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import {
  IonContent, IonInput, IonItem, IonLabel,
  IonIcon, IonButton, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonModal
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, checkmarkCircle,
  arrowForwardOutline, closeCircle
} from 'ionicons/icons';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

// ✅ Users array ki key
const VN_USERS_KEY = 'vn_users';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonInput, IonItem, IonLabel,
    IonIcon, IonButton, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonModal
  ]
})
export class SignupPage {

  username = '';
  email    = '';
  password = '';

  usernameTouched = false;
  emailTouched    = false;
  passwordTouched = false;

  isModalOpen   = false;
  signupSuccess = false;
  modalMessage  = '';

  constructor(private router: Router, private http: HttpClient) {
    addIcons({ checkmarkCircleOutline, checkmarkCircle, arrowForwardOutline, closeCircle });
  }

  private getBaseUrl(): string {
    return Capacitor.isNativePlatform()
      ? 'http://192.168.0.105:8000'
      : 'http://127.0.0.1:8000';
  }

  // ✅ User ko vn_users array mein save/update karo
  private saveUserToArray(uid: string, username: string, email: string, photoUrl: string = '') {
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

  get isUsernameValid(): boolean { return this.username.trim().length >= 3; }
  get isEmailValid(): boolean    { return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(this.email); }
  get hasMinLen(): boolean       { return this.password.length >= 8; }
  get hasUpper(): boolean        { return /[A-Z]/.test(this.password); }
  get hasLower(): boolean        { return /[a-z]/.test(this.password); }
  get hasNumber(): boolean       { return /[0-9]/.test(this.password); }
  get hasSpecial(): boolean      { return /[!@#$%^&*(),.?":{}|<>]/.test(this.password); }
  get isPasswordValid(): boolean {
    return this.hasMinLen && this.hasUpper &&
           this.hasLower && this.hasNumber && this.hasSpecial;
  }

  setOpen(isOpen: boolean) { this.isModalOpen = isOpen; }

  handleModalClose() {
    this.isModalOpen = false;
    if (this.signupSuccess) {
      setTimeout(() => this.router.navigate(['/login']), 300);
    }
  }

  // ✅ Firebase Email/Password Signup
  async signup() {
    this.usernameTouched = true;
    this.emailTouched    = true;
    this.passwordTouched = true;

    if (!this.isUsernameValid || !this.isEmailValid || !this.isPasswordValid) {
      this.signupSuccess = false;
      this.modalMessage  = 'Please fill all fields correctly';
      this.setOpen(true);
      return;
    }

    try {
      const result = await FirebaseAuthentication.createUserWithEmailAndPassword({
        email:    this.email,
        password: this.password
      });

      const user = result.user;

      if (user) {
        await FirebaseAuthentication.updateProfile({ displayName: this.username });

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userId',     user.uid);
        localStorage.setItem('username',   this.username);
        localStorage.setItem('email',      user.email ?? '');
        localStorage.setItem('photoUrl',   user.photoUrl ?? '');

        // ✅ Users array mein save karo
        this.saveUserToArray(user.uid, this.username, user.email ?? '', user.photoUrl ?? '');

        this.http.post<any>(`${this.getBaseUrl()}/api/signup/`, {
          firebase_uid: user.uid,
          username:     this.username,
          email:        this.email,
          password:     this.password
        }).subscribe({ next: () => {}, error: () => {} });

        this.signupSuccess = true;
        this.modalMessage  = 'Account created successfully!';
      }

    } catch (error: any) {
      this.signupSuccess = false;
      if (error.code === 'auth/email-already-in-use') {
        this.modalMessage = 'Email already registered!';
      } else if (error.code === 'auth/weak-password') {
        this.modalMessage = 'Password is too weak!';
      } else {
        this.modalMessage = error.message || 'Signup failed!';
      }
    }

    this.setOpen(true);
  }

  // ✅ Google Signup
  async signupWithGoogle() {
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const user   = result.user;

      if (!user) {
        this.signupSuccess = false;
        this.modalMessage  = 'Google login failed.';
        this.setOpen(true);
        return;
      }

      this.sendGoogleUserToBackend({
        uid:         user.uid,
        email:       user.email       ?? '',
        displayName: user.displayName ?? '',
        photoURL:    user.photoUrl    ?? ''
      });

    } catch (error: any) {
      this.signupSuccess = false;
      this.modalMessage  = error?.message || 'Google signin failed.';
      this.setOpen(true);
    }
  }

  private sendGoogleUserToBackend(user: {
    uid: string; email: string; displayName: string; photoURL: string;
  }) {
    const username = user.displayName
      ? user.displayName.replace(/\s/g, '_').toLowerCase()
      : user.email.split('@')[0];

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId',     user.uid);
    localStorage.setItem('username',   username);
    localStorage.setItem('email',      user.email);
    localStorage.setItem('photoUrl',   user.photoURL);

    // ✅ Users array mein save karo
    this.saveUserToArray(user.uid, username, user.email, user.photoURL);

    const payload = {
      google_id: user.uid,
      email:     user.email,
      username,
      name:      user.displayName,
      photo_url: user.photoURL
    };

    this.http.post<any>(`${this.getBaseUrl()}/api/google-auth/`, payload)
      .subscribe({
        next:  () => this.router.navigate(['/homefeed']),
        error: () => this.router.navigate(['/homefeed'])
      });
  }

  goToLogin() { this.router.navigate(['/homefeed']); }
}