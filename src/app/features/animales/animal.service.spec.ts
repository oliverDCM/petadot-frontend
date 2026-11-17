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
    expect(req.request.params.has('pagina')).toBe(false);
    expect(req.request.params.has('tamano')).toBe(false);
    req.flush([]);
  });

  it('pide la página indicada y lee el total de la cabecera X-Total-Count', () => {
    let resultado: { animales: unknown[]; total: number } | undefined;
    servicio.listar({ pagina: 2, tamano: 12 }).subscribe((r) => (resultado = r));
    const req = http.expectOne((r) => r.url === api);
    expect(req.request.params.get('pagina')).toBe('2');
    expect(req.request.params.get('tamano')).toBe('12');
    req.flush([{ id: 30 }, { id: 29 }], { headers: { 'X-Total-Count': '26' } });
    expect(resultado).toEqual({ animales: [{ id: 30 }, { id: 29 }], total: 26 });
  });

  it('si la respuesta no trae la cabecera usa la cantidad recibida como total', () => {
    let total = -1;
    servicio.listar().subscribe((r) => (total = r.total));
    http.expectOne((r) => r.url === api).flush([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(total).toBe(3);
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
