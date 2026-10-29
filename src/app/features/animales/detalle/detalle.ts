import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { estadoHttp, mensajeDeError } from '../../../core/errores';
import { AnimalDetalle, Solicitud } from '../../../core/modelos';
import { AuthService } from '../../../core/sesion/auth.service';
import { EstadoChip } from '../../../shared/estado/estado-chip';
import { describirAnimal, IMAGEN_POR_DEFECTO, textoEdad, textoSexo, textoTipo } from '../../../shared/formato';
import { EnviarSolicitud } from '../../solicitudes/enviar-solicitud/enviar-solicitud';
import { esActiva, SolicitudService } from '../../solicitudes/solicitud.service';
import { AnimalService } from '../animal.service';

@Component({
  selector: 'app-detalle',
  imports: [DatePipe, RouterLink, EnviarSolicitud, EstadoChip],
  templateUrl: './detalle.html',
  styleUrl: './detalle.scss',
})
export class Detalle {
  private animalService = inject(AnimalService);
  private solicitudService = inject(SolicitudService);
  protected auth = inject(AuthService);

  /** :id de la ruta /animales/:id */
  readonly id = input.required<string>();

  protected animal = signal<AnimalDetalle | null>(null);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected noExiste = signal(false);
  /** Solicitud activa del adoptante por este animal, si ya envió una. */
  protected miSolicitud = signal<Solicitud | null>(null);

  protected readonly sinFoto = IMAGEN_POR_DEFECTO;
  protected readonly esMio = computed(() => {
    const a = this.animal();
    return !!a && this.auth.rol() === 'VENDEDOR' && a.vendedorId === this.auth.usuarioId();
  });
  protected readonly descripcion = computed(() => {
    const a = this.animal();
    return a ? describirAnimal(a.especie, a.sexo) : '';
  });

  protected readonly textoEdad = textoEdad;
  protected readonly textoSexo = textoSexo;
  protected readonly textoTipo = textoTipo;

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.cargar(id));
    });
  }

  alEnviar(solicitud: Solicitud): void {
    this.miSolicitud.set(solicitud);
  }

  usarImagenPorDefecto(evento: Event): void {
    const img = evento.target as HTMLImageElement;
    if (!img.src.endsWith(IMAGEN_POR_DEFECTO)) {
      img.src = IMAGEN_POR_DEFECTO;
    }
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.noExiste.set(false);
    if (!Number.isInteger(id) || id <= 0) {
      this.noExiste.set(true);
      this.cargando.set(false);
      return;
    }
    this.animalService.obtener(id).subscribe({
      next: (a) => {
        this.animal.set(a);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        if (estadoHttp(e) === 404) {
          this.noExiste.set(true);
        } else {
          this.error.set(mensajeDeError(e, 'No se pudo cargar este animal.'));
        }
      },
    });

    // Para no ofrecer el formulario si el adoptante ya tiene una solicitud activa (HU-FE-11)
    if (this.auth.rol() === 'ADOPTANTE') {
      this.solicitudService.mias().subscribe({
        next: (lista) => this.miSolicitud.set(lista.find((s) => s.animalId === id && esActiva(s)) ?? null),
        error: () => this.miSolicitud.set(null),
      });
    }
  }
}
