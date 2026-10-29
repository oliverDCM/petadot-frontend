import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AnimalDatos } from '../../core/modelos';
import { AnimalService } from './animal.service';

const datos: AnimalDatos = {
  nombre: 'Lupe', especie: 'PERRO', raza: null, edadMeses: 14, sexo: 'HEMBRA', descripcion: null,
  fotoUrl: null, ciudad: 'Fusagasugá', vacunado: true, esterilizado: false, tipo: 'ADOPCION',
};

describe('AnimalService', () => {
  let servicio: AnimalService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/animales`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(AnimalService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía solo los filtros que tienen valor', () => {
    servicio.listar({ especie: 'GATO', tipo: null, ciudad: '  bogotá ' }).subscribe();
    const req = http.expectOne((r) => r.url === api);
    expect(req.request.params.get('especie')).toBe('GATO');
    expect(req.request.params.has('tipo')).toBe(false);
    expect(req.request.params.get('ciudad')).toBe('bogotá');
  });

  it('publica en JSON sin foto y en multipart con foto', () => {
    servicio.publicar(datos, null).subscribe();
    expect(http.expectOne({ method: 'POST', url: api }).request.body).toEqual(datos);

    const foto = new File([new Uint8Array([1, 2])], 'lupe.png', { type: 'image/png' });
    servicio.publicar(datos, foto).subscribe();
    const req = http.expectOne({ method: 'POST', url: `${api}/con-foto` });
    const form = req.request.body as FormData;
    expect(form.get('foto')).toBeInstanceOf(File);
    expect((form.get('datos') as Blob).type).toBe('application/json');
  });

  it('edita y cambia el estado con PUT', () => {
    servicio.editar(3, datos, null).subscribe();
    http.expectOne({ method: 'PUT', url: `${api}/3` });

    servicio.cambiarEstado(3, 'ADOPTADO').subscribe();
    expect(http.expectOne({ method: 'PUT', url: `${api}/3/estado` }).request.body).toEqual({ estado: 'ADOPTADO' });
  });
});
