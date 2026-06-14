import { TestBed } from '@angular/core/testing';

import { Share } from './share';

describe('Share', () => {
  let service: Share;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Share);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
