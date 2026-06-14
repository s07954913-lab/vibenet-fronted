import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentSystemPage } from './comment-system.page';

describe('CommentSystemPage', () => {
  let component: CommentSystemPage;
  let fixture: ComponentFixture<CommentSystemPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentSystemPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
