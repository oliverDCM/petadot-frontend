import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { estadoHttp, mensajeDeError } from '../../../core/errores';
import { AuthService } from '../../../core/sesion/auth.service';

/** Valida que "nueva" y "confirmacion" sean iguales. */
export function clavesCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const nueva = grupo.get('nueva')?.value;
  const confirmacion = grupo.get('confirmacion')?.value;
  return nueva && confirmacion && nueva !== confirmacion ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-restablecer-contrasena',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './restablecer-contrasena.html',
})
export class RestablecerContrasena implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** El token se guarda en memoria y se quita de la URL (HU-FE-19). */
  protected token = signal<string | null>(null);
  protected cargando = signal(false);
  protected error = signal<string | null>(null);
  protected tokenInvalido = signal(false);
  protected verClave = signal(false);

  protected form = this.fb.nonNullable.group(
    {
      nueva: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacion: ['', Validators.required],
    },
    { validators: clavesCoinciden },
  );

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.token.set(token && token.trim() ? token.trim() : null);
    if (token !== null) {
      // Limpia el token de la barra de direcciones y del historial
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  enviar(): void {
    const token = this.token();
    if (!token) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    this.auth.restablecerContrasena(token, this.form.controls.nueva.value).subscribe({
      next: () => this.router.navigate(['/login'], { state: { aviso: 'restablecida' } }),
      error: (e) => {
        this.cargando.set(false);
        this.tokenInvalido.set(estadoHttp(e) === 400 && !mensajeDeError(e, '').includes('contraseña debe'));
        this.error.set(mensajeDeError(e, 'No se pudo cambiar la contraseña. Intenta de nuevo.'));
      },
    });
  }
}
