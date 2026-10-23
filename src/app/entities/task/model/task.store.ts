import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { EstadoCarga } from '@shared/lib/estado-carga';
import { TaskRepository } from '../api/task.repository';
import type { DatosTask, Task, TaskId } from '../model/task.model';
import { porPosicion, renumerar } from '../model/task.model';

/**
 * Estado de las tarjetas.
 *
 * La operación que define este store es `mover`: cambiar de columna no es cambiar un
 * campo, es recalcular el orden de dos listas a la vez. El movimiento se pinta antes de
 * que responda el servidor y se revierte si la API rechaza la versión; crear, editar y
 * borrar esperan la respuesta para no inventar identificadores ni versiones.
 */
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly repositorio = inject(TaskRepository);
  private readonly estado = signal<readonly Task[]>([]);
  private readonly estadoCarga = signal<EstadoCarga>('listo');
  private readonly motivoFallo = signal<string | null>(null);

  /** Caché de computeds por columna: crear uno nuevo en cada llamada los multiplicaría. */
  private readonly columnas = new Map<string, Signal<readonly Task[]>>();

  /** Se resuelve cuando termina la carga del tablero actual. */
  readonly listo = Promise.resolve();

  readonly tareas = this.estado.asReadonly();
  readonly carga = this.estadoCarga.asReadonly();
  readonly error = this.motivoFallo.asReadonly();
  readonly cargando = computed(() => this.estadoCarga() === 'cargando');

  /** Carga las tarjetas de un tablero. El lienzo lo llama al montarse y al cambiar de id. */
  async cargar(boardId: string): Promise<void> {
    this.estadoCarga.set('cargando');
    this.motivoFallo.set(null);

    try {
      this.estado.set(await this.repositorio.cargar(boardId));
      this.estadoCarga.set('listo');
    } catch (fallo) {
      this.motivoFallo.set(
        fallo instanceof Error ? fallo.message : 'No se pudieron cargar las tarjetas',
      );
      this.estadoCarga.set('error');
    }
  }

  /** Tarjetas de una columna, ya ordenadas por posición. */
  deColumna(boardId: string, columnaId: string): Signal<readonly Task[]> {
    const clave = `${boardId}::${columnaId}`;
    const cacheada = this.columnas.get(clave);

    if (cacheada) {
      return cacheada;
    }

    const nueva = computed(() =>
      this.estado()
        .filter((tarea) => tarea.boardId === boardId && tarea.columnaId === columnaId)
        .sort(porPosicion),
    );

    this.columnas.set(clave, nueva);

    return nueva;
  }

  async crear(
    boardId: string,
    columnaId: string,
    titulo: string,
    datos: DatosTask = {},
  ): Promise<Task> {
    if (titulo.trim().length === 0) {
      throw new Error('Una tarjeta necesita un título');
    }

    const tarea = await this.repositorio.crear(boardId, columnaId, titulo, datos);

    this.estado.update((tareas) => renumerar([...tareas, tarea], tarea.columnaId));

    return tarea;
  }

  async editar(
    id: TaskId,
    cambios: Partial<Pick<Task, 'titulo' | 'descripcion' | 'responsableId'>>,
  ): Promise<Task> {
    const tarea = this.buscar(id);

    if (!tarea) {
      throw new Error('La tarjeta ya no existe');
    }

    const actualizada = await this.repositorio.editar(id, cambios, tarea.version);

    this.reemplazar(actualizada);

    return actualizada;
  }

  /**
   * Mueve una tarjeta a otra columna y a una posición concreta.
   *
   * - El índice se recorta al rango válido: pedir 99 en una columna de 3 la deja al final.
   * - Se renumeran **las dos** columnas: si solo se renumerara el destino, el origen
   *   quedaría con huecos y el siguiente movimiento sería impredecible.
   * - Si el servidor rechaza la versión, el estado vuelve a como estaba.
   */
  async mover(id: TaskId, columnaDestino: string, indiceDestino: number): Promise<void> {
    const tarea = this.estado().find((candidata) => candidata.id === id);

    if (!tarea) {
      return;
    }

    const antes = this.estado();
    const despues = this.calcularMovimiento(tarea, columnaDestino, indiceDestino);
    const posicion = despues.find((candidata) => candidata.id === id)?.posicion ?? 0;

    this.estado.set(despues);

    try {
      const movida = await this.repositorio.mover(id, columnaDestino, posicion, tarea.version);

      this.reemplazar(movida);
    } catch (fallo) {
      this.estado.set(antes);
      throw fallo;
    }
  }

  async eliminar(id: TaskId): Promise<void> {
    const tarea = this.buscar(id);

    if (!tarea) {
      return;
    }

    const antes = this.estado();

    this.estado.set(
      renumerar(
        antes.filter((candidata) => candidata.id !== id),
        tarea.columnaId,
      ),
    );

    try {
      await this.repositorio.eliminar(id);
    } catch (fallo) {
      this.estado.set(antes);
      throw fallo;
    }
  }

  private buscar(id: TaskId): Task | undefined {
    return this.estado().find((tarea) => tarea.id === id);
  }

  private reemplazar(tarea: Task): void {
    this.estado.update((tareas) =>
      tareas.map((candidata) => (candidata.id === tarea.id ? tarea : candidata)),
    );
  }

  private calcularMovimiento(
    tarea: Task,
    columnaDestino: string,
    indiceDestino: number,
  ): readonly Task[] {
    if (tarea.columnaId === columnaDestino) {
      return this.reordenar(tarea, indiceDestino);
    }

    const origen = tarea.columnaId;
    const resto = this.estado().filter((candidata) => candidata.id !== tarea.id);
    const destino = resto
      .filter((candidata) => candidata.columnaId === columnaDestino)
      .sort(porPosicion);

    const indice = recortar(indiceDestino, destino.length);
    const movida: Task = { ...tarea, columnaId: columnaDestino };
    const columnaNueva = [...destino.slice(0, indice), movida, ...destino.slice(indice)];

    const otras = resto.filter((candidata) => candidata.columnaId !== columnaDestino);
    const conDestino = [
      ...otras,
      ...columnaNueva.map((candidata, posicion) => ({ ...candidata, posicion })),
    ];

    return renumerar(conDestino, origen);
  }

  /** Reordena dentro de la misma columna. */
  private reordenar(tarea: Task, indiceDestino: number): readonly Task[] {
    const sinLaTarea = this.estado().filter((candidata) => candidata.id !== tarea.id);
    const columna = sinLaTarea
      .filter((candidata) => candidata.columnaId === tarea.columnaId)
      .sort(porPosicion);

    const indice = recortar(indiceDestino, columna.length);
    const reordenada = [...columna.slice(0, indice), tarea, ...columna.slice(indice)].map(
      (candidata, posicion) => ({ ...candidata, posicion }),
    );

    const otras = sinLaTarea.filter((candidata) => candidata.columnaId !== tarea.columnaId);

    return [...otras, ...reordenada];
  }
}

function recortar(indice: number, maximo: number): number {
  return Math.min(Math.max(indice, 0), maximo);
}
