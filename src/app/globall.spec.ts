import { TestBed } from '@angular/core/testing';

import { Globall } from './globall';

describe('Globall', () => {
  let service: Globall;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Globall);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
