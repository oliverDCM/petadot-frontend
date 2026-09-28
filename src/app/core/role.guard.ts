import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Rol } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Lee qué roles pueden entrar a esta ruta (se define en app.routes.ts)
  const rolesPermitidos = route.data['roles'] as Rol[];
  const rolActual = auth.obtenerRol();

  // Si el rol del usuario está en la lista permitida, deja pasar
  if (rolActual && rolesPermitidos.includes(rolActual)) {
    return true;
  }
  return router.createUrlTree(['/catalogo']);
};