import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type Rol = 'VENDEDOR' | 'ADOPTANTE';

export interface Sesion {
  token: string;
  rol: Rol;
  nombre: string;
  email: string;
}

export interface LoginDatos {
  email: string;
  password: string;
}

export interface RegistroDatos {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  ciudad: string;
  rol: Rol;
}

const CLAVE_SESION = 'petadopt_sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/auth`;

  readonly sesion = signal<Sesion | null>(this.leerSesion());

  registrar(datos: RegistroDatos): Observable<unknown> {
    return this.http.post(`${this.api}/register`, datos);
  }

  login(datos: LoginDatos): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.api}/login`, datos).pipe(
      tap((sesion) => this.guardarSesion(sesion))
    );
  }

  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_SESION);
    this.sesion.set(null);
  }

  estaAutenticado(): boolean {
    return this.sesion() !== null;
  }

  obtenerRol(): Rol | null {
    return this.sesion()?.rol ?? null;
  }

  obtenerToken(): string | null {
    return this.sesion()?.token ?? null;
  }

  private guardarSesion(sesion: Sesion): void {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    this.sesion.set(sesion);
  }

  private leerSesion(): Sesion | null {
    try {
      const crudo = localStorage.getItem(CLAVE_SESION);
      return crudo ? (JSON.parse(crudo) as Sesion) : null;
    } catch {
      return null;
    }
  }
}