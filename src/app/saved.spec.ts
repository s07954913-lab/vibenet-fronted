import { TestBed } from '@angular/core/testing';

import { Saved } from './saved';

describe('Saved', () => {
  let service: Saved;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Saved);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
