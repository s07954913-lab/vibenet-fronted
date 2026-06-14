import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityCenterPage } from './activity-center.page';

describe('ActivityCenterPage', () => {
  let component: ActivityCenterPage;
  let fixture: ComponentFixture<ActivityCenterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityCenterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
