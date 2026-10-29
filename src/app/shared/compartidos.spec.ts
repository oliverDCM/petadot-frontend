import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CargaService } from '../core/http/carga.service';
import { cargaInterceptor } from '../core/http/carga.interceptor';
import { NotificacionService } from '../core/notificaciones/notificacion.service';
import { Avisos } from './avisos/avisos';
import { BarraCarga } from './barra-carga/barra-carga';
import { ConfirmacionService } from './confirmacion/confirmacion.service';
import { DialogoConfirmacion } from './confirmacion/dialogo-confirmacion';
import { EstadoChip } from './estado/estado-chip';
import { enfocarPrimerInvalido } from './foco';

describe('Componentes compartidos', () => {
  it('la barra de carga aparece mientras hay peticiones', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([cargaInterceptor])), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BarraCarga);
    TestBed.inject(HttpClient).get('/api/x').subscribe();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.barra-carga')).not.toBeNull();

    TestBed.inject(HttpTestingController).expectOne('/api/x').flush({});
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.barra-carga')).toBeNull();
    expect(TestBed.inject(CargaService).activa()).toBe(false);
  });

  it('los avisos se muestran y se pueden cerrar', () => {
    const fixture = TestBed.createComponent(Avisos);
    TestBed.inject(NotificacionService).error('Algo falló');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role=alert]')!.textContent).toContain('Algo falló');
    el.querySelector<HTMLButtonElement>('.aviso-cerrar')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.aviso')).toBeNull();
  });

  it('el diálogo de confirmación responde según el botón', async () => {
    const fixture = TestBed.createComponent(DialogoConfirmacion);
    fixture.detectChanges();
    const servicio = TestBed.inject(ConfirmacionService);
    const respuesta = servicio.preguntar({ titulo: '¿Retirar?', mensaje: 'No se puede deshacer', aceptar: 'Retirar', peligro: true });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('¿Retirar?');
    el.querySelector<HTMLButtonElement>('.boton-peligro')!.click();
    await expect(respuesta).resolves.toBe(true);
  });

  it('el chip de estado traduce animales y solicitudes', () => {
    const fixture = TestBed.createComponent(EstadoChip);
    fixture.componentRef.setInput('estado', 'RESERVADO');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reservado');
    fixture.componentRef.setInput('estado', 'RECHAZADA');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Rechazada');
    expect(fixture.nativeElement.querySelector('.estado-rechazada')).not.toBeNull();
  });

  it('lleva el foco al primer campo inválido', () => {
    const div = document.createElement('div');
    div.innerHTML = '<input class="ng-valid" id="a"><input class="ng-invalid" id="b">';
    document.body.appendChild(div);
    enfocarPrimerInvalido(div);
    expect(document.activeElement?.id).toBe('b');
    div.remove();
  });
});
