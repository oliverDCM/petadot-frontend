import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OlvideContrasena } from './olvide-contrasena';

function crearYEnviar(email: string) {
  TestBed.configureTestingModule({ imports: [OlvideContrasena], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  const fixture = TestBed.createComponent(OlvideContrasena);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const input = el.querySelector<HTMLInputElement>('#email')!;
  input.value = email;
  input.dispatchEvent(new Event('input'));
  el.querySelector('form')!.dispatchEvent(new Event('submit'));
  return { fixture, el, http: TestBed.inject(HttpTestingController) };
}

describe('OlvideContrasena', () => {
  it('muestra el mensaje genérico del backend', () => {
    const { fixture, el, http } = crearYEnviar('ana@test.com');
    http.expectOne((r) => r.url.endsWith('/auth/olvide-contrasena')).flush({
      mensaje: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña',
    });
    fixture.detectChanges();
    expect(el.textContent).toContain('Si el correo está registrado');
    expect(el.textContent).toContain('vence en 30 minutos');
  });

  it('ante un 429 pide esperar', () => {
    const { fixture, el, http } = crearYEnviar('ana@test.com');
    http.expectOne((r) => r.url.endsWith('/auth/olvide-contrasena')).flush({}, { status: 429, statusText: 'Too Many Requests' });
    fixture.detectChanges();
    expect(el.textContent).toContain('intenta de nuevo más tarde');
  });

  it('no envía un email inválido', () => {
    const { fixture, el, http } = crearYEnviar('no-es-email');
    fixture.detectChanges();
    http.expectNone(() => true);
    expect(el.textContent).toContain('Escribe un email válido');
  });
});
