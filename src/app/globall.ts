import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Globall {

  // 👤 USER STATE
  private userSubject = new BehaviorSubject<any>({
    name: 'BintAKBAR 😍',
    email: '',
    image: '../../assets/G9F7X_JasAAzVXp.jpg'
  });

  currentUser = this.userSubject.asObservable();

  setUser(data: any) {
    this.userSubject.next({
      ...this.userSubject.value,
      ...data
    });
  }

  getUser() {
    return this.userSubject.value;
  }

  // 🌙 THEME
  private themeSubject = new BehaviorSubject<boolean>(
    localStorage.getItem('theme') === 'true'
  );
  theme$ = this.themeSubject.asObservable();

  setTheme(isDark: boolean) {
    this.themeSubject.next(isDark);
    localStorage.setItem('theme', String(isDark));
    document.body.classList.toggle('dark', isDark);
  }

  // 🌐 LANGUAGE
  private langSubject = new BehaviorSubject<string>(
    localStorage.getItem('selectedLanguage') || 'English (US)'
  );
  lang$ = this.langSubject.asObservable();

  setLanguage(lang: string) {
    this.langSubject.next(lang);
    localStorage.setItem('selectedLanguage', lang);
  }

  constructor() {
    // Initial load par theme apply karne ke liye
    const savedTheme = localStorage.getItem('theme') === 'true';
    document.body.classList.toggle('dark', savedTheme);
  }
}
