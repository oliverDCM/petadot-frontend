import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { mensajeDeError } from '../../../core/errores';
import { Animal, Decision, EstadoSolicitud, Solicitud } from '../../../core/modelos';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import { ConfirmacionService } from '../../../shared/confirmacion/confirmacion.service';
import { EstadoChip } from '../../../shared/estado/estado-chip';
import { AnimalService } from '../../animales/animal.service';
import { UsuarioService } from '../../perfil/usuario.service';
import { ContactoSolicitud } from '../contacto/contacto-solicitud';
import { SolicitudService } from '../solicitud.service';

const ESTADOS: EstadoSolicitud[] = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];

/** Bandeja del vendedor (HU-FE-12 y HU-FE-13). */
@Component({
  selector: 'app-solicitudes-recibidas',
  imports: [DatePipe, RouterLink, EstadoChip, ContactoSolicitud],
  templateUrl: './recibidas.html',
  styleUrl: '../solicitudes.scss',
})
export class SolicitudesRecibidas {
  private solicitudService = inject(SolicitudService);
  private animalService = inject(AnimalService);
  private usuarioService = inject(UsuarioService);
  private confirmacion = inject(ConfirmacionService);
  private avisos = inject(NotificacionService);
  private router = inject(Router);

  /** ?estado=PENDIENTE&animal=10 */
  readonly estado = input<string>();
  readonly animal = input<string>();

  protected solicitudes = signal<Solicitud[]>([]);
  protected animales = signal<Map<number, Animal>>(new Map());
  protected nombres = signal<Map<number, string>>(new Map());
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected procesando = signal<number | null>(null);

  protected readonly filtros: { valor: EstadoSolicitud | null; texto: string }[] = [
    { valor: null, texto: 'Todas' },
    { valor: 'PENDIENTE', texto: 'Pendientes' },
    { valor: 'APROBADA', texto: 'Aprobadas' },
    { valor: 'RECHAZADA', texto: 'Rechazadas' },
  ];

  protected readonly estadoActual = computed(() =>
    ESTADOS.includes(this.estado() as EstadoSolicitud) ? (this.estado() as EstadoSolicitud) : null,
  );
  protected readonly animalActual = computed(() => {
    const id = Number(this.animal());
    return Number.isInteger(id) && id > 0 ? id : null;
  });

  /** Solicitudes del animal elegido (si hay), antes de filtrar por estado: base de los contadores. */
  private readonly delAnimal = computed(() => {
    const id = this.animalActual();
    return id ? this.solicitudes().filter((s) => s.animalId === id) : this.solicitudes();
  });

  protected readonly visibles = computed(() => {
    const estado = this.estadoActual();
    return this.delAnimal()
      .filter((s) => !estado || s.estado === estado)
      .sort((a, b) => (a.estado === 'PENDIENTE' ? -1 : 0) - (b.estado === 'PENDIENTE' ? -1 : 0) || b.fechaSolicitud.localeCompare(a.fechaSolicitud));
  });

  protected readonly cuenta = computed(() => {
    const c: Partial<Record<string, number>> = { todas: this.delAnimal().length };
    for (const s of this.delAnimal()) {
      c[s.estado] = (c[s.estado] ?? 0) + 1;
    }
    return c;
  });

  protected readonly listaAnimales = computed(() => [...this.animales().values()].sort((a, b) => a.nombre.localeCompare(b.nombre)));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      solicitudes: this.solicitudService.recibidas(),
      animales: this.animalService.misPublicaciones().pipe(catchError(() => of([] as Animal[]))),
    })
      .pipe(
        switchMap(({ solicitudes, animales }) => {
          const ids = [...new Set(solicitudes.map((s) => s.solicitanteId))];
          const perfiles = ids.map((id) =>
            this.usuarioService.obtenerPerfilPublico(id).pipe(
              map((p) => [id, p.nombre] as const),
              catchError(() => of([id, `Solicitante ${id}`] as const)),
            ),
          );
          return (perfiles.length ? forkJoin(perfiles) : of([])).pipe(
            map((nombres) => ({ solicitudes, animales, nombres })),
          );
        }),
      )
      .subscribe({
        next: ({ solicitudes, animales, nombres }) => {
          this.solicitudes.set(solicitudes);
          this.animales.set(new Map(animales.map((a) => [a.id, a])));
          this.nombres.set(new Map(nombres));
          this.cargando.set(false);
        },
        error: (e) => {
          this.error.set(mensajeDeError(e, 'No se pudieron cargar las solicitudes.'));
          this.cargando.set(false);
        },
      });
  }

  nombreAnimal(id: number): string {
    return this.animales().get(id)?.nombre ?? `Animal ${id}`;
  }

  nombreSolicitante(id: number): string {
    return this.nombres().get(id) ?? `Solicitante ${id}`;
  }

  filtrarEstado(estado: EstadoSolicitud | null): void {
    this.router.navigate([], { queryParams: { estado }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  filtrarAnimal(valor: string): void {
    this.router.navigate([], { queryParams: { animal: valor || null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  async decidir(s: Solicitud, decision: Decision): Promise<void> {
    const animal = this.nombreAnimal(s.animalId);
    const persona = this.nombreSolicitante(s.solicitanteId);
    const otrasPendientes = this.solicitudes().filter(
      (o) => o.animalId === s.animalId && o.id !== s.id && o.estado === 'PENDIENTE',
    ).length;

    const ok = await this.confirmacion.preguntar(
      decision === 'APROBAR'
        ? {
            titulo: `¿Aprobar la solicitud de ${persona}?`,
            mensaje:
              `${animal} quedará reservado para ${persona} y los dos recibirán un correo con el contacto del otro.` +
              (otrasPendientes === 1
                ? ' La otra solicitud pendiente se rechazará automáticamente.'
                : otrasPendientes > 1
                  ? ` Las otras ${otrasPendientes} solicitudes pendientes se rechazarán automáticamente.`
                  : ''),
            aceptar: 'Aprobar solicitud',
          }
        : {
            titulo: `¿Rechazar la solicitud de ${persona}?`,
            mensaje: `${persona} verá la solicitud como rechazada. Esta acción no se puede deshacer.`,
            aceptar: 'Rechazar solicitud',
            peligro: true,
          },
    );
    if (!ok) {
      return;
    }

    this.procesando.set(s.id);
    this.solicitudService.decidir(s.id, decision).subscribe({
      next: (actualizada) => {
        // Actualiza la lista sin recargar: al aprobar, el backend rechaza las demás pendientes del animal
        this.solicitudes.update((lista) =>
          lista.map((o) => {
            if (o.id === actualizada.id) {
              return actualizada;
            }
            if (decision === 'APROBAR' && o.animalId === s.animalId && o.estado === 'PENDIENTE') {
              return { ...o, estado: 'RECHAZADA', fechaDecision: actualizada.fechaDecision };
            }
            return o;
          }),
        );
        if (decision === 'APROBAR') {
          this.animales.update((m) => {
            const a = m.get(s.animalId);
            return a ? new Map(m).set(a.id, { ...a, estado: 'RESERVADO' }) : m;
          });
        }
        this.procesando.set(null);
        this.avisos.exito(
          decision === 'APROBAR'
            ? `Aprobaste la solicitud de ${persona}. ${animal} quedó reservado y les enviamos un correo a los dos.`
            : `Rechazaste la solicitud de ${persona}.`,
        );
      },
      error: (e) => {
        this.procesando.set(null);
        this.avisos.error(mensajeDeError(e, 'No se pudo registrar la decisión.'));
      },
    });
  }
}
