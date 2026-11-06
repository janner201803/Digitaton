import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Inicio } from './inicio';
import { AuthService } from '../../core/services/auth.service';

describe('Inicio', () => {
  let component: Inicio;
  let fixture: ComponentFixture<Inicio>;
  let esAdmin: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    esAdmin = vi.fn().mockResolvedValue(false);

    await TestBed.configureTestingModule({
      imports: [Inicio],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            cerrarSesion: vi.fn(),
            obtenerUserId: vi.fn().mockResolvedValue('user-id'),
            esAdmin,
            obtenerResultados: vi.fn().mockResolvedValue({ resultados: [], error: null }),
            observarCambiosProgreso: vi.fn().mockResolvedValue({ channel: null, error: null }),
            dejarDeObservarProgreso: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Inicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not show the report link to regular users', () => {
    expect(fixture.nativeElement.querySelector('a[routerLink="/admin"]')).toBeNull();
  });

  it('shows the report link to administrators', async () => {
    esAdmin.mockResolvedValue(true);
    await component.ngOnInit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[routerLink="/admin"]')?.textContent).toContain('Reporte');
  });
});
