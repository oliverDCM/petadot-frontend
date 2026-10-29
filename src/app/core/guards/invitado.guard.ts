import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../sesion/auth.service';

/** Login y registro: si ya hay sesión, no tiene sentido mostrarlos. */
export const invitadoGuard: CanActivateFn = () =>
  inject(AuthService).estaAutenticado() ? inject(Router).createUrlTree(['/catalogo']) : true;
