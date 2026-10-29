import { Injectable, signal } from '@angular/core';

export type TipoAviso = 'exito' | 'error' | 'info';

export interface Aviso {
  id: number;
  tipo: TipoAviso;
  texto: string;
}

/** Avisos tipo "toast" para toda la app (HU-FE-16). */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private siguienteId = 1;
  readonly avisos = signal<Aviso[]>([]);

  exito(texto: string): void {
    this.mostrar('exito', texto, 4500);
  }

  error(texto: string): void {
    this.mostrar('error', texto, 7000);
  }

  info(texto: string): void {
    this.mostrar('info', texto, 5000);
  }

  cerrar(id: number): void {
    this.avisos.update((lista) => lista.filter((a) => a.id !== id));
  }

  private mostrar(tipo: TipoAviso, texto: string, ms: number): void {
    const id = this.siguienteId++;
    // Un mismo texto no se apila dos veces
    this.avisos.update((lista) => [...lista.filter((a) => a.texto !== texto), { id, tipo, texto }].slice(-4));
    setTimeout(() => this.cerrar(id), ms);
  }
}
