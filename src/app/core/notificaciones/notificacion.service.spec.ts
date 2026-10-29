import { TestBed } from '@angular/core/testing';
import { NotificacionService } from './notificacion.service';

describe('NotificacionService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('muestra avisos y los quita solos', () => {
    const avisos = TestBed.inject(NotificacionService);
    avisos.exito('Guardado');
    avisos.error('Falló');
    expect(avisos.avisos().map((a) => a.texto)).toEqual(['Guardado', 'Falló']);

    vi.advanceTimersByTime(8000);
    expect(avisos.avisos()).toEqual([]);
  });

  it('no repite el mismo texto', () => {
    const avisos = TestBed.inject(NotificacionService);
    avisos.info('Hola');
    avisos.info('Hola');
    expect(avisos.avisos().length).toBe(1);
  });
});
