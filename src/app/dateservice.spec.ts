import { TestBed } from '@angular/core/testing';

import { Dateservice } from './dateservice';

describe('Dateservice', () => {
  let service: Dateservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dateservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
