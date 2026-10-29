import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnimalDetalle } from '../../../core/modelos';
import { jwtDePrueba } from '../../../../testing/jwt';
import { Detalle } from './detalle';

const detalle: AnimalDetalle = {
  id: 10, nombre: 'Lupe', especie: 'PERRO', raza: 'Criolla', edadMeses: 14, sexo: 'HEMBRA', descripcion: 'Juguetona',
  fotoUrl: null, ciudad: 'Fusagasugá', vacunado: true, esterilizado: false, tipo: 'ADOPCION', estado: 'DISPONIBLE',
  vendedorId: 1, fechaPublicacion: '2026-10-01T10:00:00', vendedorNombre: 'Carlos', vendedorCiudad: 'Fusagasugá',
};

function crear(sesion: { id: number; rol: 'VENDEDOR' | 'ADOPTANTE' } | null) {
  localStorage.clear();
  if (sesion) {
    localStorage.setItem('petadopt_sesion', JSON.stringify({ token: jwtDePrueba(sesion.id), rol: sesion.rol, nombre: 'X', email: 'x@test.com' }));
  }
  TestBed.configureTestingModule({
    imports: [Detalle],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(Detalle);
  fixture.componentRef.setInput('id', '10');
  fixture.detectChanges();
  return { fixture, http: TestBed.inject(HttpTestingController), el: fixture.nativeElement as HTMLElement };
}

describe('Detalle', () => {
  it('muestra los datos del animal y del publicador sin datos sensibles', () => {
    const { fixture, http, el } = crear(null);
    http.expectOne((r) => r.url.endsWith('/animales/10')).flush(detalle);
    fixture.detectChanges();
    expect(el.textContent).toContain('Lupe');
    expect(el.textContent).toContain('Publicado por Carlos, de Fusagasugá');
    expect(el.textContent).toContain('Inicia sesión con una cuenta de adoptante');
  });

  it('un adoptante sin solicitud activa ve el formulario', () => {
    const { fixture, http, el } = crear({ id: 2, rol: 'ADOPTANTE' });
    http.expectOne((r) => r.url.endsWith('/animales/10')).flush(detalle);
    http.expectOne((r) => r.url.endsWith('/solicitudes/mias')).flush([]);
    fixture.detectChanges();
    expect(el.querySelector('app-enviar-solicitud')).not.toBeNull();
  });

  it('si ya tiene una solicitud activa no puede enviar otra', () => {
    const { fixture, http, el } = crear({ id: 2, rol: 'ADOPTANTE' });
    http.expectOne((r) => r.url.endsWith('/animales/10')).flush(detalle);
    http.expectOne((r) => r.url.endsWith('/solicitudes/mias')).flush([
      { id: 1, animalId: 10, solicitanteId: 2, mensaje: 'x', estado: 'PENDIENTE', fechaSolicitud: '2026-10-02T10:00:00', fechaDecision: null },
    ]);
    fixture.detectChanges();
    expect(el.querySelector('app-enviar-solicitud')).toBeNull();
    expect(el.textContent).toContain('Ya enviaste una solicitud');
  });

  it('el vendedor dueño ve la opción de editar y no la de solicitar', () => {
    const { fixture, http, el } = crear({ id: 1, rol: 'VENDEDOR' });
    http.expectOne((r) => r.url.endsWith('/animales/10')).flush(detalle);
    fixture.detectChanges();
    expect(el.textContent).toContain('Es tu publicación');
    expect(el.textContent).toContain('Editar datos');
    expect(el.querySelector('app-enviar-solicitud')).toBeNull();
  });

  it('un 404 muestra que el animal no existe', () => {
    const { fixture, http, el } = crear(null);
    http.expectOne((r) => r.url.endsWith('/animales/10')).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(el.textContent).toContain('no existe');
  });
});
