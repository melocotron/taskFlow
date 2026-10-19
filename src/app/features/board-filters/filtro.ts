/**
 * El filtro del tablero.
 *
 * `persona` guarda el **id** de quien filtra, no su nombre: el id no cambia aunque
 * alguien se cambie el nombre, y así la URL sigue sirviendo dentro de un año.
 */
export interface FiltroTablero {
  readonly texto: string;
  /** Id de la persona responsable; cadena vacía = todas. */
  readonly persona: string;
}

export const SIN_FILTRO: FiltroTablero = { texto: '', persona: '' };

/** `true` si hay algo que filtrar; con texto de espacios no se considera filtro. */
export function filtroActivo(filtro: FiltroTablero): boolean {
  return filtro.texto.trim().length > 0 || filtro.persona.length > 0;
}

/**
 * Texto listo para comparar: minúsculas y sin acentos, para que «revision» encuentre
 * «Revisión». Se usa en los dos lados de la comparación, no solo en la búsqueda.
 */
export function normalizar(texto: string): string {
  return texto
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
