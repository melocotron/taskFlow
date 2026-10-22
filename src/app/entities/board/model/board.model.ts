import { puede } from '@entities/member';
import type { Accion, MemberId, Rol } from '@entities/member';

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

/**
 * Quién tiene acceso a un tablero y con qué rol.
 *
 * El rol es **por tablero**, no por persona: la misma persona puede administrar uno y
 * solo mirar otro. Por eso la pertenencia vive en el tablero y no en `Member`.
 */
export interface BoardMember {
  readonly memberId: MemberId;
  readonly rol: Rol;
}

/** Un espacio de trabajo compartido. */
export interface Board {
  readonly id: BoardId;
  readonly titulo: string;
  readonly columnas: readonly Columna[];
  readonly miembros: readonly BoardMember[];
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
 * poder construirse, venga de donde venga la petición. Quien lo crea entra como
 * administrador; invitar al resto es un paso explícito de la historia 4.
 */
export function crearBoard(titulo: string, id: string, creadoEn: string, creador: MemberId): Board {
  const limpio = titulo.trim();

  if (limpio.length === 0) {
    throw new Error('Un tablero necesita un título');
  }

  return {
    id: comoBoardId(id),
    titulo: limpio,
    columnas: COLUMNAS_POR_DEFECTO,
    miembros: [{ memberId: creador, rol: 'admin' }],
    archivado: false,
    creadoEn,
  };
}

/** Rol de una persona en un tablero concreto; `null` si no tiene acceso. */
export function rolEn(board: Board, memberId: MemberId | string | null | undefined): Rol | null {
  if (!memberId) {
    return null;
  }

  return board.miembros.find((miembro) => miembro.memberId === memberId)?.rol ?? null;
}

/** `true` si la persona tiene cualquier acceso al tablero. */
export function esMiembro(board: Board, memberId: MemberId | string | null | undefined): boolean {
  return rolEn(board, memberId) !== null;
}

/**
 * Permiso efectivo sobre un tablero.
 *
 * La matriz de roles sigue siendo única (`puede`), pero necesita el rol **de este
 * tablero**. Quien no aparece en la lista no puede ni verlo.
 */
export function puedeEn(
  board: Board,
  memberId: MemberId | string | null | undefined,
  accion: Accion,
): boolean {
  const rol = rolEn(board, memberId);

  return rol !== null && puede(rol, accion);
}
