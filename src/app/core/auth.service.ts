import { Injectable } from '@angular/core';

// Los dos roles que existen en PetAdopt
export type Rol = 'VENDEDOR' | 'ADOPTANTE';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // Guarda el token y el rol cuando el usuario inicia sesión
  guardarSesion(token: string, rol: Rol): void {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
  }

  // Borra todo cuando el usuario cierra sesión
  cerrarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
  }

  // Responde: ¿hay una sesión iniciada? (sí o no)
  estaAutenticado(): boolean {
    return !!localStorage.getItem('token');
  }

  // Responde: ¿qué rol tiene el usuario?
  obtenerRol(): Rol | null {
    return localStorage.getItem('rol') as Rol | null;
  }
}