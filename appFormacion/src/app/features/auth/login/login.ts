import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';

  mostrarPassword = false;
  cargando = false;

  mensajeError = '';

  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  limpiarError() {
    if (this.mensajeError) {
      this.mensajeError = '';
    }
  }

  irAlFormulario(event: Event) {
    event.preventDefault();
    document.getElementById('login-form')?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('email')?.focus({ preventScroll: true });
  }

  async iniciarSesion() {
    this.mensajeError = '';

    if (!this.email.trim() || !this.password) {
      this.mensajeError = 'Por favor, completa todos los campos.';
      return;
    }
    if (!this.emailRegex.test(this.email.trim())) {
      this.mensajeError = 'Ingresa un correo electrónico válido.';
      return;
    }

    this.cargando = true;

    try {
      const { data, error } = await this.authService.iniciarSesion(
        this.email.trim(),
        this.password
      );

      if (error) {
        this.mensajeError = 'Correo electrónico o contraseña incorrectos.';
        return;
      }

      if (data.session) {
        await this.router.navigate(['/inicio']);
      } else {
        this.mensajeError = 'No se pudo iniciar sesión. Inténtalo nuevamente.';
      }

    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      this.mensajeError = 'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.';
    } finally {
      this.cargando = false;
    }
  }
}
