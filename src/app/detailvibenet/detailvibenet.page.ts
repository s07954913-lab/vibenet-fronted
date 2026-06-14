import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, arrowForwardOutline } from 'ionicons/icons';
import { register } from 'swiper/element/bundle';

register();

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-detailvibenet',
  templateUrl: './detailvibenet.page.html',
  styleUrls: ['./detailvibenet.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, FormsModule]
})
export class DetailvibenetPage implements OnInit {

  @ViewChild('swiperRef') swiperRef: ElementRef | undefined;

  slides = [
    {
      title: 'Learn live online from the best teachers',
      desc: 'Harness the power of sophisticated AI models to generate, refine, and publish stunning content in seconds.',
      img: 'assets/ii.jpg',
      btnText: 'NEXT'
    },
    {
      title: 'Schedule your live classes with teachers',
      desc: 'Experience a real-time AI explore feed that curates high-energy global content tailored exactly to your professional vibes.',
      img: 'assets/jj.jpg',
      btnText: 'NEXT'
    },
    {
      title: 'Download the recorded classes to watch it later',
      desc: 'Connect with the world and supercharge your presence with intelligent AI tools.',
      img: 'assets/rr.jpg',
      btnText: 'Get Started'
    }
  ];

  constructor(private router: Router, private location: Location) {
    addIcons({ arrowBackOutline, arrowForwardOutline });
  }

  ngOnInit() {}

  handleButtonClick(btnText: string) {
    if (btnText === 'Get Started') {
      this.router.navigate(['/signup']);  // ✅ signup pe jaye
    } else {
      this.swiperRef?.nativeElement.swiper.slideNext();
    }
  }

  goBack() {
    this.location.back();
  }

  skipIntroduction() {
    this.router.navigate(['/signup']);  // ✅ signup pe jaye
  }
}