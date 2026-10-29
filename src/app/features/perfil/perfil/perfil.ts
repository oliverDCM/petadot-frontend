import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import { AuthService } from '../../../core/sesion/auth.service';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink],
  template: `
    <div class="angosto">
      @if (auth.sesion(); as s) {
        <div class="panel">
          <h1>{{ s.nombre }}</h1>
          <dl class="perfil-datos">
            <div><dt>Email</dt><dd>{{ s.email }}</dd></div>
            <div><dt>Tipo de cuenta</dt><dd>{{ s.rol === 'VENDEDOR' ? 'Publico animales' : 'Busco un animal' }}</dd></div>
          </dl>
          <div class="acciones">
            @if (s.rol === 'VENDEDOR') {
              <a routerLink="/mis-publicaciones" class="boton boton-verde">Mis publicaciones</a>
              <a routerLink="/solicitudes/recibidas" class="boton boton-secundario">Solicitudes recibidas</a>
            } @else {
              <a routerLink="/solicitudes/mias" class="boton boton-verde">Mis solicitudes</a>
              <a routerLink="/catalogo" class="boton boton-secundario">Ver animales</a>
            }
          </div>
          <hr class="perfil-separador" />
          <div class="acciones">
            <a routerLink="/olvide-contrasena" class="boton boton-secundario boton-chico">Cambiar contraseña</a>
            <button type="button" class="boton boton-secundario boton-chico" (click)="salir()">Cerrar sesión</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .perfil-datos { margin: 0 0 1.5rem; display: grid; gap: 0.75rem; }
    .perfil-datos dt { font-size: 0.85rem; color: var(--tinta-suave); }
    .perfil-datos dd { margin: 0; font-weight: 700; }
    .perfil-separador { border: none; border-top: 1px solid var(--borde); margin: 1.5rem 0; }
  `,
})
export class Perfil {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private avisos = inject(NotificacionService);

  salir(): void {
    this.auth.cerrarSesion();
    this.avisos.info('Cerraste sesión.');
    this.router.navigate(['/login']);
  }
}
