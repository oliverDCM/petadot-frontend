import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { mensajeDeError } from '../../../core/errores';
import { Animal, Especie, TipoPublicacion } from '../../../core/modelos';
import { AnimalService } from '../animal.service';
import { TarjetaAnimal } from '../tarjeta-animal/tarjeta-animal';

const POR_PAGINA = 12;
const ESPECIES: Especie[] = ['PERRO', 'GATO', 'OTRO'];
const TIPOS: TipoPublicacion[] = ['ADOPCION', 'VENTA'];

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, TarjetaAnimal],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo {
  private animalService = inject(AnimalService);
  private router = inject(Router);

  // Filtros y página vienen de la URL (?especie=PERRO&tipo=ADOPCION&ciudad=bogota&pagina=2)
  readonly especie = input<string>();
  readonly tipo = input<string>();
  readonly ciudad = input<string>();
  readonly pagina = input<string>();

  protected animales = signal<Animal[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);

  // Lo que el usuario está escribiendo en el formulario de filtros
  protected especieElegida = signal<Especie | ''>('');
  protected tipoElegido = signal<TipoPublicacion | ''>('');
  protected ciudadEscrita = signal('');

  protected readonly filtrosActivos = computed(() => !!(this.especieUrl() || this.tipoUrl() || this.ciudadUrl()));
  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.animales().length / POR_PAGINA)));
  protected readonly paginaActual = computed(() => {
    const n = Number(this.pagina());
    return Number.isInteger(n) && n >= 1 ? Math.min(n, this.totalPaginas()) : 1;
  });
  protected readonly visibles = computed(() => {
    const inicio = (this.paginaActual() - 1) * POR_PAGINA;
    return this.animales().slice(inicio, inicio + POR_PAGINA);
  });

  private readonly especieUrl = computed(() => (ESPECIES.includes(this.especie() as Especie) ? (this.especie() as Especie) : null));
  private readonly tipoUrl = computed(() => (TIPOS.includes(this.tipo() as TipoPublicacion) ? (this.tipo() as TipoPublicacion) : null));
  private readonly ciudadUrl = computed(() => this.ciudad()?.trim() || null);

  constructor() {
    // Cada vez que cambian los filtros de la URL se vuelve a consultar al backend
    effect(() => {
      const filtros = { especie: this.especieUrl(), tipo: this.tipoUrl(), ciudad: this.ciudadUrl() };
      untracked(() => {
        this.especieElegida.set(filtros.especie ?? '');
        this.tipoElegido.set(filtros.tipo ?? '');
        this.ciudadEscrita.set(filtros.ciudad ?? '');
        this.cargar(filtros);
      });
    });
  }

  aplicarFiltros(): void {
    this.router.navigate(['/catalogo'], {
      queryParams: {
        especie: this.especieElegida() || null,
        tipo: this.tipoElegido() || null,
        ciudad: this.ciudadEscrita().trim() || null,
      },
    });
  }

  limpiarFiltros(): void {
    this.router.navigate(['/catalogo']);
  }

  irAPagina(n: number): void {
    this.router.navigate([], {
      queryParams: { pagina: n > 1 ? n : null },
      queryParamsHandling: 'merge',
    });
  }

  reintentar(): void {
    this.cargar({ especie: this.especieUrl(), tipo: this.tipoUrl(), ciudad: this.ciudadUrl() });
  }

  private cargar(filtros: { especie: Especie | null; tipo: TipoPublicacion | null; ciudad: string | null }): void {
    this.cargando.set(true);
    this.error.set(null);
    this.animalService.listar(filtros).subscribe({
      next: (lista) => {
        this.animales.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e, 'No se pudo cargar el catálogo.'));
        this.cargando.set(false);
      },
    });
  }
}
