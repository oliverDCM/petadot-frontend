import { Especie, EstadoAnimal, EstadoSolicitud, Sexo, TipoPublicacion } from '../core/modelos';

export const IMAGEN_POR_DEFECTO = '/sin-foto.svg';

const ESPECIES: Record<Especie, string> = { PERRO: 'Perro', GATO: 'Gato', OTRO: 'Otra especie' };
const TIPOS: Record<TipoPublicacion, string> = { ADOPCION: 'En adopción', VENTA: 'En venta' };
const ESTADOS_ANIMAL: Record<EstadoAnimal, string> = {
  DISPONIBLE: 'Disponible',
  RESERVADO: 'Reservado',
  ADOPTADO: 'Adoptado',
  RETIRADO: 'Retirado',
};
const ESTADOS_SOLICITUD: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};

export const textoEspecie = (e: Especie): string => ESPECIES[e] ?? e;
export const textoTipo = (t: TipoPublicacion): string => TIPOS[t] ?? t;
export const textoEstadoAnimal = (e: EstadoAnimal): string => ESTADOS_ANIMAL[e] ?? e;
export const textoEstadoSolicitud = (e: EstadoSolicitud): string => ESTADOS_SOLICITUD[e] ?? e;
export const textoSexo = (s: Sexo): string => (s === 'MACHO' ? 'Macho' : 'Hembra');

/** "Perro macho", "Perra", "Gato macho", "Gata", "Otra especie, hembra". */
export function describirAnimal(especie: Especie, sexo: Sexo): string {
  if (especie === 'OTRO') {
    return `Otra especie, ${sexo === 'MACHO' ? 'macho' : 'hembra'}`;
  }
  if (sexo === 'HEMBRA') {
    return especie === 'PERRO' ? 'Perra' : 'Gata';
  }
  return `${ESPECIES[especie]} macho`;
}

/** 0 → "Menos de un mes", 5 → "5 meses", 14 → "1 año y 2 meses". */
export function textoEdad(meses: number | null | undefined): string {
  if (meses === null || meses === undefined) {
    return 'Edad sin indicar';
  }
  if (meses < 1) {
    return 'Menos de un mes';
  }
  if (meses < 12) {
    return meses === 1 ? '1 mes' : `${meses} meses`;
  }
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const textoAnios = anios === 1 ? '1 año' : `${anios} años`;
  if (resto === 0) {
    return textoAnios;
  }
  return `${textoAnios} y ${resto === 1 ? '1 mes' : `${resto} meses`}`;
}

/** Mismas transiciones que permite el backend (PUT /api/animales/{id}/estado). */
export function transicionesPermitidas(estado: EstadoAnimal): EstadoAnimal[] {
  switch (estado) {
    case 'DISPONIBLE':
      return ['RETIRADO'];
    case 'RESERVADO':
      return ['ADOPTADO', 'DISPONIBLE', 'RETIRADO'];
    default:
      return [];
  }
}

/**
 * Número para wa.me en formato internacional, solo dígitos.
 * Un celular colombiano de 10 dígitos (3xx...) recibe el prefijo 57.
 */
export function telefonoInternacional(telefono: string | null | undefined, prefijo = '57'): string | null {
  if (!telefono) {
    return null;
  }
  const digitos = telefono.replace(/\D/g, '');
  if (digitos.length === 10) {
    return prefijo + digitos;
  }
  if (digitos.length >= 11 && digitos.length <= 15) {
    return digitos;
  }
  return null;
}

export function enlaceWhatsApp(telefono: string | null | undefined, mensaje: string): string | null {
  const numero = telefonoInternacional(telefono);
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` : null;
}

export function enlaceCorreo(email: string, asunto: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(asunto)}`;
}
