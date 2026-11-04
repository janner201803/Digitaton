import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {

  private authService = inject(AuthService);
  private router = inject(Router);

  async cerrarSesion() {

    const error = await this.authService.cerrarSesion();

    if (!error) {
      await this.router.navigate(['/login']);
    }

  }

}