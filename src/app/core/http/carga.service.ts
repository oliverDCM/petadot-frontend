import { computed, Injectable, signal } from '@angular/core';

/** Cuenta las peticiones HTTP en curso para mostrar la barra de carga global. */
@Injectable({ providedIn: 'root' })
export class CargaService {
  private pendientes = signal(0);
  readonly activa = computed(() => this.pendientes() > 0);

  iniciar(): void {
    this.pendientes.update((n) => n + 1);
  }

  terminar(): void {
    this.pendientes.update((n) => Math.max(0, n - 1));
  }
}
