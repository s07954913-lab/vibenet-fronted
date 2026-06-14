import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiAssistantPage } from './ai-assistant.page';

describe('AiAssistantPage', () => {
  let component: AiAssistantPage;
  let fixture: ComponentFixture<AiAssistantPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AiAssistantPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
