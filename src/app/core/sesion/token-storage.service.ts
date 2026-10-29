import { Injectable } from '@angular/core';
import { Sesion } from '../modelos';

const CLAVE_SESION = 'petadopt_sesion';

interface ContenidoJwt {
  sub?: string;
  exp?: number;
}

/** Lee el contenido de un JWT sin validarlo (la validación la hace el backend). */
export function leerJwt(token: string): ContenidoJwt | null {
  try {
    const parte = token.split('.')[1];
    if (!parte) {
      return null;
    }
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(relleno)) as ContenidoJwt;
  } catch {
    return null;
  }
}

/** Guarda la sesión (token JWT y datos básicos) en localStorage (HU-FE-04). */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  guardar(sesion: Sesion): void {
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // Navegación privada o almacenamiento lleno: la sesión dura solo mientras la pestaña esté abierta
    }
  }

  /** Devuelve la sesión guardada, o null si no hay o si el token ya venció. */
  leer(ahora: number = Date.now()): Sesion | null {
    let sesion: Sesion | null = null;
    try {
      const crudo = localStorage.getItem(CLAVE_SESION);
      sesion = crudo ? (JSON.parse(crudo) as Sesion) : null;
    } catch {
      return null;
    }
    if (!sesion?.token) {
      return null;
    }
    const exp = leerJwt(sesion.token)?.exp;
    if (exp !== undefined && exp * 1000 <= ahora) {
      this.borrar();
      return null;
    }
    return sesion;
  }

  borrar(): void {
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // sin almacenamiento disponible: no hay nada que borrar
    }
  }
}
