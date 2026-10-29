import { Component, ElementRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { enfocarPrimerInvalido } from '../../../shared/foco';
import { Router, RouterLink } from '@angular/router';
import { camposConError, estadoHttp, mensajeDeError } from '../../../core/errores';
import { Rol } from '../../../core/modelos';
import { AuthService } from '../../../core/sesion/auth.service';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
})
export class Registro {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected cargando = signal(false);
  protected error = signal<string | null>(null);
  protected erroresServidor = signal<Partial<Record<string, string>>>({});
  protected verClave = signal(false);

  protected form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    telefono: ['', [Validators.maxLength(20), Validators.pattern(/^[0-9+\s()-]*$/)]],
    ciudad: ['', Validators.maxLength(80)],
    rol: ['ADOPTANTE' as Rol, Validators.required],
  });

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return (c.touched && c.invalid) || !!this.erroresServidor()[campo];
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => enfocarPrimerInvalido(this.host.nativeElement));
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});

    const datos = this.form.getRawValue();
    this.auth.registrar(datos).subscribe({
      // HU-FE-03: después del registro se va al login con el email listo
      next: () =>
        this.router.navigate(['/login'], { state: { email: datos.email.trim(), aviso: 'registrado' } }),
      error: (e) => {
        this.cargando.set(false);
        if (estadoHttp(e) === 409) {
          this.error.set('Ya existe una cuenta con ese email. Inicia sesión o usa otro email.');
        } else {
          this.erroresServidor.set(camposConError(e));
          this.error.set(mensajeDeError(e, 'No se pudo crear la cuenta. Intenta de nuevo.'));
        }
      },
    });
  }
}
