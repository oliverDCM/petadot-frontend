import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { estadoHttp, mensajeDeError } from '../../../core/errores';
import { AuthService } from '../../../core/sesion/auth.service';

@Component({
  selector: 'app-olvide-contrasena',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './olvide-contrasena.html',
})
export class OlvideContrasena {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  protected cargando = signal(false);
  protected error = signal<string | null>(null);
  /** Mensaje genérico del backend: no revela si el email existe (HU-FE-18). */
  protected enviado = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    this.auth.olvideContrasena(this.form.controls.email.value).subscribe({
      next: (r) => {
        this.cargando.set(false);
        this.enviado.set(r.mensaje);
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(
          estadoHttp(e) === 429
            ? 'Ya pediste varios enlaces en la última hora. Espera un rato e intenta de nuevo más tarde.'
            : mensajeDeError(e, 'No se pudo enviar el enlace. Intenta de nuevo.'),
        );
      },
    });
  }
}
