import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
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
export class Register implements AfterViewInit, OnDestroy {

  @ViewChild('storyPanel') private storyPanel!: ElementRef<HTMLElement>;
  @ViewChild('formCard') private formCard!: ElementRef<HTMLElement>;

  private authService = inject(AuthService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private storyHeightObserver?: ResizeObserver;
  private tabletMediaQuery?: MediaQueryList;
  private updateStoryHeight?: () => void;

  email = '';
  password = '';

  mostrarPassword = false;
  cargando = false;

  mensajeError = '';
  mensajeExito = '';

  ngAfterViewInit() {
    const tabletMediaQuery = window.matchMedia('(min-width: 761px) and (max-width: 1024px)');
    const updateStoryHeight = () => {
      this.storyPanel.nativeElement.style.height = tabletMediaQuery.matches
        ? `${this.formCard.nativeElement.getBoundingClientRect().height}px`
        : '';
    };

    this.tabletMediaQuery = tabletMediaQuery;
    this.updateStoryHeight = updateStoryHeight;
    tabletMediaQuery.addEventListener('change', updateStoryHeight);
    this.storyHeightObserver = new ResizeObserver(updateStoryHeight);
    this.storyHeightObserver.observe(this.formCard.nativeElement);
    updateStoryHeight();
  }

  ngOnDestroy() {
    this.storyHeightObserver?.disconnect();
    if (this.tabletMediaQuery && this.updateStoryHeight) {
      this.tabletMediaQuery.removeEventListener('change', this.updateStoryHeight);
    }
  }

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