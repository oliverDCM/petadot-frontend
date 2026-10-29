import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ContactoSolicitud } from './contacto-solicitud';

function crear() {
  TestBed.configureTestingModule({ imports: [ContactoSolicitud], providers: [provideHttpClient(), provideHttpClientTesting()] });
  const fixture = TestBed.createComponent(ContactoSolicitud);
  fixture.componentRef.setInput('solicitudId', 3);
  fixture.componentRef.setInput('nombreAnimal', 'Max');
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  el.querySelector('button')!.click();
  return { fixture, el, http: TestBed.inject(HttpTestingController) };
}

describe('ContactoSolicitud', () => {
  it('muestra los datos y los enlaces de WhatsApp y correo', () => {
    const { fixture, el, http } = crear();
    http.expectOne((r) => r.url.endsWith('/solicitudes/3/contacto')).flush({
      nombre: 'Carlos', ciudad: 'Fusagasugá', email: 'carlos@test.com', telefono: '310 987 6543',
    });
    fixture.detectChanges();

    expect(el.textContent).toContain('Carlos, Fusagasugá');
    const wa = el.querySelector<HTMLAnchorElement>('a[href^="https://wa.me/"]')!;
    expect(wa.href).toContain('wa.me/573109876543');
    expect(decodeURIComponent(wa.href)).toContain('Max');
    expect(el.querySelector<HTMLAnchorElement>('a[href^="mailto:"]')!.href).toContain('carlos@test.com');
    expect(el.textContent).toContain('No los compartas');
  });

  it('sin teléfono no ofrece WhatsApp', () => {
    const { fixture, el, http } = crear();
    http.expectOne((r) => r.url.endsWith('/contacto')).flush({ nombre: 'Ana', ciudad: null, email: 'a@test.com', telefono: null });
    fixture.detectChanges();
    expect(el.querySelector('a[href^="https://wa.me/"]')).toBeNull();
    expect(el.textContent).toContain('No lo registró');
  });

  it('un 403 se explica con claridad', () => {
    const { fixture, el, http } = crear();
    http.expectOne((r) => r.url.endsWith('/contacto')).flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(el.textContent).toContain('solo están disponibles mientras la solicitud esté aprobada');
  });
});
