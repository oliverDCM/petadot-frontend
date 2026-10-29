import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Solicitud } from '../../../core/modelos';
import { ConfirmacionService } from '../../../shared/confirmacion/confirmacion.service';
import { SolicitudesRecibidas } from './recibidas';

const sol = (id: number, solicitanteId: number, estado: Solicitud['estado'] = 'PENDIENTE'): Solicitud => ({
  id, animalId: 10, solicitanteId, mensaje: 'Hola', estado, fechaSolicitud: `2026-10-0${id}T10:00:00`, fechaDecision: null,
});

describe('SolicitudesRecibidas', () => {
  it('al aprobar actualiza la lista: la aprobada y las demás pendientes del animal quedan rechazadas', async () => {
    TestBed.configureTestingModule({
      imports: [SolicitudesRecibidas],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfirmacionService, useValue: { preguntar: () => Promise.resolve(true) } },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SolicitudesRecibidas);
    fixture.detectChanges();

    http.expectOne((r) => r.url.endsWith('/solicitudes/recibidas')).flush([sol(1, 2), sol(2, 3)]);
    http.expectOne((r) => r.url.endsWith('/animales/mis-publicaciones')).flush([]);
    http.expectOne((r) => r.url.endsWith('/usuarios/2/perfil-publico')).flush({ nombre: 'Ana', ciudad: null, rol: 'ADOPTANTE' });
    http.expectOne((r) => r.url.endsWith('/usuarios/3/perfil-publico')).flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Ana');
    expect(el.textContent).toContain('Solicitante 3');

    const componente = fixture.componentInstance as unknown as { decidir(s: Solicitud, d: 'APROBAR'): Promise<void> };
    await componente.decidir(sol(1, 2), 'APROBAR');
    http.expectOne((r) => r.url.endsWith('/solicitudes/1/decision')).flush({ ...sol(1, 2, 'APROBADA'), fechaDecision: '2026-10-05T10:00:00' });
    fixture.detectChanges();

    const chips = [...el.querySelectorAll('app-estado-chip')].map((c) => c.textContent?.trim());
    expect(chips).toContain('Aprobada');
    expect(chips).toContain('Rechazada');
    expect(chips).not.toContain('Pendiente');
  });
});
