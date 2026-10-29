import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { CargaService } from './carga.service';

export const cargaInterceptor: HttpInterceptorFn = (req, next) => {
  const carga = inject(CargaService);
  carga.iniciar();
  return next(req).pipe(finalize(() => carga.terminar()));
};
