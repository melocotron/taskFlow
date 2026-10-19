/**
 * Marca de tipo para los ids de tarjeta: no se confunden con los de tablero.
 */
declare const marcaTask: unique symbol;

export type TaskId = string & { readonly [marcaTask]: true };

export function comoTaskId(valor: string): TaskId {
  return valor as TaskId;
}

/** Una unidad de trabajo dentro de una columna de un tablero. */
export interface Task {
  readonly id: TaskId;
  readonly boardId: string;
  readonly columnaId: string;
  readonly titulo: string;
  readonly descripcion: string;
  /** Nombre de quien la tiene. Pasará a `MemberId` cuando exista `entities/member`. */
  readonly responsable: string | null;
  /** Orden manual dentro de su columna. 0 es la primera. */
  readonly posicion: number;
  readonly creadoEn: string;
}

export interface DatosTask {
  readonly descripcion?: string;
  readonly responsable?: string | null;
}

/**
 * Crea una tarjeta válida.
 *
 * La posición la decide el store (va al final de su columna); aquí solo se valida
 * lo que define a la tarjeta: que tenga título.
 */
export function crearTask(
  titulo: string,
  boardId: string,
  columnaId: string,
  id: string,
  creadoEn: string,
  datos: DatosTask = {},
): Task {
  const limpio = titulo.trim();

  if (limpio.length === 0) {
    throw new Error('Una tarjeta necesita un título');
  }

  return {
    id: comoTaskId(id),
    boardId,
    columnaId,
    titulo: limpio,
    descripcion: datos.descripcion?.trim() ?? '',
    responsable: datos.responsable ?? null,
    posicion: 0,
    creadoEn,
  };
}

/** Orden estable por posición; el desempate por id evita saltos si dos empatan. */
export function porPosicion(a: Task, b: Task): number {
  return a.posicion - b.posicion || a.id.localeCompare(b.id);
}

/**
 * Renumera una columna de 0 a n-1, sin tocar las demás.
 *
 * Trabajar con índices enteros y renumerar es más simple de razonar (y de depurar)
 * que repartir posiciones fraccionarias entre vecinos.
 */
export function renumerar(tareas: readonly Task[], columnaId: string): readonly Task[] {
  const deColumna = tareas.filter((tarea) => tarea.columnaId === columnaId).sort(porPosicion);
  const posiciones = new Map(deColumna.map((tarea, indice) => [tarea.id, indice]));

  return tareas.map((tarea) =>
    tarea.columnaId === columnaId
      ? { ...tarea, posicion: posiciones.get(tarea.id) ?? tarea.posicion }
      : tarea,
  );
}
