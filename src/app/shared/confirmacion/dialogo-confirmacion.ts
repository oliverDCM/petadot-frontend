import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { ConfirmacionService } from './confirmacion.service';

@Component({
  selector: 'app-dialogo-confirmacion',
  template: `
    <dialog #dialogo class="dialogo" (cancel)="responder(false, $event)" aria-labelledby="dialogo-titulo">
      @if (confirmacion.actual(); as c) {
        <h2 id="dialogo-titulo" class="dialogo-titulo">{{ c.titulo }}</h2>
        <p class="dialogo-mensaje">{{ c.mensaje }}</p>
        <div class="dialogo-acciones">
          <button type="button" class="boton boton-secundario" (click)="responder(false)" autofocus>
            {{ c.cancelar ?? 'Cancelar' }}
          </button>
          <button
            type="button"
            class="boton"
            [class.boton-peligro]="c.peligro"
            [class.boton-primario]="!c.peligro"
            (click)="responder(true)"
          >
            {{ c.aceptar }}
          </button>
        </div>
      }
    </dialog>
  `,
})
export class DialogoConfirmacion {
  protected confirmacion = inject(ConfirmacionService);
  private dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const el = this.dialogo().nativeElement;
      const abierta = this.confirmacion.actual() !== null;
      if (abierta && !el.open && typeof el.showModal === 'function') {
        el.showModal();
      } else if (!abierta && el.open) {
        el.close();
      }
    });
  }

  responder(ok: boolean, evento?: Event): void {
    evento?.preventDefault();
    this.confirmacion.actual()?.responder(ok);
  }
}
