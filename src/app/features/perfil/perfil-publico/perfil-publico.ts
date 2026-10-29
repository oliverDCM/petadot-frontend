import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { estadoHttp, mensajeDeError } from '../../../core/errores';
import { PerfilPublico } from '../../../core/modelos';
import { UsuarioService } from '../usuario.service';

/** Perfil público de un solicitante (HU-FE-15): solo nombre, ciudad y rol. */
@Component({
  selector: 'app-perfil-publico',
  imports: [RouterLink],
  template: `
    <div class="angosto">
      <a routerLink="/solicitudes/recibidas" class="volver">Volver a solicitudes recibidas</a>
      @if (cargando()) {
        <p class="cargando" role="status">Cargando perfil…</p>
      } @else if (error()) {
        <div class="mensaje mensaje-error" role="alert">{{ error() }}</div>
      } @else if (perfil(); as p) {
        <div class="panel">
          <h1>{{ p.nombre }}</h1>
          <dl class="perfil-datos">
            <div><dt>Ciudad</dt><dd>{{ p.ciudad || 'No la indicó' }}</dd></div>
            <div><dt>Tipo de cuenta</dt><dd>{{ p.rol === 'ADOPTANTE' ? 'Busca un animal' : 'Publica animales' }}</dd></div>
          </dl>
          <p class="texto-suave">El email y el celular solo se muestran cuando apruebas una de sus solicitudes.</p>
        </div>
      }
    </div>
  `,
  styles: `
    .perfil-datos { margin: 0 0 1.25rem; display: grid; gap: 0.75rem; }
    .perfil-datos dt { font-size: 0.85rem; color: var(--tinta-suave); }
    .perfil-datos dd { margin: 0; font-weight: 700; }
  `,
})
export class PerfilPublicoPagina {
  private usuarioService = inject(UsuarioService);

  readonly id = input.required<string>();

  protected perfil = signal<PerfilPublico | null>(null);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.cargar(id));
    });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.usuarioService.obtenerPerfilPublico(id).subscribe({
      next: (p) => {
        this.perfil.set(p);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        const estado = estadoHttp(e);
        this.error.set(
          estado === 403
            ? 'Solo puedes ver el perfil de personas que te enviaron una solicitud.'
            : estado === 404
              ? 'Este usuario no existe.'
              : mensajeDeError(e, 'No se pudo cargar el perfil.'),
        );
      },
    });
  }
}
