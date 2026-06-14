import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  walletOutline, timeOutline, qrCodeOutline, settingsOutline,
  logOutOutline, arrowBackOutline
} from 'ionicons/icons';
import { Dateservice } from '../dateservice';

@Component({
  selector: 'app-myaccount',
  templateUrl: './myaccount.page.html',
  styleUrls: ['./myaccount.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class MyaccountPage implements OnInit {

  userName: string     = 'Rana Rajpoot';
  profileImage: string = 'assets/icon/flower.jpg';

  constructor(
    private router: Router,
    private dateService: Dateservice,
    private toastController: ToastController
  ) {
    addIcons({
      walletOutline, timeOutline, qrCodeOutline, settingsOutline,
      logOutOutline, arrowBackOutline
    });
  }

  ngOnInit() {
    this.dateService.currentUser.subscribe((data: any) => {
      if (data) {
        this.userName    = data.name    || this.userName;
        if (data.image) this.profileImage = data.image;
      }
    });
  }

  goBack()             { this.router.navigate(['/userprofile']); }
  goToBalance()        { this.router.navigate(['/balance']); }
  goToActivityCenter() { this.router.navigate(['/activity-center']); }
  goToQRCode()         { this.router.navigate(['/qr-code']); }
  goToSettings()       { this.router.navigate(['/setting']); }

  async logout() {
    const toast = await this.toastController.create({
      message: 'Logged out successfully',
      duration: 1500,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
    this.router.navigate(['/login']);
  }
}