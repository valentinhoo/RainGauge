import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewDisplay } from './overview-display';

describe('OverviewDisplay', () => {
  let component: OverviewDisplay;
  let fixture: ComponentFixture<OverviewDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverviewDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
