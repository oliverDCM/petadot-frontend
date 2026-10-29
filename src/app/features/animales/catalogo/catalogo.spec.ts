import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Animal } from '../../../core/modelos';
import { Catalogo } from './catalogo';

const animal = (id: number): Animal => ({
  id, nombre: `Animal ${id}`, especie: 'PERRO', raza: null, edadMeses: 3, sexo: 'MACHO', descripcion: null,
  fotoUrl: null, ciudad: 'Bogotá', vacunado: false, esterilizado: false, tipo: 'ADOPCION',
  estado: 'DISPONIBLE', vendedorId: 1, fechaPublicacion: '2026-10-01T10:00:00',
});

describe('Catalogo', () => {
  let http: HttpTestingController;

  function crear(entradas: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [Catalogo],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Catalogo);
    for (const [k, v] of Object.entries(entradas)) {
      fixture.componentRef.setInput(k, v);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('consulta al backend con los filtros de la URL', () => {
    crear({ especie: 'GATO', tipo: 'NO_EXISTE', ciudad: 'Fusa' });
    const req = http.expectOne((r) => r.url.endsWith('/animales'));
    expect(req.request.params.get('especie')).toBe('GATO');
    expect(req.request.params.has('tipo')).toBe(false);
    expect(req.request.params.get('ciudad')).toBe('Fusa');
  });

  it('muestra 12 animales por página', () => {
    const f = crear({ pagina: '2' });
    http.expectOne((r) => r.url.endsWith('/animales')).flush(Array.from({ length: 14 }, (_, i) => animal(i + 1)));
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelectorAll('app-tarjeta-animal').length).toBe(2);
    expect(el.textContent).toContain('Página 2 de 2');
  });

  it('con filtros y sin resultados ofrece quitarlos', () => {
    const f = crear({ especie: 'PERRO' });
    http.expectOne((r) => r.url.endsWith('/animales')).flush([]);
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).textContent).toContain('No hay animales con estos filtros');
  });

  it('si el servidor falla permite reintentar', () => {
    const f = crear();
    http.expectOne((r) => r.url.endsWith('/animales')).flush({ mensaje: 'Error interno' }, { status: 500, statusText: 'x' });
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).textContent).toContain('Intentar de nuevo');
  });
});
