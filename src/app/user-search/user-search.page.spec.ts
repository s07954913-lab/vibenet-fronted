import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserSearchPage } from './user-search.page';

describe('UserSearchPage', () => {
  let component: UserSearchPage;
  let fixture: ComponentFixture<UserSearchPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
