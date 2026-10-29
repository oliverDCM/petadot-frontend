import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { jwtDePrueba } from '../../../../testing/jwt';
import { Login } from './login';

describe('Login', () => {
  let http: HttpTestingController;
  let el: HTMLElement;
  let fixture: ReturnType<typeof TestBed.createComponent<Login>>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  function llenar(email: string, password: string): void {
    const e = el.querySelector<HTMLInputElement>('#email')!;
    const p = el.querySelector<HTMLInputElement>('#password')!;
    e.value = email;
    e.dispatchEvent(new Event('input'));
    p.value = password;
    p.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('no envía si los datos no son válidos', () => {
    llenar('no-es-email', '');
    http.expectNone(() => true);
    expect(el.textContent).toContain('Escribe un email válido');
  });

  it('muestra un mensaje claro si las credenciales no coinciden', () => {
    llenar('ana@test.com', 'mala');
    http.expectOne((r) => r.url.endsWith('/auth/login')).flush({ mensaje: 'x' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(el.textContent).toContain('El email o la contraseña no coinciden');
  });

  it('vuelve a la página pedida después de entrar', () => {
    const router = TestBed.inject(Router);
    const ir = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('returnUrl', '/solicitudes/mias');

    llenar('ana@test.com', '12345678');
    http.expectOne((r) => r.url.endsWith('/auth/login')).flush({ token: jwtDePrueba(2), rol: 'ADOPTANTE', nombre: 'Ana', email: 'ana@test.com' });

    expect(ir).toHaveBeenCalledWith('/solicitudes/mias');
  });

  it('ofrece recuperar la contraseña', () => {
    expect(el.querySelector('a[href="/olvide-contrasena"]')).not.toBeNull();
  });
});
