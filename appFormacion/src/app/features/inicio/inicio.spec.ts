import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Inicio } from './inicio';
import { AuthService } from '../../core/services/auth.service';

describe('Inicio', () => {
  let component: Inicio;
  let fixture: ComponentFixture<Inicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inicio],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { cerrarSesion: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Inicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
