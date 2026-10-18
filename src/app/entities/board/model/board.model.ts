/**
 * Marca de tipo para los identificadores.
 *
 * El compilador no puede confundir el id de un tablero con el de una tarjeta,
 * aunque ambos sean cadenas en tiempo de ejecución. Los errores de "pasé el id
 * equivocado" dejan de existir.
 */
declare const marcaBoard: unique symbol;

export type BoardId = string & { readonly [marcaBoard]: true };

/** Única puerta por la que una cadena se convierte en `BoardId`. */
export function comoBoardId(valor: string): BoardId {
  return valor as BoardId;
}

/** Una fase del flujo dentro de un tablero. */
export interface Columna {
  readonly id: string;
  readonly titulo: string;
}

/** Un espacio de trabajo compartido. */
export interface Board {
  readonly id: BoardId;
  readonly titulo: string;
  readonly columnas: readonly Columna[];
  readonly archivado: boolean;
  /** ISO 8601. Cadena y no `Date` para que sobreviva a JSON sin sorpresas. */
  readonly creadoEn: string;
}

/** Todo tablero nuevo empieza con el flujo más común. */
export const COLUMNAS_POR_DEFECTO: readonly Columna[] = [
  { id: 'por-hacer', titulo: 'Por hacer' },
  { id: 'en-curso', titulo: 'En curso' },
  { id: 'hecho', titulo: 'Hecho' },
];

/**
 * Crea un tablero válido.
 *
 * La regla de negocio vive aquí, no en el store: un tablero sin título no debería
 * poder construirse, venga de donde venga la petición.
 */
export function crearBoard(titulo: string, id: string, creadoEn: string): Board {
  const limpio = titulo.trim();

  if (limpio.length === 0) {
    throw new Error('Un tablero necesita un título');
  }

  return {
    id: comoBoardId(id),
    titulo: limpio,
    columnas: COLUMNAS_POR_DEFECTO,
    archivado: false,
    creadoEn,
  };
}
