import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificacionService } from '../notificaciones/notificacion.service';
import { AuthService } from '../sesion/auth.service';

/** Agrega "Authorization: Bearer <token>" a las peticiones a la API y maneja el 401 global (HU-FE-05). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const avisos = inject(NotificacionService);
  const token = auth.obtenerToken();
  const esApi = req.url.startsWith(environment.apiUrl);

  if (token && esApi) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && token && esApi) {
        auth.cerrarSesion();
        avisos.info('Tu sesión terminó. Inicia sesión de nuevo para continuar.');
        const actual = router.url;
        router.navigate(['/login'], {
          queryParams: actual && !actual.startsWith('/login') ? { returnUrl: actual } : {},
        });
      }
      return throwError(() => error);
    }),
  );
};
