import { TestBed } from '@angular/core/testing';
import { jwtDePrueba } from '../../../testing/jwt';
import { leerJwt, TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let storage: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    storage = TestBed.inject(TokenStorageService);
  });

  it('guarda y lee la sesión', () => {
    const sesion = { token: jwtDePrueba(7), rol: 'ADOPTANTE' as const, nombre: 'Ana', email: 'ana@test.com' };
    storage.guardar(sesion);
    expect(storage.leer()).toEqual(sesion);
  });

  it('descarta y borra una sesión con el token vencido', () => {
    storage.guardar({ token: jwtDePrueba(7, 1000), rol: 'ADOPTANTE', nombre: 'Ana', email: 'ana@test.com' });
    expect(storage.leer()).toBeNull();
    expect(localStorage.getItem('petadopt_sesion')).toBeNull();
  });

  it('ignora datos corruptos', () => {
    localStorage.setItem('petadopt_sesion', '{no es json');
    expect(storage.leer()).toBeNull();
  });

  it('lee el contenido del JWT', () => {
    expect(leerJwt(jwtDePrueba(42))?.sub).toBe('42');
    expect(leerJwt('basura')).toBeNull();
  });
});
