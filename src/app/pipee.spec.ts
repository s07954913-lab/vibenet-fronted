import { TestBed } from '@angular/core/testing';

import { Pipee } from './pipee';

describe('Pipee', () => {
  let service: Pipee;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pipee);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
