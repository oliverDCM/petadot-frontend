import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../modelos';
import { AuthService } from '../sesion/auth.service';

/** Solo deja entrar a los roles indicados en data.roles de la ruta. */
export const roleGuard: CanActivateFn = (route) => {
  const rolesPermitidos = (route.data['roles'] ?? []) as Rol[];
  const rol = inject(AuthService).obtenerRol();
  if (rol && rolesPermitidos.includes(rol)) {
    return true;
  }
  return inject(Router).createUrlTree(['/catalogo']);
};
