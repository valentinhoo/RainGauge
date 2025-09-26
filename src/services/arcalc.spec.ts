import { TestBed } from '@angular/core/testing';

import { Arcalc } from './arcalc';

describe('Arcalc', () => {
  let service: Arcalc;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Arcalc);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
