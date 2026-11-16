import { randomUUID } from 'node:crypto';

export type Rol = 'ADOPTANTE' | 'VENDEDOR';

export interface UsuarioPrueba {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  ciudad: string;
  rol: Rol;
}

/** Sufijo único por llamada: cada prueba crea sus propios datos y se puede repetir sin limpiar la base. */
export function unico(): string {
  return `${Date.now().toString(36)}${randomUUID().slice(0, 6)}`;
}

export function nuevoUsuario(rol: Rol, nombre = rol === 'VENDEDOR' ? 'Carlos Vendedor' : 'Ana Adoptante'): UsuarioPrueba {
  const id = unico();
  return {
    nombre: `${nombre} ${id}`,
    email: `e2e.${rol.toLowerCase()}.${id}@petadopt.test`,
    password: 'Clave-E2e-2026',
    telefono: '3101234567',
    ciudad: 'Fusagasugá',
    rol,
  };
}

/** Ciudad única: permite filtrar el catálogo y ver solo los animales creados por la prueba. */
export function ciudadUnica(): string {
  return `E2E ${unico()}`;
}
