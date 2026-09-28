import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Registro } from './features/auth/registro/registro';
import { Catalogo } from './features/animales/catalogo/catalogo';
import { Publicar } from './features/animales/publicar/publicar';
import { Solicitudes } from './features/solicitudes/solicitudes/solicitudes';
import { Perfil } from './features/perfil/perfil/perfil';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'catalogo', pathMatch: 'full' },

  // Rutas públicas: cualquiera puede entrar
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'catalogo', component: Catalogo },

  // Rutas privadas: hay que haber iniciado sesión
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  { path: 'solicitudes', component: Solicitudes, canActivate: [authGuard] },

  // Solo para VENDEDOR: sesión + rol correcto
  {
    path: 'publicar',
    component: Publicar,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['VENDEDOR'] }
  },

  // Cualquier otra dirección va al catálogo
  { path: '**', redirectTo: 'catalogo' }
];