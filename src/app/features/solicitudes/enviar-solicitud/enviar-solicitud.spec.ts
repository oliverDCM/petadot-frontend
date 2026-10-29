import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Solicitud } from '../../../core/modelos';
import { EnviarSolicitud } from './enviar-solicitud';

function crear() {
  TestBed.configureTestingModule({ imports: [EnviarSolicitud], providers: [provideHttpClient(), provideHttpClientTesting()] });
  const fixture = TestBed.createComponent(EnviarSolicitud);
  fixture.componentRef.setInput('animalId', 10);
  fixture.componentRef.setInput('nombreAnimal', 'Lupe');
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, http: TestBed.inject(HttpTestingController) };
}

function escribirYEnviar(el: HTMLElement, texto: string) {
  const t = el.querySelector('textarea')!;
  t.value = texto;
  t.dispatchEvent(new Event('input'));
  el.querySelector('form')!.dispatchEvent(new Event('submit'));
}

describe('EnviarSolicitud', () => {
  it('exige un mensaje de al menos 10 caracteres', () => {
    const { fixture, el, http } = crear();
    escribirYEnviar(el, '   hola   ');
    fixture.detectChanges();
    http.expectNone(() => true);
    expect(el.textContent).toContain('al menos 10 caracteres');
  });

  it('envía el mensaje y avisa al padre', () => {
    const { fixture, el, http } = crear();
    let emitida: Solicitud | undefined;
    fixture.componentInstance.enviada.subscribe((s) => (emitida = s));

    escribirYEnviar(el, 'Tengo patio y tiempo para ella');
    const req = http.expectOne((r) => r.url.endsWith('/solicitudes'));
    expect(req.request.body).toEqual({ animalId: 10, mensaje: 'Tengo patio y tiempo para ella' });
    req.flush({ id: 1, animalId: 10, solicitanteId: 2, mensaje: 'x', estado: 'PENDIENTE', fechaSolicitud: '', fechaDecision: null });

    expect(emitida?.estado).toBe('PENDIENTE');
  });

  it('muestra el error de solicitud duplicada', () => {
    const { fixture, el, http } = crear();
    escribirYEnviar(el, 'Tengo patio y tiempo para ella');
    http.expectOne((r) => r.url.endsWith('/solicitudes')).flush(
      { mensaje: 'Ya tienes una solicitud activa sobre este animal' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();
    expect(el.textContent).toContain('Ya tienes una solicitud activa');
  });
});
