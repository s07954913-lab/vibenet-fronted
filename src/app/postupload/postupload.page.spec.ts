import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostuploadPage } from './postupload.page';

describe('PostuploadPage', () => {
  let component: PostuploadPage;
  let fixture: ComponentFixture<PostuploadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PostuploadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
