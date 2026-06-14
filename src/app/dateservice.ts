import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Dateservice {
  private userSource = new BehaviorSubject<any>({
    name: 'rana rajpoot',
    email: 'rana@vibenet.ai',
    bio: 'Customize your VibeNet AI persona',
    image: '../../assets/images.jfif',
    language: 'English (US)',
    isDarkMode: false
  });

  currentUser = this.userSource.asObservable();

  constructor() {}

  updateUser(data: any) {
    this.userSource.next(data);
  }
}