import { Component, ElementRef, computed, effect, inject, input, OnDestroy, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { enfocarPrimerInvalido } from '../../../shared/foco';
import { Router, RouterLink } from '@angular/router';
import { camposConError, estadoHttp, mensajeDeError } from '../../../core/errores';
import { AnimalDatos, AnimalDetalle, Especie, Sexo, TipoPublicacion } from '../../../core/modelos';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import { AuthService } from '../../../core/sesion/auth.service';
import { IMAGEN_POR_DEFECTO } from '../../../shared/formato';
import { AnimalService } from '../animal.service';

export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

/** Mismas reglas que el backend: JPG, PNG o WEBP de hasta 5 MB. */
export function validarImagen(archivo: File): string | null {
  if (!TIPOS_IMAGEN.includes(archivo.type)) {
    return 'Usa una imagen JPG, PNG o WEBP.';
  }
  if (archivo.size > MAX_IMAGEN_BYTES) {
    return 'La imagen pesa más de 5 MB. Elige una más liviana.';
  }
  return null;
}

/** Publicar (ruta /publicar) y editar (ruta /animales/:id/editar) usan el mismo formulario. */
@Component({
  selector: 'app-formulario-animal',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './formulario-animal.html',
  styleUrl: './formulario-animal.scss',
})
export class FormularioAnimal implements OnDestroy {
  private fb = inject(FormBuilder);
  private animalService = inject(AnimalService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private avisos = inject(NotificacionService);

  /** Solo existe al editar. */
  readonly id = input<string>();
  protected readonly editando = computed(() => !!this.id());

  protected original = signal<AnimalDetalle | null>(null);
  protected cargando = signal(false);
  protected guardando = signal(false);
  protected error = signal<string | null>(null);
  /** Motivo por el que no se puede editar (no es tuyo, ya no está disponible...). */
  protected bloqueo = signal<string | null>(null);
  protected erroresServidor = signal<Partial<Record<string, string>>>({});

  protected foto = signal<File | null>(null);
  protected vistaPrevia = signal<string | null>(null);
  protected errorFoto = signal<string | null>(null);
  protected readonly sinFoto = IMAGEN_POR_DEFECTO;

  protected form = this.fb.group({
    nombre: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    especie: this.fb.nonNullable.control<Especie>('PERRO', Validators.required),
    sexo: this.fb.nonNullable.control<Sexo>('MACHO', Validators.required),
    raza: this.fb.nonNullable.control('', Validators.maxLength(80)),
    edadMeses: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(600), Validators.pattern(/^\d+$/)]),
    tipo: this.fb.nonNullable.control<TipoPublicacion>('ADOPCION', Validators.required),
    ciudad: this.fb.nonNullable.control('', Validators.maxLength(80)),
    descripcion: this.fb.nonNullable.control('', Validators.maxLength(1000)),
    vacunado: this.fb.nonNullable.control(false),
    esterilizado: this.fb.nonNullable.control(false),
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => (id ? this.cargar(Number(id)) : this.reiniciar()));
    });
  }

  ngOnDestroy(): void {
    this.liberarVistaPrevia();
  }

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return (c.touched && c.invalid) || !!this.erroresServidor()[campo];
  }

  elegirFoto(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0] ?? null;
    this.errorFoto.set(null);
    if (!archivo) {
      return;
    }
    const problema = validarImagen(archivo);
    if (problema) {
      this.errorFoto.set(problema);
      entrada.value = '';
      return;
    }
    this.liberarVistaPrevia();
    this.foto.set(archivo);
    this.vistaPrevia.set(URL.createObjectURL(archivo));
  }

  quitarFoto(entrada: HTMLInputElement): void {
    entrada.value = '';
    this.liberarVistaPrevia();
    this.foto.set(null);
    this.vistaPrevia.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => enfocarPrimerInvalido(this.host.nativeElement));
      this.error.set('Revisa los campos marcados.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});

    const v = this.form.getRawValue();
    const datos: AnimalDatos = {
      nombre: v.nombre.trim(),
      especie: v.especie,
      sexo: v.sexo,
      raza: v.raza.trim() || null,
      edadMeses: v.edadMeses === null || (v.edadMeses as unknown) === '' ? null : Number(v.edadMeses),
      tipo: v.tipo,
      ciudad: v.ciudad.trim() || null,
      descripcion: v.descripcion.trim() || null,
      vacunado: v.vacunado,
      esterilizado: v.esterilizado,
      // Al editar sin foto nueva, null conserva la foto actual en el backend
      fotoUrl: null,
    };

    const id = this.original()?.id;
    const peticion = id
      ? this.animalService.editar(id, datos, this.foto())
      : this.animalService.publicar(datos, this.foto());

    peticion.subscribe({
      next: (animal) => {
        this.avisos.exito(id ? `Guardaste los cambios de ${animal.nombre}.` : `${animal.nombre} ya está publicado.`);
        this.router.navigate(['/mis-publicaciones']);
      },
      error: (e) => {
        this.guardando.set(false);
        this.erroresServidor.set(camposConError(e));
        if (estadoHttp(e) === 502) {
          this.error.set('No se pudo subir la foto. Intenta de nuevo o guarda sin foto.');
        } else {
          this.error.set(mensajeDeError(e, 'No se pudo guardar. Intenta de nuevo.'));
        }
      },
    });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.bloqueo.set(null);
    this.animalService.obtener(id).subscribe({
      next: (a) => {
        this.cargando.set(false);
        if (a.vendedorId !== this.auth.usuarioId()) {
          this.bloqueo.set('Solo quien publicó este animal puede editarlo.');
          return;
        }
        if (a.estado !== 'DISPONIBLE') {
          this.bloqueo.set('Solo se pueden editar animales disponibles. Este ya tiene un acuerdo en curso o no está publicado.');
          return;
        }
        this.original.set(a);
        this.form.setValue({
          nombre: a.nombre,
          especie: a.especie,
          sexo: a.sexo,
          raza: a.raza ?? '',
          edadMeses: a.edadMeses,
          tipo: a.tipo,
          ciudad: a.ciudad ?? '',
          descripcion: a.descripcion ?? '',
          vacunado: a.vacunado,
          esterilizado: a.esterilizado,
        });
      },
      error: (e) => {
        this.cargando.set(false);
        this.bloqueo.set(
          estadoHttp(e) === 404 ? 'Este animal no existe.' : mensajeDeError(e, 'No se pudo cargar el animal.'),
        );
      },
    });
  }

  private reiniciar(): void {
    this.original.set(null);
    this.bloqueo.set(null);
    this.form.reset();
  }

  private liberarVistaPrevia(): void {
    const url = this.vistaPrevia();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}
