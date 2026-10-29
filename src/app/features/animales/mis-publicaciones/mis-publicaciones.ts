import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { mensajeDeError } from '../../../core/errores';
import { Animal, EstadoAnimal, Solicitud } from '../../../core/modelos';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import { ConfirmacionService } from '../../../shared/confirmacion/confirmacion.service';
import { EstadoChip } from '../../../shared/estado/estado-chip';
import { describirAnimal, IMAGEN_POR_DEFECTO, transicionesPermitidas } from '../../../shared/formato';
import { SolicitudService } from '../../solicitudes/solicitud.service';
import { AnimalService } from '../animal.service';

interface AccionEstado {
  destino: EstadoAnimal;
  texto: string;
  titulo: string;
  explicacion: string;
  peligro: boolean;
  /** Solo la acción esperada (marcar la entrega) se destaca. */
  principal: boolean;
}

const ORDEN: Record<EstadoAnimal, number> = { RESERVADO: 0, DISPONIBLE: 1, ADOPTADO: 2, RETIRADO: 3 };

/** Gestión de los animales del vendedor (HU-FE-10) con cambio de estado y edición. */
@Component({
  selector: 'app-mis-publicaciones',
  imports: [DatePipe, RouterLink, EstadoChip],
  templateUrl: './mis-publicaciones.html',
  styleUrl: './mis-publicaciones.scss',
})
export class MisPublicaciones {
  private animalService = inject(AnimalService);
  private solicitudService = inject(SolicitudService);
  private confirmacion = inject(ConfirmacionService);
  private avisos = inject(NotificacionService);

  protected animales = signal<Animal[]>([]);
  private solicitudes = signal<Solicitud[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected procesando = signal<number | null>(null);

  protected readonly sinFoto = IMAGEN_POR_DEFECTO;
  protected readonly describir = describirAnimal;

  /** Reservados primero (hay una entrega por coordinar), luego disponibles. */
  protected readonly ordenados = computed(() =>
    [...this.animales()].sort(
      (a, b) => ORDEN[a.estado] - ORDEN[b.estado] || b.fechaPublicacion.localeCompare(a.fechaPublicacion),
    ),
  );

  protected readonly pendientesPorAnimal = computed(() => {
    const cuenta = new Map<number, number>();
    for (const s of this.solicitudes()) {
      if (s.estado === 'PENDIENTE') {
        cuenta.set(s.animalId, (cuenta.get(s.animalId) ?? 0) + 1);
      }
    }
    return cuenta;
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      animales: this.animalService.misPublicaciones(),
      solicitudes: this.solicitudService.recibidas().pipe(catchError(() => of([] as Solicitud[]))),
    }).subscribe({
      next: ({ animales, solicitudes }) => {
        this.animales.set(animales);
        this.solicitudes.set(solicitudes);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e, 'No se pudieron cargar tus publicaciones.'));
        this.cargando.set(false);
      },
    });
  }

  acciones(animal: Animal): AccionEstado[] {
    return transicionesPermitidas(animal.estado).map((destino) => this.accion(animal, destino));
  }

  async cambiarEstado(animal: Animal, accion: AccionEstado): Promise<void> {
    const ok = await this.confirmacion.preguntar({
      titulo: accion.titulo,
      mensaje: accion.explicacion,
      aceptar: accion.texto,
      peligro: accion.peligro,
    });
    if (!ok) {
      return;
    }
    this.procesando.set(animal.id);
    this.animalService.cambiarEstado(animal.id, accion.destino).subscribe({
      next: (actualizado) => {
        this.animales.update((lista) => lista.map((a) => (a.id === actualizado.id ? actualizado : a)));
        this.procesando.set(null);
        this.avisos.exito(this.textoExito(actualizado));
      },
      error: (e) => {
        this.procesando.set(null);
        this.avisos.error(mensajeDeError(e, 'No se pudo cambiar el estado.'));
      },
    });
  }

  private accion(animal: Animal, destino: EstadoAnimal): AccionEstado {
    switch (destino) {
      case 'ADOPTADO':
        return {
          destino,
          texto: 'Marcar como entregado',
          titulo: `¿Ya entregaste a ${animal.nombre}?`,
          explicacion: `${animal.nombre} quedará como ${animal.tipo === 'VENTA' ? 'vendido' : 'adoptado'}. Esta acción no se puede deshacer.`,
          peligro: false,
          principal: true,
        };
      case 'DISPONIBLE':
        return {
          destino,
          texto: 'Volver a publicar',
          titulo: `¿Volver a publicar a ${animal.nombre}?`,
          explicacion: `Usa esta opción si el acuerdo no se concretó. ${animal.nombre} vuelve al catálogo y podrá recibir solicitudes nuevas.`,
          peligro: false,
          principal: false,
        };
      default:
        return {
          destino,
          texto: 'Retirar publicación',
          titulo: `¿Retirar a ${animal.nombre}?`,
          explicacion: `${animal.nombre} dejará de aparecer en el catálogo y no se podrá volver a publicar.`,
          peligro: true,
          principal: false,
        };
    }
  }

  private textoExito(a: Animal): string {
    switch (a.estado) {
      case 'ADOPTADO':
        return `${a.nombre} quedó marcado como entregado.`;
      case 'DISPONIBLE':
        return `${a.nombre} volvió al catálogo.`;
      case 'RETIRADO':
        return `Retiraste la publicación de ${a.nombre}.`;
      default:
        return 'Estado actualizado.';
    }
  }
}
