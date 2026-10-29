import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink],
  template: `
    <div class="vacio">
      <h1>No encontramos esta página</h1>
      <p>Puede que el enlace esté mal escrito o que la página ya no exista.</p>
      <a routerLink="/catalogo" class="boton boton-verde">Ver animales disponibles</a>
    </div>
  `,
})
export class NoEncontrada {}
