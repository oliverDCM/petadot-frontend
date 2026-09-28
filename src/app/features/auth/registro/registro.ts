import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService, Rol } from '../../../core/auth.service';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  cargando = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    telefono: [''],
    ciudad: [''],
    rol: ['ADOPTANTE' as Rol, Validators.required],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    const datos = this.form.getRawValue();

    // Primero registra y, si sale bien, inicia sesión con los mismos datos
    this.auth
      .registrar(datos)
      .pipe(switchMap(() => this.auth.login({ email: datos.email, password: datos.password })))
      .subscribe({
        next: () => this.router.navigate(['/catalogo']),
        error: (e) => {
          this.cargando.set(false);
          if (e.status === 409) {
            this.error.set('Ese email ya está registrado');
          } else if (e.status === 400) {
            this.error.set('Revisa los datos del formulario');
          } else {
            this.error.set('No se pudo conectar con el servidor');
          }
        },
      });
  }
}