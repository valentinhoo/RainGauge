import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginDisplay } from './login-display';

describe('LoginDisplay', () => {
  let component: LoginDisplay;
  let fixture: ComponentFixture<LoginDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
