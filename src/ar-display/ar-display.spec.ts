import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArDisplay } from './ar-display';

describe('ArDisplay', () => {
  let component: ArDisplay;
  let fixture: ComponentFixture<ArDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
