import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyticsReportsPage } from './analytics-reports.page';

describe('AnalyticsReportsPage', () => {
  let component: AnalyticsReportsPage;
  let fixture: ComponentFixture<AnalyticsReportsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyticsReportsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
