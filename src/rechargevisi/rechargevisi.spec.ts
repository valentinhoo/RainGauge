import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rechargevisi } from './rechargevisi';

describe('Rechargevisi', () => {
  let component: Rechargevisi;
  let fixture: ComponentFixture<Rechargevisi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rechargevisi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rechargevisi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
