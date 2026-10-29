import { Component, inject } from '@angular/core';
import { CargaService } from '../../core/http/carga.service';

@Component({
  selector: 'app-barra-carga',
  template: `
    @if (carga.activa()) {
      <div class="barra-carga" role="progressbar" aria-label="Cargando"></div>
    }
  `,
})
export class BarraCarga {
  protected carga = inject(CargaService);
}
