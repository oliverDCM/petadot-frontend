import { Component, computed, input } from '@angular/core';
import { EstadoAnimal, EstadoSolicitud } from '../../core/modelos';
import { textoEstadoAnimal, textoEstadoSolicitud } from '../formato';

/** Indicador visual de estado (animal o solicitud): color + texto, nunca solo color. */
@Component({
  selector: 'app-estado-chip',
  template: `<span class="chip-estado" [class]="'chip-estado estado-' + clase()">{{ texto() }}</span>`,
})
export class EstadoChip {
  readonly estado = input.required<EstadoAnimal | EstadoSolicitud>();

  protected readonly clase = computed(() => this.estado().toLowerCase());
  protected readonly texto = computed(() => {
    const e = this.estado();
    return e === 'PENDIENTE' || e === 'APROBADA' || e === 'RECHAZADA'
      ? textoEstadoSolicitud(e)
      : textoEstadoAnimal(e);
  });
}
