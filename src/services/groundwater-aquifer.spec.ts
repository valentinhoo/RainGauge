import { TestBed } from '@angular/core/testing';

import { GroundwaterAquifer } from './groundwater-aquifer';

describe('GroundwaterAquifer', () => {
  let service: GroundwaterAquifer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroundwaterAquifer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
