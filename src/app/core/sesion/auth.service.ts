import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MensajeApi, Rol, Sesion } from '../modelos';
import { leerJwt, TokenStorageService } from './token-storage.service';

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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private storage = inject(TokenStorageService);
  private api = `${environment.apiUrl}/auth`;

  readonly sesion = signal<Sesion | null>(this.storage.leer());

  /** Id del usuario (el backend lo pone en el campo "sub" del token). */
  readonly usuarioId = computed<number | null>(() => {
    const sesion = this.sesion();
    const sub = sesion ? leerJwt(sesion.token)?.sub : undefined;
    const id = sub ? Number(sub) : NaN;
    return Number.isFinite(id) ? id : null;
  });

  readonly rol = computed<Rol | null>(() => this.sesion()?.rol ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);

  registrar(datos: RegistroDatos): Observable<unknown> {
    return this.http.post(`${this.api}/register`, {
      ...datos,
      email: datos.email.trim(),
      telefono: datos.telefono.trim() || null,
      ciudad: datos.ciudad.trim() || null,
    });
  }

  login(datos: LoginDatos): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.api}/login`, { email: datos.email.trim(), password: datos.password })
      .pipe(tap((sesion) => this.guardarSesion(sesion)));
  }

  olvideContrasena(email: string): Observable<MensajeApi> {
    return this.http.post<MensajeApi>(`${this.api}/olvide-contrasena`, { email: email.trim() });
  }

  restablecerContrasena(token: string, nuevaPassword: string): Observable<MensajeApi> {
    return this.http.post<MensajeApi>(`${this.api}/restablecer-contrasena`, { token, nuevaPassword });
  }

  cerrarSesion(): void {
    this.storage.borrar();
    this.sesion.set(null);
  }

  estaAutenticado(): boolean {
    return this.autenticado();
  }

  obtenerRol(): Rol | null {
    return this.rol();
  }

  obtenerToken(): string | null {
    return this.sesion()?.token ?? null;
  }

  private guardarSesion(sesion: Sesion): void {
    this.storage.guardar(sesion);
    this.sesion.set(sesion);
  }
}
