import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AnimalDetalle } from '../../../core/modelos';
import { jwtDePrueba } from '../../../../testing/jwt';
import { FormularioAnimal, MAX_IMAGEN_BYTES, validarImagen } from './formulario-animal';

const archivo = (tipo: string, bytes: number, nombre = 'x') => {
  const f = new File([new Uint8Array(1)], nombre, { type: tipo });
  Object.defineProperty(f, 'size', { value: bytes });
  return f;
};

describe('validarImagen', () => {
  it('acepta JPG, PNG y WEBP de hasta 5 MB', () => {
    expect(validarImagen(archivo('image/jpeg', 1000))).toBeNull();
    expect(validarImagen(archivo('image/png', MAX_IMAGEN_BYTES))).toBeNull();
    expect(validarImagen(archivo('image/webp', 10))).toBeNull();
  });

  it('rechaza otros formatos y archivos muy pesados', () => {
    expect(validarImagen(archivo('image/gif', 10))).toContain('JPG, PNG o WEBP');
    expect(validarImagen(archivo('image/png', MAX_IMAGEN_BYTES + 1))).toContain('5 MB');
  });
});

const existente: AnimalDetalle = {
  id: 7, nombre: 'Lupe', especie: 'PERRO', raza: 'Criolla', edadMeses: 14, sexo: 'HEMBRA', descripcion: 'Juguetona',
  fotoUrl: 'https://res.cloudinary.com/x/lupe.jpg', ciudad: 'Fusagasugá', vacunado: true, esterilizado: false,
  tipo: 'ADOPCION', estado: 'DISPONIBLE', vendedorId: 1, fechaPublicacion: '2026-10-01T10:00:00',
  vendedorNombre: 'Carlos', vendedorCiudad: 'Fusagasugá',
};

describe('FormularioAnimal', () => {
  let http: HttpTestingController;
  let navegar: ReturnType<typeof vi.spyOn>;

  function crear(id?: string) {
    localStorage.clear();
    localStorage.setItem('petadopt_sesion', JSON.stringify({ token: jwtDePrueba(1), rol: 'VENDEDOR', nombre: 'Carlos', email: 'c@test.com' }));
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:vista');
    globalThis.URL.revokeObjectURL = vi.fn();
    TestBed.configureTestingModule({
      imports: [FormularioAnimal],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(FormularioAnimal);
    if (id) {
      fixture.componentRef.setInput('id', id);
    }
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function escribir(el: HTMLElement, selector: string, valor: string): void {
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  function elegirArchivo(el: HTMLElement, f: File): void {
    const input = el.querySelector<HTMLInputElement>('#foto')!;
    Object.defineProperty(input, 'files', { value: [f], configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  it('no publica si falta el nombre y avisa', () => {
    const { fixture, el } = crear();
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    http.expectNone(() => true);
    expect(el.textContent).toContain('Revisa los campos marcados');
    expect(el.textContent).toContain('Escribe el nombre');
  });

  it('publica sin foto en JSON, limpiando los opcionales vacíos', () => {
    const { el } = crear();
    escribir(el, '#nombre', '  Rocky ');
    escribir(el, '#edadMeses', '8');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));

    const req = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/animales'));
    expect(req.request.body).toEqual(expect.objectContaining({
      nombre: 'Rocky', edadMeses: 8, raza: null, ciudad: null, descripcion: null, fotoUrl: null, tipo: 'ADOPCION',
    }));
    req.flush({ ...existente, id: 9, nombre: 'Rocky' });
    expect(navegar).toHaveBeenCalledWith(['/mis-publicaciones']);
  });

  it('con foto elegida usa la ruta multipart y muestra la vista previa', () => {
    const { fixture, el } = crear();
    elegirArchivo(el, archivo('image/png', 2000, 'rocky.png'));
    fixture.detectChanges();
    expect(el.querySelector<HTMLImageElement>('.foto-previa')!.src).toContain('blob:vista');

    escribir(el, '#nombre', 'Rocky');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne((r) => r.url.endsWith('/animales/con-foto'));
    expect(req.request.body).toBeInstanceOf(FormData);
  });

  it('rechaza una foto con formato no permitido sin enviarla', () => {
    const { fixture, el } = crear();
    elegirArchivo(el, archivo('image/gif', 10));
    fixture.detectChanges();
    expect(el.textContent).toContain('Usa una imagen JPG, PNG o WEBP');
  });

  it('permite quitar la foto elegida', () => {
    const { fixture, el } = crear();
    elegirArchivo(el, archivo('image/png', 10));
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.foto-elegir button')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.foto-elegir button')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('si Cloudinary falla explica que no se pudo subir la foto', () => {
    const { fixture, el } = crear();
    escribir(el, '#nombre', 'Rocky');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    http.expectOne((r) => r.url.endsWith('/animales')).flush({ mensaje: 'x' }, { status: 502, statusText: 'Bad Gateway' });
    fixture.detectChanges();
    expect(el.textContent).toContain('No se pudo subir la foto');
  });

  it('muestra los errores por campo que devuelve el backend', () => {
    const { fixture, el } = crear();
    escribir(el, '#nombre', 'Rocky');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    http.expectOne((r) => r.url.endsWith('/animales')).flush(
      { mensaje: 'Datos inválidos', campos: { nombre: 'ya existe uno igual' } },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();
    expect(el.textContent).toContain('ya existe uno igual');
  });

  it('al editar carga los datos y guarda con PUT', () => {
    const { fixture, el } = crear('7');
    http.expectOne((r) => r.url.endsWith('/animales/7')).flush(existente);
    fixture.detectChanges();
    expect(el.querySelector<HTMLInputElement>('#nombre')!.value).toBe('Lupe');
    expect(el.textContent).toContain('Guardar cambios');

    escribir(el, '#nombre', 'Lupita');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne((r) => r.method === 'PUT' && r.url.endsWith('/animales/7'));
    expect(req.request.body.nombre).toBe('Lupita');
    expect(req.request.body.fotoUrl).toBeNull();
  });

  it('no deja editar un animal de otro vendedor', () => {
    const { fixture, el } = crear('7');
    http.expectOne((r) => r.url.endsWith('/animales/7')).flush({ ...existente, vendedorId: 99 });
    fixture.detectChanges();
    expect(el.textContent).toContain('Solo quien publicó este animal puede editarlo');
    expect(el.querySelector('form')).toBeNull();
  });

  it('no deja editar un animal reservado', () => {
    const { fixture, el } = crear('7');
    http.expectOne((r) => r.url.endsWith('/animales/7')).flush({ ...existente, estado: 'RESERVADO' });
    fixture.detectChanges();
    expect(el.textContent).toContain('Solo se pueden editar animales disponibles');
  });

  it('si el animal no existe lo dice', () => {
    const { fixture, el } = crear('7');
    http.expectOne((r) => r.url.endsWith('/animales/7')).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(el.textContent).toContain('Este animal no existe');
  });
});
