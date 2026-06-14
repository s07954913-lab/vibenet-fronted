import { TestBed } from '@angular/core/testing';

import { Reels } from './reels';

describe('Reels', () => {
  let service: Reels;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Reels);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
