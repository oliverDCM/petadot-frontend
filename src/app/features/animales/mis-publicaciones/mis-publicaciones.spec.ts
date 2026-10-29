import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Animal } from '../../../core/modelos';
import { ConfirmacionService } from '../../../shared/confirmacion/confirmacion.service';
import { MisPublicaciones } from './mis-publicaciones';

const animal = (id: number, estado: Animal['estado'], fecha = '2026-10-01T10:00:00'): Animal => ({
  id, nombre: `Animal ${id}`, especie: 'GATO', raza: null, edadMeses: 4, sexo: 'HEMBRA', descripcion: null,
  fotoUrl: null, ciudad: null, vacunado: false, esterilizado: false, tipo: 'VENTA', estado, vendedorId: 1, fechaPublicacion: fecha,
});

describe('MisPublicaciones', () => {
  let http: HttpTestingController;
  let respuesta: boolean;

  function crear() {
    respuesta = true;
    TestBed.configureTestingModule({
      imports: [MisPublicaciones],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmacionService, useValue: { preguntar: () => Promise.resolve(respuesta) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MisPublicaciones);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function responder(animales: Animal[]) {
    http.expectOne((r) => r.url.endsWith('/animales/mis-publicaciones')).flush(animales);
    http.expectOne((r) => r.url.endsWith('/solicitudes/recibidas')).flush([
      { id: 1, animalId: 1, solicitanteId: 5, mensaje: 'x', estado: 'PENDIENTE', fechaSolicitud: '2026-10-02T10:00:00', fechaDecision: null },
      { id: 2, animalId: 1, solicitanteId: 6, mensaje: 'y', estado: 'PENDIENTE', fechaSolicitud: '2026-10-02T10:00:00', fechaDecision: null },
    ]);
  }

  it('pone primero los reservados y cuenta las solicitudes por responder', () => {
    const { fixture, el } = crear();
    responder([animal(1, 'DISPONIBLE', '2026-10-05T10:00:00'), animal(2, 'RESERVADO')]);
    fixture.detectChanges();

    const nombres = [...el.querySelectorAll('.fila-nombre')].map((n) => n.textContent?.trim());
    expect(nombres).toEqual(['Animal 2', 'Animal 1']);
    expect(el.textContent).toContain('2 solicitudes por responder');
  });

  it('muestra solo las acciones permitidas por estado', () => {
    const { fixture, el } = crear();
    responder([animal(2, 'RESERVADO'), animal(3, 'ADOPTADO')]);
    fixture.detectChanges();
    const filas = el.querySelectorAll('.fila-publicacion');
    expect(filas[0].textContent).toContain('Marcar como entregado');
    expect(filas[0].textContent).toContain('Volver a publicar');
    expect(filas[0].textContent).not.toContain('Editar');
    expect(filas[1].textContent).not.toContain('Retirar publicación');
  });

  it('cambia el estado después de confirmar', async () => {
    const { fixture, el } = crear();
    responder([animal(2, 'RESERVADO')]);
    fixture.detectChanges();

    const componente = fixture.componentInstance as unknown as {
      acciones(a: Animal): { destino: string }[];
      cambiarEstado(a: Animal, acc: unknown): Promise<void>;
    };
    const accion = componente.acciones(animal(2, 'RESERVADO')).find((a) => a.destino === 'ADOPTADO');
    await componente.cambiarEstado(animal(2, 'RESERVADO'), accion);

    const req = http.expectOne((r) => r.url.endsWith('/animales/2/estado'));
    expect(req.request.body).toEqual({ estado: 'ADOPTADO' });
    req.flush(animal(2, 'ADOPTADO'));
    fixture.detectChanges();
    expect(el.querySelector('app-estado-chip')!.textContent).toContain('Adoptado');
  });

  it('si el usuario cancela no cambia nada', async () => {
    const { fixture } = crear();
    responder([animal(1, 'DISPONIBLE')]);
    respuesta = false;
    const componente = fixture.componentInstance as unknown as {
      acciones(a: Animal): unknown[];
      cambiarEstado(a: Animal, acc: unknown): Promise<void>;
    };
    await componente.cambiarEstado(animal(1, 'DISPONIBLE'), componente.acciones(animal(1, 'DISPONIBLE'))[0]);
    http.expectNone((r) => r.url.includes('/estado'));
  });

  it('sin publicaciones invita a publicar', () => {
    const { fixture, el } = crear();
    http.expectOne((r) => r.url.endsWith('/animales/mis-publicaciones')).flush([]);
    http.expectOne((r) => r.url.endsWith('/solicitudes/recibidas')).flush([]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Aún no has publicado animales');
  });

  it('si falla la carga permite reintentar', () => {
    const { fixture, el } = crear();
    http.expectOne((r) => r.url.endsWith('/solicitudes/recibidas')).flush([]);
    http.expectOne((r) => r.url.endsWith('/animales/mis-publicaciones')).flush({}, { status: 500, statusText: 'x' });
    fixture.detectChanges();
    expect(el.textContent).toContain('Intentar de nuevo');
  });
});
