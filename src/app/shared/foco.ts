/** Lleva el foco (y la vista) al primer campo inválido de un formulario. */
export function enfocarPrimerInvalido(contenedor: HTMLElement): void {
  const campo = contenedor.querySelector<HTMLElement>(
    'input.ng-invalid, select.ng-invalid, textarea.ng-invalid',
  );
  campo?.focus();
}
