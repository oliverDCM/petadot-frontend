// Tipos compartidos con el backend (mismos nombres y valores que la API).

export type Rol = 'VENDEDOR' | 'ADOPTANTE';
export type Especie = 'PERRO' | 'GATO' | 'OTRO';
export type Sexo = 'MACHO' | 'HEMBRA';
export type EstadoAnimal = 'DISPONIBLE' | 'RESERVADO' | 'ADOPTADO' | 'RETIRADO';
export type TipoPublicacion = 'VENTA' | 'ADOPCION';
export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type Decision = 'APROBAR' | 'RECHAZAR';

export interface Sesion {
  token: string;
  rol: Rol;
  nombre: string;
  email: string;
}

export interface AnimalDatos {
  nombre: string;
  especie: Especie;
  raza: string | null;
  edadMeses: number | null;
  sexo: Sexo;
  descripcion: string | null;
  fotoUrl: string | null;
  ciudad: string | null;
  vacunado: boolean;
  esterilizado: boolean;
  tipo: TipoPublicacion;
}

export interface Animal extends AnimalDatos {
  id: number;
  estado: EstadoAnimal;
  vendedorId: number;
  fechaPublicacion: string;
}

/** GET /api/animales/{id}: incluye nombre y ciudad de quien publicó (nunca email ni teléfono). */
export interface AnimalDetalle extends Animal {
  vendedorNombre: string | null;
  vendedorCiudad: string | null;
}

export interface FiltrosCatalogo {
  especie?: Especie | null;
  tipo?: TipoPublicacion | null;
  ciudad?: string | null;
  /** Número de página, desde 0. */
  pagina?: number;
  /** Animales por página (el backend admite hasta 100). */
  tamano?: number;
}

/** Una página del catálogo y el total de animales que cumplen los filtros (sumando todas las páginas). */
export interface PaginaAnimales {
  animales: Animal[];
  total: number;
}

export interface Solicitud {
  id: number;
  animalId: number;
  solicitanteId: number;
  mensaje: string;
  estado: EstadoSolicitud;
  fechaSolicitud: string;
  fechaDecision: string | null;
}

export interface Contacto {
  nombre: string;
  ciudad: string | null;
  email: string;
  telefono: string | null;
}

export interface PerfilPublico {
  nombre: string;
  ciudad: string | null;
  rol: Rol;
}

export interface MensajeApi {
  mensaje: string;
}

/** Formato de error del backend (HU-BE-17). */
export interface ErrorApi {
  codigo: number;
  mensaje: string;
  error: string;
  timestamp: string;
  ruta: string;
  campos?: Record<string, string>;
}
