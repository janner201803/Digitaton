import { Routes } from '@angular/router';

import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Inicio } from './features/inicio/inicio';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // Inicio de sesión
  {
    path: 'login',
    component: Login
  },

  // Registro de usuarios
  {
    path: 'register',
    component: Register
  },

  // Página principal protegida
  {
    path: 'inicio',
    component: Inicio,
    canActivate: [authGuard]
  },

  // Ruta inicial
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // Rutas inexistentes
  {
    path: '**',
    redirectTo: 'login'
  }

];