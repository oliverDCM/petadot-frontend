import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { jwtDePrueba } from '../../../testing/jwt';
import { authGuard } from './auth.guard';
import { invitadoGuard } from './invitado.guard';
import { roleGuard } from './role.guard';

function iniciar(rol: 'VENDEDOR' | 'ADOPTANTE' | null): void {
  localStorage.clear();
  if (rol) {
    localStorage.setItem('petadopt_sesion', JSON.stringify({ token: jwtDePrueba(1), rol, nombre: 'X', email: 'x@test.com' }));
  }
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
}

const ruta = (roles?: string[]) => ({ data: { roles } }) as unknown as ActivatedRouteSnapshot;
const estado = (url: string) => ({ url }) as RouterStateSnapshot;

describe('guards', () => {
  it('authGuard deja pasar con sesión', () => {
    iniciar('ADOPTANTE');
    expect(TestBed.runInInjectionContext(() => authGuard(ruta(), estado('/perfil')))).toBe(true);
  });

  it('authGuard sin sesión manda al login recordando la página', () => {
    iniciar(null);
    const r = TestBed.runInInjectionContext(() => authGuard(ruta(), estado('/solicitudes/mias'))) as UrlTree;
    expect(r.toString()).toBe('/login?returnUrl=%2Fsolicitudes%2Fmias');
  });

  it('roleGuard solo deja entrar a los roles indicados', () => {
    iniciar('ADOPTANTE');
    const r = TestBed.runInInjectionContext(() => roleGuard(ruta(['VENDEDOR']), estado('/publicar'))) as UrlTree;
    expect(r.toString()).toBe('/catalogo');
    expect(TestBed.runInInjectionContext(() => roleGuard(ruta(['ADOPTANTE']), estado('/solicitudes/mias')))).toBe(true);
  });

  it('invitadoGuard saca del login a quien ya tiene sesión', () => {
    iniciar('VENDEDOR');
    const r = TestBed.runInInjectionContext(() => invitadoGuard(ruta(), estado('/login'))) as UrlTree;
    expect(r.toString()).toBe('/catalogo');
  });
});
