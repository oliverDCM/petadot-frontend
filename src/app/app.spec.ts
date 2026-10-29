import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { jwtDePrueba } from '../testing/jwt';
import { App } from './app';

function crear() {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const f = TestBed.createComponent(App);
  f.detectChanges();
  return f.nativeElement as HTMLElement;
}

describe('App (navegación)', () => {
  beforeEach(() => localStorage.clear());

  it('sin sesión ofrece iniciar sesión y crear cuenta', () => {
    const el = crear();
    expect(el.textContent).toContain('Iniciar sesión');
    expect(el.textContent).toContain('Crear cuenta');
  });

  it('un vendedor ve sus publicaciones, solicitudes recibidas y el botón de publicar', () => {
    localStorage.setItem('petadopt_sesion', JSON.stringify({ token: jwtDePrueba(1), rol: 'VENDEDOR', nombre: 'Carlos', email: 'c@test.com' }));
    const el = crear();
    expect(el.textContent).toContain('Mis publicaciones');
    expect(el.textContent).toContain('Solicitudes recibidas');
    expect(el.textContent).toContain('Publicar animal');
    expect(el.textContent).not.toContain('Mis solicitudes');
  });

  it('un adoptante ve sus solicitudes y no el botón de publicar', () => {
    localStorage.setItem('petadopt_sesion', JSON.stringify({ token: jwtDePrueba(2), rol: 'ADOPTANTE', nombre: 'Ana', email: 'a@test.com' }));
    const el = crear();
    expect(el.textContent).toContain('Mis solicitudes');
    expect(el.textContent).not.toContain('Publicar animal');
  });
});
