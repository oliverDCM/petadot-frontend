import { HttpErrorResponse } from '@angular/common/http';
import { ErrorApi } from './modelos';

export const SIN_CONEXION = 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';

function cuerpoApi(e: unknown): Partial<ErrorApi> | null {
  if (e instanceof HttpErrorResponse && e.error && typeof e.error === 'object') {
    return e.error as Partial<ErrorApi>;
  }
  return null;
}

/** Mensaje para mostrar al usuario: el del backend si lo hay; si no, el texto por defecto. */
export function mensajeDeError(e: unknown, porDefecto: string): string {
  if (e instanceof HttpErrorResponse && e.status === 0) {
    return SIN_CONEXION;
  }
  const cuerpo = cuerpoApi(e);
  const mensaje = cuerpo?.mensaje ?? cuerpo?.error;
  return typeof mensaje === 'string' && mensaje.trim() ? mensaje : porDefecto;
}

/** Errores por campo que devuelve el backend en un 400 de validación. */
export function camposConError(e: unknown): Record<string, string> {
  return cuerpoApi(e)?.campos ?? {};
}

export function estadoHttp(e: unknown): number | null {
  return e instanceof HttpErrorResponse ? e.status : null;
}
