import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle,
  IonButton, IonButtons, IonTextarea, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-postupload',
  templateUrl: './postupload.page.html',
  styleUrls: ['./postupload.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonButton, IonButtons, IonTextarea, IonIcon
  ]
})
export class PostuploadPage implements OnInit {

  selectedFile:    File | null = null;
  previewUrl:      string      = '';
  caption:         string      = '';

  // Table control
  showTable:       boolean     = false;

  // File metadata
  isVideo:         boolean     = false;
  fileSizeMB:      string      = '';
  videoDuration:   string      = '';
  videoResolution: string      = '';
  imgDimensions:   string      = '';
  postedAt:        string      = '';

  constructor(private router: Router) {
    addIcons({ arrowBackOutline });
  }

  ngOnInit() {}

  selectFile() {
    const input = document.getElementById('fileInput') as HTMLInputElement;
    input?.click();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files?.[0];
    if (!file) return;

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File 100MB se bari hai!');
      return;
    }

    // Reset table agar pehle se show tha
    this.showTable       = false;
    this.videoDuration   = '';
    this.videoResolution = '';
    this.imgDimensions   = '';

    this.selectedFile = file;
    this.previewUrl   = URL.createObjectURL(file);
    this.isVideo      = file.type.startsWith('video/');
    this.fileSizeMB   = (file.size / 1048576).toFixed(2);

    if (this.isVideo) {
      this.loadVideoMetadata(this.previewUrl);
    } else {
      this.loadImageMetadata(this.previewUrl);
    }
  }

  private loadVideoMetadata(url: string) {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      const d   = Math.floor(video.duration);
      const min = Math.floor(d / 60);
      const sec = d % 60;
      this.videoDuration   = `${min}:${sec.toString().padStart(2, '0')} min`;
      this.videoResolution = `${video.videoWidth} × ${video.videoHeight}`;
    };
  }

  private loadImageMetadata(url: string) {
    const img = new Image();
    img.onload = () => {
      this.imgDimensions = `${img.naturalWidth} × ${img.naturalHeight} px`;
    };
    img.src = url;
  }

  doPost() {
    if (!this.selectedFile) return;

    // Sirf table dikhao — koi upload/API/login nahi
    this.postedAt  = new Date().toLocaleString('en-PK', {
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
      hour12: true
    });
    this.showTable = true;

    // Table tak scroll karein
    setTimeout(() => {
      const el = document.querySelector('[data-table]');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  goBack() {
    this.router.navigate(['/reels']);
  }
}