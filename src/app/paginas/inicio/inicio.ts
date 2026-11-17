import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Animal } from '../../core/modelos';
import { AuthService } from '../../core/sesion/auth.service';
import { AnimalService } from '../../features/animales/animal.service';
import { describirAnimal, IMAGEN_POR_DEFECTO, textoEdad } from '../../shared/formato';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  private animalService = inject(AnimalService);
  protected auth = inject(AuthService);

  /** Los tres animales publicados más recientes, para la portada. */
  protected recientes = signal<Animal[]>([]);
  protected total = signal<number | null>(null);

  protected readonly sinFoto = IMAGEN_POR_DEFECTO;
  protected readonly describir = describirAnimal;
  protected readonly edad = textoEdad;

  constructor() {
    // Solo se piden los tres más recientes; el total llega aparte, sin traer todo el catálogo
    this.animalService.listar({ tamano: 3 }).subscribe({
      next: (resultado) => {
        this.recientes.set(resultado.animales);
        this.total.set(resultado.total);
      },
      error: () => this.total.set(null),
    });
  }
}
