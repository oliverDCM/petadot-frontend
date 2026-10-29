import { HttpErrorResponse } from '@angular/common/http';
import { camposConError, estadoHttp, mensajeDeError, SIN_CONEXION } from './errores';

describe('errores', () => {
  it('usa el mensaje del backend (formato HU-BE-17)', () => {
    const e = new HttpErrorResponse({ status: 409, error: { codigo: 409, mensaje: 'Ya existe', error: 'Ya existe' } });
    expect(mensajeDeError(e, 'otro')).toBe('Ya existe');
    expect(estadoHttp(e)).toBe(409);
  });

  it('acepta el formato anterior que solo traía "error"', () => {
    const e = new HttpErrorResponse({ status: 400, error: { error: 'Datos inválidos' } });
    expect(mensajeDeError(e, 'otro')).toBe('Datos inválidos');
  });

  it('explica cuando no hay conexión', () => {
    expect(mensajeDeError(new HttpErrorResponse({ status: 0 }), 'otro')).toBe(SIN_CONEXION);
  });

  it('usa el texto por defecto si no hay mensaje', () => {
    expect(mensajeDeError(new Error('x'), 'Por defecto')).toBe('Por defecto');
    expect(estadoHttp(new Error('x'))).toBeNull();
  });

  it('devuelve los errores por campo', () => {
    const e = new HttpErrorResponse({ status: 400, error: { mensaje: 'Datos inválidos', campos: { nombre: 'vacío' } } });
    expect(camposConError(e)).toEqual({ nombre: 'vacío' });
    expect(camposConError(new Error('x'))).toEqual({});
  });
});
