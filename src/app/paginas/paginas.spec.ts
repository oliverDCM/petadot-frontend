import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Inicio } from './inicio/inicio';
import { NoEncontrada } from './no-encontrada/no-encontrada';

describe('Páginas', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });

  it('la portada pide solo los 3 animales más recientes y muestra el total del catálogo', () => {
    const fixture = TestBed.createComponent(Inicio);
    fixture.detectChanges();
    const animales = [4, 3, 2].map((id) => ({ id, nombre: `Animal ${id}`, especie: 'PERRO', sexo: 'MACHO', edadMeses: 5, fotoUrl: null }));
    const req = TestBed.inject(HttpTestingController).expectOne((r) => r.url.endsWith('/animales'));
    expect(req.request.params.get('tamano')).toBe('3');
    req.flush(animales, { headers: { 'X-Total-Count': '4' } });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.placa-portada').length).toBe(3);
    expect(el.textContent).toContain('Ver los 4 animales disponibles');
  });

  it('sin animales la portada muestra una placa de ejemplo', () => {
    const fixture = TestBed.createComponent(Inicio);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne((r) => r.url.endsWith('/animales')).flush([]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tu próximo compañero');
  });

  it('la página no encontrada ofrece volver al catálogo', () => {
    const fixture = TestBed.createComponent(NoEncontrada);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No encontramos esta página');
  });
});
