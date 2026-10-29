import { Component, computed, inject, input, signal } from '@angular/core';
import { estadoHttp, mensajeDeError } from '../../../core/errores';
import { Contacto } from '../../../core/modelos';
import { enlaceCorreo, enlaceWhatsApp } from '../../../shared/formato';
import { SolicitudService } from '../solicitud.service';

/** Datos de contacto de la otra parte en una solicitud aprobada (HU-FE-20). */
@Component({
  selector: 'app-contacto-solicitud',
  template: `
    @if (!contacto() && !error()) {
      <button type="button" class="boton boton-verde boton-chico" (click)="ver()" [disabled]="cargando()">
        {{ cargando() ? 'Cargando contacto…' : 'Ver datos de contacto' }}
      </button>
    }
    @if (error()) {
      <div class="mensaje mensaje-error" role="alert">{{ error() }}</div>
    }
    @if (contacto(); as c) {
      <div class="contacto" role="region" [attr.aria-label]="'Contacto de ' + c.nombre">
        <p class="contacto-nombre">{{ c.nombre }}{{ c.ciudad ? ', ' + c.ciudad : '' }}</p>
        <dl class="contacto-datos">
          <div><dt>Email</dt><dd><a [href]="correo()">{{ c.email }}</a></dd></div>
          <div><dt>Celular</dt><dd>{{ c.telefono || 'No lo registró' }}</dd></div>
        </dl>
        <div class="acciones">
          @if (whatsapp(); as wa) {
            <a class="boton boton-verde boton-chico" [href]="wa" target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>
          }
          <a class="boton boton-secundario boton-chico" [href]="correo()">Enviar correo</a>
        </div>
        <p class="contacto-privacidad">Usa estos datos solo para coordinar la entrega de {{ nombreAnimal() }}. No los compartas.</p>
      </div>
    }
  `,
  styles: `
    .contacto { margin-top: 0.5rem; padding: 1rem 1.1rem; border-radius: 14px; background: var(--verde-claro); }
    .contacto-nombre { font-weight: 700; margin: 0 0 0.5rem; }
    .contacto-datos { margin: 0 0 0.9rem; display: grid; gap: 0.35rem; }
    .contacto-datos div { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .contacto-datos dt { color: var(--tinta-suave); min-width: 4.5rem; }
    .contacto-datos dd { margin: 0; font-weight: 700; overflow-wrap: anywhere; }
    .contacto-privacidad { margin: 0.9rem 0 0; font-size: 0.85rem; color: var(--tinta-suave); }
  `,
})
export class ContactoSolicitud {
  private solicitudService = inject(SolicitudService);

  readonly solicitudId = input.required<number>();
  readonly nombreAnimal = input.required<string>();

  protected contacto = signal<Contacto | null>(null);
  protected cargando = signal(false);
  protected error = signal<string | null>(null);

  protected readonly whatsapp = computed(() => {
    const c = this.contacto();
    return c ? enlaceWhatsApp(c.telefono, `Hola ${c.nombre}, te escribo por la solicitud de ${this.nombreAnimal()} en PetAdopt.`) : null;
  });
  protected readonly correo = computed(() => {
    const c = this.contacto();
    return c ? enlaceCorreo(c.email, `PetAdopt: entrega de ${this.nombreAnimal()}`) : '';
  });

  ver(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.solicitudService.contacto(this.solicitudId()).subscribe({
      next: (c) => {
        this.contacto.set(c);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(
          estadoHttp(e) === 403
            ? 'Los datos de contacto solo están disponibles mientras la solicitud esté aprobada.'
            : mensajeDeError(e, 'No se pudieron cargar los datos de contacto.'),
        );
      },
    });
  }
}
