import { TestBed } from '@angular/core/testing';

import { CostLocFetch } from './cost-loc-fetch';

describe('CostLocFetch', () => {
  let service: CostLocFetch;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CostLocFetch);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
