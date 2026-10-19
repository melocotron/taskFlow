/**
 * Colores de turno: uno por persona.
 *
 * El tipo vive aquí y no en el componente de tarjeta porque lo comparten varias
 * piezas (tarjeta, avatar, selector de sesión).
 */
export type Turno = 'verde' | 'cinta' | 'madera' | 'tiza' | 'lapiz';

export const TURNOS: readonly Turno[] = ['verde', 'cinta', 'madera', 'tiza', 'lapiz'];

/** Reparte turnos en orden y vuelve a empezar si hay más personas que colores. */
export function turnoPorIndice(indice: number): Turno {
  return TURNOS[indice % TURNOS.length]!;
}
