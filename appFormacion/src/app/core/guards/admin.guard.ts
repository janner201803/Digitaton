import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const autenticado = await authService.estaAutenticado();

  if (!autenticado) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const admin = await authService.esAdmin();

  if (admin) {
    return true;
  }

  return router.createUrlTree(['/inicio']);
};