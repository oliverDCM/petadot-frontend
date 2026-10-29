import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Registro } from './registro';

function crear() {
  localStorage.clear();
  TestBed.configureTestingModule({ imports: [Registro], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(Registro);
  fixture.detectChanges();
  return { fixture, navegar, el: fixture.nativeElement as HTMLElement, http: TestBed.inject(HttpTestingController) };
}

function llenar(el: HTMLElement, datos: Record<string, string>) {
  for (const [id, valor] of Object.entries(datos)) {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }
  el.querySelector('form')!.dispatchEvent(new Event('submit'));
}

describe('Registro', () => {
  it('valida antes de enviar', () => {
    const { fixture, el, http } = crear();
    llenar(el, { nombre: 'Ana', email: 'ana@test.com', password: 'corta' });
    fixture.detectChanges();
    http.expectNone(() => true);
    expect(el.textContent).toContain('entre 8 y 72 caracteres');
  });

  it('después de registrarse va al login con el email listo', () => {
    const { el, http, navegar } = crear();
    llenar(el, { nombre: 'Ana', email: 'ana@test.com', password: '12345678', telefono: '300 123 4567' });
    const req = http.expectOne((r) => r.url.endsWith('/auth/register'));
    expect(req.request.body.rol).toBe('ADOPTANTE');
    req.flush({});
    expect(navegar).toHaveBeenCalledWith(['/login'], { state: { email: 'ana@test.com', aviso: 'registrado' } });
  });

  it('si el email ya existe lo explica y ofrece iniciar sesión', () => {
    const { fixture, el, http } = crear();
    llenar(el, { nombre: 'Ana', email: 'ana@test.com', password: '12345678' });
    http.expectOne((r) => r.url.endsWith('/auth/register')).flush({}, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(el.textContent).toContain('Ya existe una cuenta con ese email');
    expect(el.textContent).toContain('Ir a iniciar sesión');
  });

  it('muestra errores por campo del backend', () => {
    const { fixture, el, http } = crear();
    llenar(el, { nombre: 'Ana', email: 'ana@test.com', password: '12345678' });
    http.expectOne((r) => r.url.endsWith('/auth/register')).flush(
      { mensaje: 'Datos inválidos', campos: { email: 'dominio no permitido' } },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();
    expect(el.textContent).toContain('dominio no permitido');
  });
});
