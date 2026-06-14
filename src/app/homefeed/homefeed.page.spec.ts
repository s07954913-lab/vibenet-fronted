import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomefeedPage } from './homefeed.page';

describe('HomefeedPage', () => {
  let component: HomefeedPage;
  let fixture: ComponentFixture<HomefeedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomefeedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
