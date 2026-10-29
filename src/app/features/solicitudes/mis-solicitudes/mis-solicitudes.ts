import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { mensajeDeError } from '../../../core/errores';
import { Animal, Solicitud } from '../../../core/modelos';
import { EstadoChip } from '../../../shared/estado/estado-chip';
import { AnimalService } from '../../animales/animal.service';
import { ContactoSolicitud } from '../contacto/contacto-solicitud';
import { SolicitudService } from '../solicitud.service';

/** Seguimiento del adoptante (HU-FE-14). */
@Component({
  selector: 'app-mis-solicitudes',
  imports: [DatePipe, RouterLink, EstadoChip, ContactoSolicitud],
  templateUrl: './mis-solicitudes.html',
  styleUrl: '../solicitudes.scss',
})
export class MisSolicitudes {
  private solicitudService = inject(SolicitudService);
  private animalService = inject(AnimalService);

  protected solicitudes = signal<Solicitud[]>([]);
  protected animales = signal<Map<number, Animal>>(new Map());
  protected cargando = signal(true);
  protected error = signal<string | null>(null);

  /** Aprobadas primero (hay que coordinar), luego pendientes, luego rechazadas. */
  protected readonly ordenadas = computed(() => {
    const peso = { APROBADA: 0, PENDIENTE: 1, RECHAZADA: 2 } as const;
    return [...this.solicitudes()].sort(
      (a, b) => peso[a.estado] - peso[b.estado] || b.fechaSolicitud.localeCompare(a.fechaSolicitud),
    );
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.solicitudService
      .mias()
      .pipe(
        switchMap((solicitudes) => {
          const ids = [...new Set(solicitudes.map((s) => s.animalId))];
          const detalles = ids.map((id) => this.animalService.obtener(id).pipe(catchError(() => of(null))));
          return (detalles.length ? forkJoin(detalles) : of([])).pipe(
            map((animales) => ({ solicitudes, animales: animales.filter((a): a is NonNullable<typeof a> => a !== null) })),
          );
        }),
      )
      .subscribe({
        next: ({ solicitudes, animales }) => {
          this.solicitudes.set(solicitudes);
          this.animales.set(new Map(animales.map((a) => [a.id, a as Animal])));
          this.cargando.set(false);
        },
        error: (e) => {
          this.error.set(mensajeDeError(e, 'No se pudieron cargar tus solicitudes.'));
          this.cargando.set(false);
        },
      });
  }

  nombreAnimal(id: number): string {
    return this.animales().get(id)?.nombre ?? `Animal ${id}`;
  }
}
