import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NotificacionService } from './core/notificaciones/notificacion.service';
import { AuthService } from './core/sesion/auth.service';
import { Avisos } from './shared/avisos/avisos';
import { BarraCarga } from './shared/barra-carga/barra-carga';
import { DialogoConfirmacion } from './shared/confirmacion/dialogo-confirmacion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Avisos, BarraCarga, DialogoConfirmacion],
  templateUrl: './app.html',
})
export class App {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private avisos = inject(NotificacionService);

  protected menuAbierto = signal(false);
  protected readonly anio = new Date().getFullYear();

  constructor() {
    // En móvil, el menú se cierra al navegar
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.menuAbierto.set(false));
  }

  alternarMenu(): void {
    this.menuAbierto.update((v) => !v);
  }

  salir(): void {
    this.auth.cerrarSesion();
    this.avisos.info('Cerraste sesión.');
    this.router.navigate(['/login']);
  }
}
