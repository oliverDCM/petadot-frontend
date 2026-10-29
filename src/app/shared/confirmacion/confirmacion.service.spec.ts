import { TestBed } from '@angular/core/testing';
import { ConfirmacionService } from './confirmacion.service';

describe('ConfirmacionService', () => {
  it('resuelve con la respuesta del usuario y se cierra', async () => {
    const servicio = TestBed.inject(ConfirmacionService);
    const respuesta = servicio.preguntar({ titulo: '¿Seguro?', mensaje: 'x', aceptar: 'Sí' });
    expect(servicio.actual()?.titulo).toBe('¿Seguro?');

    servicio.actual()!.responder(true);

    await expect(respuesta).resolves.toBe(true);
    expect(servicio.actual()).toBeNull();
  });

  it('una pregunta nueva cancela la anterior', async () => {
    const servicio = TestBed.inject(ConfirmacionService);
    const primera = servicio.preguntar({ titulo: 'A', mensaje: 'x', aceptar: 'Sí' });
    servicio.preguntar({ titulo: 'B', mensaje: 'x', aceptar: 'Sí' });
    await expect(primera).resolves.toBe(false);
  });
});
