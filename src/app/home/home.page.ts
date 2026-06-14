import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonContent
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent],
})
export class HomePage implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {

    // 8 seconds baad automatic next page par navigate
    setTimeout(() => {
      this.router.navigate(['/detailvibenet']);
    }, 8000);

  }
}