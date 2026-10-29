import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { estadoHttp, mensajeDeError } from '../../../core/errores';
import { Solicitud } from '../../../core/modelos';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import { SolicitudService } from '../solicitud.service';

export const MAX_MENSAJE = 500;

/** Formulario para enviar una solicitud de adopción o compra (HU-FE-11). */
@Component({
  selector: 'app-enviar-solicitud',
  imports: [ReactiveFormsModule],
  template: `
    <form class="formulario" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
      <div class="campo" [class.invalido]="form.controls.mensaje.touched && form.controls.mensaje.invalid">
        <label for="mensaje-solicitud">Cuéntale a quien publicó por qué quieres a {{ nombreAnimal() }}</label>
        <textarea
          id="mensaje-solicitud"
          rows="5"
          formControlName="mensaje"
          [attr.maxlength]="max"
          placeholder="Ej. Tengo patio cerrado, vivo con mi familia y ya tuve perros."
          aria-describedby="mensaje-contador"
        ></textarea>
        <p class="ayuda" id="mensaje-contador">{{ form.controls.mensaje.value.length }} de {{ max }} caracteres</p>
        @if (form.controls.mensaje.touched && form.controls.mensaje.invalid) {
          <p class="error-campo">Escribe un mensaje de al menos 10 caracteres</p>
        }
      </div>
      @if (error()) {
        <div class="mensaje mensaje-error" role="alert">{{ error() }}</div>
      }
      <button class="boton boton-primario boton-ancho" type="submit" [disabled]="enviando()">
        {{ enviando() ? 'Enviando solicitud…' : 'Enviar solicitud' }}
      </button>
    </form>
  `,
})
export class EnviarSolicitud {
  private fb = inject(FormBuilder);
  private solicitudService = inject(SolicitudService);
  private avisos = inject(NotificacionService);

  readonly animalId = input.required<number>();
  readonly nombreAnimal = input.required<string>();
  readonly enviada = output<Solicitud>();

  protected readonly max = MAX_MENSAJE;
  protected enviando = signal(false);
  protected error = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    mensaje: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(MAX_MENSAJE)]],
  });

  enviar(): void {
    const texto = this.form.controls.mensaje.value.trim();
    this.form.controls.mensaje.setValue(texto);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    this.solicitudService.enviar(this.animalId(), texto).subscribe({
      next: (solicitud) => {
        this.enviando.set(false);
        this.avisos.exito(`Solicitud enviada. Te avisaremos por correo cuando respondan por ${this.nombreAnimal()}.`);
        this.enviada.emit(solicitud);
      },
      error: (e) => {
        this.enviando.set(false);
        this.error.set(
          estadoHttp(e) === 409
            ? mensajeDeError(e, 'Ya tienes una solicitud activa por este animal.')
            : mensajeDeError(e, 'No se pudo enviar la solicitud. Intenta de nuevo.'),
        );
      },
    });
  }
}
