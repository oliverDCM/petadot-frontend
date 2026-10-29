import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { invitadoGuard } from './core/guards/invitado.guard';
import { roleGuard } from './core/guards/role.guard';
import { AuthService } from './core/sesion/auth.service';

const soloVendedor = { canActivate: [authGuard, roleGuard], data: { roles: ['VENDEDOR'] } };
const soloAdoptante = { canActivate: [authGuard, roleGuard], data: { roles: ['ADOPTANTE'] } };

export const routes: Routes = [
  // Públicas
  { path: '', loadComponent: () => import('./paginas/inicio/inicio').then((m) => m.Inicio), title: 'PetAdopt' },
  {
    path: 'catalogo',
    loadComponent: () => import('./features/animales/catalogo/catalogo').then((m) => m.Catalogo),
    title: 'Animales disponibles | PetAdopt',
  },
  {
    path: 'animales/:id',
    loadComponent: () => import('./features/animales/detalle/detalle').then((m) => m.Detalle),
    title: 'Detalle del animal | PetAdopt',
  },

  // Solo sin sesión
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    title: 'Iniciar sesión | PetAdopt',
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
    title: 'Crear cuenta | PetAdopt',
  },
  {
    path: 'olvide-contrasena',
    loadComponent: () =>
      import('./features/auth/olvide-contrasena/olvide-contrasena').then((m) => m.OlvideContrasena),
    title: 'Recuperar contraseña | PetAdopt',
  },
  {
    path: 'restablecer-contrasena',
    loadComponent: () =>
      import('./features/auth/restablecer-contrasena/restablecer-contrasena').then(
        (m) => m.RestablecerContrasena,
      ),
    title: 'Nueva contraseña | PetAdopt',
  },

  // Con sesión
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/perfil/perfil').then((m) => m.Perfil),
    title: 'Mi perfil | PetAdopt',
  },
  {
    path: 'solicitudes',
    pathMatch: 'full',
    redirectTo: () =>
      inject(AuthService).obtenerRol() === 'VENDEDOR' ? '/solicitudes/recibidas' : '/solicitudes/mias',
  },
  {
    path: 'solicitudes/mias',
    ...soloAdoptante,
    loadComponent: () =>
      import('./features/solicitudes/mis-solicitudes/mis-solicitudes').then((m) => m.MisSolicitudes),
    title: 'Mis solicitudes | PetAdopt',
  },

  // Solo VENDEDOR
  {
    path: 'publicar',
    ...soloVendedor,
    loadComponent: () =>
      import('./features/animales/formulario-animal/formulario-animal').then((m) => m.FormularioAnimal),
    title: 'Publicar animal | PetAdopt',
  },
  {
    path: 'animales/:id/editar',
    ...soloVendedor,
    loadComponent: () =>
      import('./features/animales/formulario-animal/formulario-animal').then((m) => m.FormularioAnimal),
    title: 'Editar animal | PetAdopt',
  },
  {
    path: 'mis-publicaciones',
    ...soloVendedor,
    loadComponent: () =>
      import('./features/animales/mis-publicaciones/mis-publicaciones').then((m) => m.MisPublicaciones),
    title: 'Mis publicaciones | PetAdopt',
  },
  {
    path: 'solicitudes/recibidas',
    ...soloVendedor,
    loadComponent: () =>
      import('./features/solicitudes/recibidas/recibidas').then((m) => m.SolicitudesRecibidas),
    title: 'Solicitudes recibidas | PetAdopt',
  },
  {
    path: 'usuarios/:id/perfil',
    ...soloVendedor,
    loadComponent: () =>
      import('./features/perfil/perfil-publico/perfil-publico').then((m) => m.PerfilPublicoPagina),
    title: 'Perfil del solicitante | PetAdopt',
  },

  {
    path: '**',
    loadComponent: () => import('./paginas/no-encontrada/no-encontrada').then((m) => m.NoEncontrada),
    title: 'Página no encontrada | PetAdopt',
  },
];
