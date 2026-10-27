import { Component, inject, signal } from '@angular/core';
import { Animal, AnimalService } from '../animal.service';

@Component({
  selector: 'app-catalogo',
  imports: [],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo {
  private animalService = inject(AnimalService);

  animales = signal<Animal[]>([]);
  cargando = signal(true);
  error = signal(false);

  constructor() {
    this.animalService.listar().subscribe({
      next: (lista) => {
        this.animales.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }
}
