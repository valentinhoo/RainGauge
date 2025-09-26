import { TestBed } from '@angular/core/testing';

import { RainfallFetchService } from './rainfall-fetch-service';

describe('RainfallFetchService', () => {
  let service: RainfallFetchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RainfallFetchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
