import { Routes } from '@angular/router';

import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Inicio } from './features/inicio/inicio';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

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

  // Panel de administrador
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin').then(m => m.Admin)
  },

  // Ruta inicial
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // Rutas inexistentes (siempre al final)
  {
    path: '**',
    redirectTo: 'login'
  }
];