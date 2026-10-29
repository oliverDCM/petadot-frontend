import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PerfilPublicoPagina } from './perfil-publico';

function crear() {
  TestBed.configureTestingModule({ imports: [PerfilPublicoPagina], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  const fixture = TestBed.createComponent(PerfilPublicoPagina);
  fixture.componentRef.setInput('id', '2');
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, http: TestBed.inject(HttpTestingController) };
}

describe('PerfilPublicoPagina', () => {
  it('muestra nombre, ciudad y rol, nunca el email', () => {
    const { fixture, el, http } = crear();
    http.expectOne((r) => r.url.endsWith('/usuarios/2/perfil-publico')).flush({
      nombre: 'Ana', ciudad: 'Bogotá', rol: 'ADOPTANTE', email: 'privado@test.com',
    });
    fixture.detectChanges();
    expect(el.textContent).toContain('Ana');
    expect(el.textContent).toContain('Bogotá');
    expect(el.textContent).toContain('Busca un animal');
    expect(el.textContent).not.toContain('privado@test.com');
  });

  it('un 403 explica quién puede verlo', () => {
    const { fixture, el, http } = crear();
    http.expectOne((r) => r.url.endsWith('/perfil-publico')).flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(el.textContent).toContain('te enviaron una solicitud');
  });

  it('un 404 dice que el usuario no existe', () => {
    const { fixture, el, http } = crear();
    http.expectOne((r) => r.url.endsWith('/perfil-publico')).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(el.textContent).toContain('Este usuario no existe');
  });
});
