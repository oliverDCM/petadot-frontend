import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { jwtDePrueba } from '../../../testing/jwt';
import { AuthService } from '../sesion/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  const token = jwtDePrueba(3);

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('petadopt_sesion', JSON.stringify({ token, rol: 'ADOPTANTE', nombre: 'Ana', email: 'a@test.com' }));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => backend.verify());

  it('agrega el token solo a las peticiones de la API', () => {
    http.get(`${environment.apiUrl}/animales/mis-publicaciones`).subscribe();
    http.get('https://otro-sitio.com/datos').subscribe();

    expect(backend.expectOne(`${environment.apiUrl}/animales/mis-publicaciones`).request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(backend.expectOne('https://otro-sitio.com/datos').request.headers.has('Authorization')).toBe(false);
  });

  it('ante un 401 cierra la sesión y manda al login', () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http.get(`${environment.apiUrl}/solicitudes/mias`).subscribe({ error: () => undefined });
    backend.expectOne(`${environment.apiUrl}/solicitudes/mias`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.estaAutenticado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/login'], expect.anything());
  });

  it('un 403 no cierra la sesión', () => {
    http.get(`${environment.apiUrl}/solicitudes/1/contacto`).subscribe({ error: () => undefined });
    backend.expectOne(`${environment.apiUrl}/solicitudes/1/contacto`).flush({}, { status: 403, statusText: 'Forbidden' });
    expect(auth.estaAutenticado()).toBe(true);
  });
});
