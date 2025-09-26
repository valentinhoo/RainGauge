import { TestBed } from '@angular/core/testing';

import { SharedFiles } from './shared-files';

describe('SharedFiles', () => {
  let service: SharedFiles;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedFiles);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
