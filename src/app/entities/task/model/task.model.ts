import type { MemberId } from '@entities/member';

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
  /** Cuenta asignada; `null` si no tiene responsable. */
  readonly responsableId: MemberId | null;
  /** Nombre desnormalizado que devuelve la API, para pintar sin otra consulta. */
  readonly responsable: string | null;
  /** Orden manual dentro de su columna. 0 es la primera. */
  readonly posicion: number;
  /** Versión optimista: el servidor rechaza una edición con una versión vieja. */
  readonly version: number;
  readonly creadoEn: string;
}

export interface DatosTask {
  readonly descripcion?: string;
  readonly responsableId?: MemberId | null;
}

/**
 * Crea una tarjeta válida en memoria.
 *
 * La usan los tests y la creación optimista; la API devuelve la tarjeta definitiva con
 * su id, posición y versión reales.
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
    responsableId: datos.responsableId ?? null,
    responsable: null,
    posicion: 0,
    version: 1,
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
