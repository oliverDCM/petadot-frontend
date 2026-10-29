import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Animal } from '../../../core/modelos';
import { describirAnimal, IMAGEN_POR_DEFECTO, textoEdad, textoTipo } from '../../../shared/formato';

/** Placa de identificación de un animal: foto, nombre grande y datos clave. */
@Component({
  selector: 'app-tarjeta-animal',
  imports: [RouterLink],
  template: `
    @let a = animal();
    <a class="placa" [routerLink]="['/animales', a.id]" [attr.aria-label]="a.nombre + ', ' + descripcion()">
      <div class="placa-foto">
        <img [src]="a.fotoUrl || sinFoto" [alt]="a.fotoUrl ? 'Foto de ' + a.nombre : ''" loading="lazy" (error)="usarImagenPorDefecto($event)" />
        <span class="chip-tipo" [class.tipo-venta]="a.tipo === 'VENTA'">{{ tipo() }}</span>
      </div>
      <div class="placa-cuerpo">
        <h3 class="placa-nombre">{{ a.nombre }}</h3>
        <p class="placa-linea">{{ descripcion() }}{{ a.raza ? ', ' + a.raza : '' }}</p>
        <div class="placa-pie">
          <span>{{ edad() }}</span>
          @if (a.ciudad) {
            <span class="texto-suave">{{ a.ciudad }}</span>
          }
        </div>
      </div>
    </a>
  `,
})
export class TarjetaAnimal {
  readonly animal = input.required<Animal>();

  protected readonly sinFoto = IMAGEN_POR_DEFECTO;
  protected readonly descripcion = computed(() => describirAnimal(this.animal().especie, this.animal().sexo));
  protected readonly edad = computed(() => textoEdad(this.animal().edadMeses));
  protected readonly tipo = computed(() => textoTipo(this.animal().tipo));

  usarImagenPorDefecto(evento: Event): void {
    const img = evento.target as HTMLImageElement;
    if (!img.src.endsWith(IMAGEN_POR_DEFECTO)) {
      img.src = IMAGEN_POR_DEFECTO;
    }
  }
}
