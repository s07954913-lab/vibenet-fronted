import { TestBed } from '@angular/core/testing';

import { Instagram } from './instagram';

describe('Instagram', () => {
  let service: Instagram;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Instagram);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
