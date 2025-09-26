import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IotDashboardDisplay } from './iot-dashboard-display';

describe('IotDashboardDisplay', () => {
  let component: IotDashboardDisplay;
  let fixture: ComponentFixture<IotDashboardDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IotDashboardDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IotDashboardDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
