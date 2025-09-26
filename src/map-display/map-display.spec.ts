import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapDisplay } from './map-display';

describe('MapDisplay', () => {
  let component: MapDisplay;
  let fixture: ComponentFixture<MapDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
