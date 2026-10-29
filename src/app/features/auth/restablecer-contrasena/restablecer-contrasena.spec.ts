import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { clavesCoinciden, RestablecerContrasena } from './restablecer-contrasena';

function crear(token: string | null) {
  TestBed.configureTestingModule({
    imports: [RestablecerContrasena],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } } },
    ],
  });
  const router = TestBed.inject(Router);
  const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(RestablecerContrasena);
  fixture.detectChanges();
  return { fixture, navegar, el: fixture.nativeElement as HTMLElement };
}

function escribir(el: HTMLElement, id: string, valor: string): void {
  const input = el.querySelector<HTMLInputElement>(id)!;
  input.value = valor;
  input.dispatchEvent(new Event('input'));
}

describe('RestablecerContrasena', () => {
  it('valida que las contraseñas coincidan', () => {
    const g = new FormGroup({ nueva: new FormControl('clave1234'), confirmacion: new FormControl('otra1234') });
    expect(clavesCoinciden(g)).toEqual({ noCoinciden: true });
    g.controls.confirmacion.setValue('clave1234');
    expect(clavesCoinciden(g)).toBeNull();
  });

  it('quita el token de la URL después de leerlo', () => {
    const { navegar } = crear('abc123');
    expect(navegar).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {}, replaceUrl: true }));
  });

  it('sin token ofrece pedir un enlace nuevo', () => {
    const { el } = crear(null);
    expect(el.textContent).toContain('Este enlace no es válido');
  });

  it('con token vencido muestra el error del backend y el enlace para pedir otro', () => {
    const { fixture, el } = crear('vencido');
    const http = TestBed.inject(HttpTestingController);
    escribir(el, '#nueva', 'clave12345');
    escribir(el, '#confirmacion', 'clave12345');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));

    const req = http.expectOne((r) => r.url.endsWith('/auth/restablecer-contrasena'));
    expect(req.request.body).toEqual({ token: 'vencido', nuevaPassword: 'clave12345' });
    req.flush({ mensaje: 'El enlace de recuperación venció; solicita uno nuevo' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(el.textContent).toContain('venció');
    expect(el.querySelector('a[href="/olvide-contrasena"]')).not.toBeNull();
  });

  it('si todo sale bien vuelve al login con aviso', () => {
    const { el, navegar } = crear('bueno');
    const http = TestBed.inject(HttpTestingController);
    escribir(el, '#nueva', 'clave12345');
    escribir(el, '#confirmacion', 'clave12345');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    http.expectOne((r) => r.url.endsWith('/auth/restablecer-contrasena')).flush({ mensaje: 'ok' });
    expect(navegar).toHaveBeenCalledWith(['/login'], { state: { aviso: 'restablecida' } });
  });
});
