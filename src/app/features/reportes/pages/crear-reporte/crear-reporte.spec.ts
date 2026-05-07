import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearReporte } from './crear-reporte';

describe('CrearReporte', () => {
  let component: CrearReporte;
  let fixture: ComponentFixture<CrearReporte>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearReporte],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearReporte);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
