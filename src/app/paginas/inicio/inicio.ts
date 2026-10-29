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
    this.animalService.listar().subscribe({
      next: (lista) => {
        this.recientes.set(lista.slice(0, 3));
        this.total.set(lista.length);
      },
      error: () => this.total.set(null),
    });
  }
}
