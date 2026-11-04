import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  // Servicios
  private authService = inject(AuthService);
  private router = inject(Router);

  // Datos del formulario
  email = '';
  password = '';

  // Estados de la pantalla
  mostrarPassword = false;
  cargando = false;

  // Mensajes
  mensajeError = '';

  // Método para iniciar sesión
  async iniciarSesion() {

    // Limpiar mensajes anteriores
    this.mensajeError = '';

    // Validar campos
    if (!this.email.trim() || !this.password) {
      this.mensajeError = 'Por favor, completa todos los campos.';
      return;
    }

    this.cargando = true;

    try {

      // Consultar autenticación en Supabase
      const { data, error } = await this.authService.iniciarSesion(
        this.email.trim(),
        this.password
      );

      // Verificar errores
      if (error) {
        this.mensajeError = 'Correo electrónico o contraseña incorrectos.';
        return;
      }

      // Verificar que exista una sesión
      if (data.session) {

        // Redirigir al inicio
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