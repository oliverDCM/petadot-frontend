import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import { Decision, Solicitud, SolicitudService } from '../solicitud.service';

@Component({
  selector: 'app-solicitudes',
  imports: [DatePipe],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.scss',
})
export class Solicitudes {
  private solicitudService = inject(SolicitudService);
  protected auth = inject(AuthService);

  solicitudes = signal<Solicitud[]>([]);
  cargando = signal(true);
  error = signal(false);

  procesando = signal<number | null>(null);
  aviso = signal<string | null>(null);
  avisoError = signal<string | null>(null);

  constructor() {
    const peticion =
      this.auth.obtenerRol() === 'VENDEDOR'
        ? this.solicitudService.recibidas()
        : this.solicitudService.mias();

    peticion.subscribe({
      next: (lista) => {
        this.solicitudes.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  decidir(id: number, decision: Decision): void {
    this.procesando.set(id);
    this.aviso.set(null);
    this.avisoError.set(null);

    this.solicitudService.decidir(id, decision).subscribe({
      next: (actualizada) => {
        this.solicitudes.update((lista) =>
          lista.map((s) =>
            s.id === id
              ? { ...s, estado: actualizada.estado, fechaDecision: actualizada.fechaDecision }
              : s,
          ),
        );
        this.procesando.set(null);
        this.aviso.set(decision === 'APROBAR' ? 'Solicitud aprobada' : 'Solicitud rechazada');
      },
      error: (e) => {
        this.procesando.set(null);
        this.avisoError.set(e.error?.error ?? 'No se pudo registrar la decisión');
      },
    });
  }

  etiqueta(estado: string): string {
    if (estado === 'PENDIENTE') {
      return 'Pendiente';
    }
    if (estado === 'APROBADA') {
      return 'Aprobada';
    }
    if (estado === 'RECHAZADA') {
      return 'Rechazada';
    }
    return estado;
  }
}