import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-comment-system',
  templateUrl: './comment-system.page.html',
  styleUrls: ['./comment-system.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class CommentSystemPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
