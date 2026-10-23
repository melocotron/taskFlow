/**
 * API pública del slice `board`.
 *
 * Es lo único que se puede importar desde fuera (lo verifica el lint de fronteras).
 * `model/` y `api/` son privados a propósito.
 */
export { BoardStore } from './model/board.store';
export { BoardRepository } from './api/board.repository';
export { ImportadorLocal } from './api/importador-local';
export type { ResultadoImportacion } from './api/importador-local';
export { COLUMNAS_POR_DEFECTO, comoBoardId, esMiembro, puedeEn, rolEn } from './model/board.model';
export type { Board, BoardId, BoardMember, Columna } from './model/board.model';
