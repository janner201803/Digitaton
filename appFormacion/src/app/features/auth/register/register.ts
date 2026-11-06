import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  private authService = inject(AuthService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);

  email = '';
  password = '';

  mostrarPassword = false;
  cargando = false;

  mensajeError = '';
  mensajeExito = '';

  async registrar() {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.email.trim() || !this.password) {
      this.mensajeError = 'Completa todos los campos.';
      return;
    }

    if (this.password.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.cargando = true;
    this.changeDetector.markForCheck();

    try {
      const { data, error } = await this.authService.registrarUsuario(
        this.email.trim(),
        this.password
      );

      if (error) {
        this.mensajeError = error.message;
        return;
      }

      if (data.session) {
        await this.router.navigate(['/inicio']);
      } else {
        this.mensajeExito =
          '¡Cuenta creada! Revisa tu correo para confirmar tu registro.';
      }

    } catch {
      this.mensajeError = 'Ocurrió un error al crear tu cuenta.';
    } finally {
      this.cargando = false;
      this.changeDetector.markForCheck();
    }
  }
}