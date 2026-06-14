import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailpagePage } from './detailpage.page';

describe('DetailpagePage', () => {
  let component: DetailpagePage;
  let fixture: ComponentFixture<DetailpagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailpagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
