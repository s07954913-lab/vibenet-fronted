import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentViewPage } from './comment-view.page';

describe('CommentViewPage', () => {
  let component: CommentViewPage;
  let fixture: ComponentFixture<CommentViewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
