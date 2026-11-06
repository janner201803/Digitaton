import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Login } from './login';
import { AuthService } from '../../../core/services/auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: { iniciarSesion: ReturnType<typeof vi.fn>; esAdmin: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authService = {
      iniciarSesion: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      esAdmin: vi.fn().mockResolvedValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates administrators to the admin panel after login', async () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authService.esAdmin.mockResolvedValue(true);
    component.email = 'admin@example.com';
    component.password = 'password';

    await component.iniciarSesion();

    expect(authService.esAdmin).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('navigates regular users to the home page after login', async () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.email = 'user@example.com';
    component.password = 'password';

    await component.iniciarSesion();

    expect(authService.esAdmin).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });
});
