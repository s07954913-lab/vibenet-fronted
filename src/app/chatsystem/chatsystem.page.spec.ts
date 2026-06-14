import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatsystemPage } from './chatsystem.page';

describe('ChatsystemPage', () => {
  let component: ChatsystemPage;
  let fixture: ComponentFixture<ChatsystemPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatsystemPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
