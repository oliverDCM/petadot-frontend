import { Component, inject } from '@angular/core';
import { NotificacionService } from '../../core/notificaciones/notificacion.service';

@Component({
  selector: 'app-avisos',
  template: `
    <div class="avisos" aria-live="polite" aria-atomic="false">
      @for (a of notificaciones.avisos(); track a.id) {
        <div class="aviso" [class]="'aviso aviso-' + a.tipo" [attr.role]="a.tipo === 'error' ? 'alert' : 'status'">
          <span class="aviso-texto">{{ a.texto }}</span>
          <button type="button" class="aviso-cerrar" (click)="notificaciones.cerrar(a.id)" aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      }
    </div>
  `,
})
export class Avisos {
  protected notificaciones = inject(NotificacionService);
}
