import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AnimalService, Especie, Sexo, Tipo } from '../animal.service';

@Component({
  selector: 'app-publicar',
  imports: [ReactiveFormsModule],
  templateUrl: './publicar.html',
  styleUrl: './publicar.scss',
})
export class Publicar {
  private fb = inject(FormBuilder);
  private animalService = inject(AnimalService);
  private router = inject(Router);

  cargando = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    especie: ['PERRO' as Especie, Validators.required],
    raza: ['', Validators.maxLength(80)],
    edadMeses: [null as number | null, Validators.min(0)],
    sexo: ['MACHO' as Sexo, Validators.required],
    descripcion: ['', Validators.maxLength(1000)],
    fotoUrl: ['', Validators.maxLength(500)],
    ciudad: ['', Validators.maxLength(80)],
    tipo: ['ADOPCION' as Tipo, Validators.required],
    vacunado: [false],
    esterilizado: [false],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    this.animalService.publicar(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/catalogo']),
      error: (e) => {
        this.cargando.set(false);
        if (e.status === 403) {
          this.error.set('Solo los vendedores pueden publicar animales');
        } else if (e.status === 400) {
          this.error.set('Revisa los datos del formulario');
        } else {
          this.error.set('No se pudo conectar con el servidor');
        }
      },
    });
  }
}