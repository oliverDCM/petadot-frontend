import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Solicitud } from '../../../core/modelos';
import { MisSolicitudes } from './mis-solicitudes';

const sol = (id: number, animalId: number, estado: Solicitud['estado']): Solicitud => ({
  id, animalId, solicitanteId: 2, mensaje: 'Hola', estado, fechaSolicitud: `2026-10-0${id}T10:00:00`, fechaDecision: estado === 'PENDIENTE' ? null : '2026-10-09T10:00:00',
});

function crear() {
  TestBed.configureTestingModule({
    imports: [MisSolicitudes],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(MisSolicitudes);
  fixture.detectChanges();
  return { fixture, http: TestBed.inject(HttpTestingController), el: fixture.nativeElement as HTMLElement };
}

describe('MisSolicitudes', () => {
  it('muestra el nombre de cada animal y pone primero las aprobadas', () => {
    const { fixture, http, el } = crear();
    http.expectOne((r) => r.url.endsWith('/solicitudes/mias')).flush([sol(1, 10, 'RECHAZADA'), sol(2, 11, 'APROBADA'), sol(3, 12, 'PENDIENTE')]);
    http.expectOne((r) => r.url.endsWith('/animales/10')).flush({ id: 10, nombre: 'Michi' });
    http.expectOne((r) => r.url.endsWith('/animales/11')).flush({ id: 11, nombre: 'Max' });
    http.expectOne((r) => r.url.endsWith('/animales/12')).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    const nombres = [...el.querySelectorAll('.solicitud-animal')].map((n) => n.textContent?.trim());
    expect(nombres).toEqual(['Max', 'Animal 12', 'Michi']);
    expect(el.querySelector('app-contacto-solicitud')).not.toBeNull();
    expect(el.textContent).toContain('Esperando respuesta');
    expect(el.textContent).toContain('No fue aprobada');
  });

  it('sin solicitudes invita a buscar animales', () => {
    const { fixture, http, el } = crear();
    http.expectOne((r) => r.url.endsWith('/solicitudes/mias')).flush([]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Aún no has enviado solicitudes');
  });

  it('si falla la carga permite reintentar', () => {
    const { fixture, http, el } = crear();
    http.expectOne((r) => r.url.endsWith('/solicitudes/mias')).flush({}, { status: 0, statusText: '' });
    fixture.detectChanges();
    expect(el.textContent).toContain('No se pudo conectar con el servidor');
  });
});
