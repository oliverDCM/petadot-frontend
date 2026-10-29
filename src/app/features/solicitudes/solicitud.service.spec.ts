import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Solicitud } from '../../core/modelos';
import { esActiva, SolicitudService } from './solicitud.service';

describe('SolicitudService', () => {
  let servicio: SolicitudService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/solicitudes`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(SolicitudService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía la solicitud con el mensaje recortado', () => {
    servicio.enviar(10, '  Hola  ').subscribe();
    expect(http.expectOne({ method: 'POST', url: api }).request.body).toEqual({ animalId: 10, mensaje: 'Hola' });
  });

  it('decide con PUT y consulta el contacto', () => {
    servicio.decidir(4, 'APROBAR').subscribe();
    expect(http.expectOne({ method: 'PUT', url: `${api}/4/decision` }).request.body).toEqual({ decision: 'APROBAR' });
    servicio.contacto(4).subscribe();
    http.expectOne({ method: 'GET', url: `${api}/4/contacto` });
  });

  it('una solicitud pendiente o aprobada cuenta como activa', () => {
    const s = (estado: Solicitud['estado']) => ({ estado }) as Solicitud;
    expect(esActiva(s('PENDIENTE'))).toBe(true);
    expect(esActiva(s('APROBADA'))).toBe(true);
    expect(esActiva(s('RECHAZADA'))).toBe(false);
  });
});
