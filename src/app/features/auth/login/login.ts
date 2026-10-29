import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { estadoHttp, mensajeDeError } from '../../../core/errores';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import { AuthService } from '../../../core/sesion/auth.service';

/** Mensajes que otras pantallas dejan al navegar al login (registro y restablecer contraseña). */
interface EstadoLogin {
  email?: string;
  aviso?: 'registrado' | 'restablecida';
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private avisos = inject(NotificacionService);

  /** Página a la que volver después de entrar (la pone el authGuard). */
  readonly returnUrl = input<string>();

  protected cargando = signal(false);
  protected error = signal<string | null>(null);
  protected verClave = signal(false);
  protected aviso: EstadoLogin['aviso'];

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    const estado = (typeof history !== 'undefined' && history.state ? history.state : {}) as EstadoLogin;
    this.aviso = estado.aviso;
    if (estado.email) {
      this.form.controls.email.setValue(estado.email);
    }
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (sesion) => {
        this.avisos.exito(`Hola, ${sesion.nombre}.`);
        const destino = this.returnUrl();
        this.router.navigateByUrl(destino && destino.startsWith('/') ? destino : '/catalogo');
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(
          estadoHttp(e) === 401
            ? 'El email o la contraseña no coinciden. Revisa los datos e intenta de nuevo.'
            : mensajeDeError(e, 'No se pudo iniciar sesión. Intenta de nuevo.'),
        );
      },
    });
  }
}
