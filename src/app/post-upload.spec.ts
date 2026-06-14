import { TestBed } from '@angular/core/testing';

import { PostUpload } from './post-upload';

describe('PostUpload', () => {
  let service: PostUpload;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostUpload);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
