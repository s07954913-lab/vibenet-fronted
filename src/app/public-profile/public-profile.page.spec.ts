import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicProfilePage } from './public-profile.page';

describe('PublicProfilePage', () => {
  let component: PublicProfilePage;
  let fixture: ComponentFixture<PublicProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
