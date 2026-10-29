import { Injectable, signal } from '@angular/core';

export interface PeticionConfirmacion {
  titulo: string;
  mensaje: string;
  aceptar: string;
  cancelar?: string;
  peligro?: boolean;
}

interface Abierta extends PeticionConfirmacion {
  responder: (ok: boolean) => void;
}

/** Diálogo de confirmación antes de acciones que no se pueden deshacer (HU-FE-13). */
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  readonly actual = signal<Abierta | null>(null);

  preguntar(peticion: PeticionConfirmacion): Promise<boolean> {
    this.actual()?.responder(false);
    return new Promise<boolean>((resolve) => {
      this.actual.set({
        ...peticion,
        responder: (ok) => {
          this.actual.set(null);
          resolve(ok);
        },
      });
    });
  }
}
