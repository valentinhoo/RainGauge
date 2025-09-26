import { TestBed } from '@angular/core/testing';

import { Compute } from './compute';

describe('Compute', () => {
  let service: Compute;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Compute);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
