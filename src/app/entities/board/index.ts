/**
 * API pública del slice `board`.
 *
 * Es lo único que se puede importar desde fuera (lo verifica el lint de fronteras).
 * `model/` y `api/` son privados a propósito.
 */
export { BoardStore } from './model/board.store';
export { crearBoard, COLUMNAS_POR_DEFECTO, comoBoardId } from './model/board.model';
export type { Board, BoardId, Columna } from './model/board.model';
