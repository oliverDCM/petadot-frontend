import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { jwtDePrueba } from '../../../testing/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('al iniciar sesión guarda el token y expone rol e id de usuario', () => {
    const token = jwtDePrueba(5);
    auth.login({ email: ' ana@test.com ', password: '12345678' }).subscribe();

    const req = http.expectOne((r) => r.url.endsWith('/auth/login'));
    expect(req.request.body).toEqual({ email: 'ana@test.com', password: '12345678' });
    req.flush({ token, rol: 'VENDEDOR', nombre: 'Ana', email: 'ana@test.com' });

    expect(auth.estaAutenticado()).toBe(true);
    expect(auth.obtenerRol()).toBe('VENDEDOR');
    expect(auth.usuarioId()).toBe(5);
    expect(JSON.parse(localStorage.getItem('petadopt_sesion')!).token).toBe(token);
  });

  it('al cerrar sesión limpia el almacenamiento', () => {
    auth.login({ email: 'a@test.com', password: 'x' }).subscribe();
    http.expectOne((r) => r.url.endsWith('/auth/login')).flush({ token: jwtDePrueba(1), rol: 'ADOPTANTE', nombre: 'A', email: 'a@test.com' });

    auth.cerrarSesion();

    expect(auth.estaAutenticado()).toBe(false);
    expect(auth.usuarioId()).toBeNull();
    expect(localStorage.getItem('petadopt_sesion')).toBeNull();
  });

  it('registra enviando null en los campos opcionales vacíos', () => {
    auth.registrar({ nombre: 'Ana', email: 'ana@test.com', password: '12345678', telefono: ' ', ciudad: '', rol: 'ADOPTANTE' }).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/auth/register'));
    expect(req.request.body.telefono).toBeNull();
    expect(req.request.body.ciudad).toBeNull();
    req.flush({});
  });

  it('pide y usa el enlace de recuperación', () => {
    auth.olvideContrasena(' ana@test.com ').subscribe();
    expect(http.expectOne((r) => r.url.endsWith('/auth/olvide-contrasena')).request.body).toEqual({ email: 'ana@test.com' });

    auth.restablecerContrasena('tok', 'nuevaClave1').subscribe();
    expect(http.expectOne((r) => r.url.endsWith('/auth/restablecer-contrasena')).request.body).toEqual({
      token: 'tok',
      nuevaPassword: 'nuevaClave1',
    });
  });
});
