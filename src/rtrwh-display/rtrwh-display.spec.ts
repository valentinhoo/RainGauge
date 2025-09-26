import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RtrwhDisplay } from './rtrwh-display';

describe('RtrwhDisplay', () => {
  let component: RtrwhDisplay;
  let fixture: ComponentFixture<RtrwhDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RtrwhDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RtrwhDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
