import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { EstadoCarga } from '@shared/lib/estado-carga';
import { nuevoId } from '@shared/lib/id';
import { TaskRepository } from '../api/task.repository';
import { DatosTask, Task, TaskId, crearTask, porPosicion, renumerar } from '../model/task.model';

/**
 * Estado de las tarjetas.
 *
 * La operación que define este store es `mover`: cambiar de columna no es cambiar un
 * campo, es recalcular el orden de dos listas a la vez. Todo lo demás es sencillo.
 */
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly repositorio = inject(TaskRepository);
  private readonly estado = signal<readonly Task[]>([]);
  private readonly estadoCarga = signal<EstadoCarga>('cargando');
  private readonly motivoFallo = signal<string | null>(null);

  /** Caché de computeds por columna: crear uno nuevo en cada llamada los multiplicaría. */
  private readonly columnas = new Map<string, Signal<readonly Task[]>>();

  /** Se resuelve cuando termina la primera carga. Los tests la esperan. */
  readonly listo: Promise<void>;

  readonly tareas = this.estado.asReadonly();
  readonly carga = this.estadoCarga.asReadonly();
  readonly error = this.motivoFallo.asReadonly();
  readonly cargando = computed(() => this.estadoCarga() === 'cargando');

  constructor() {
    this.listo = this.cargar();
  }

  /** Carga (o recarga) desde el repositorio. Un fallo deja la app usable, no en blanco. */
  async cargar(): Promise<void> {
    this.estadoCarga.set('cargando');
    this.motivoFallo.set(null);

    try {
      this.estado.set(await this.repositorio.cargar());
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

  crear(
    boardId: string,
    columnaId: string,
    titulo: string,
    datos: DatosTask = {},
    ahora = new Date(),
  ): Task {
    const enColumna = this.estado().filter(
      (tarea) => tarea.boardId === boardId && tarea.columnaId === columnaId,
    );

    const tarea: Task = {
      ...crearTask(titulo, boardId, columnaId, nuevoId(), ahora.toISOString(), datos),
      posicion: enColumna.length,
    };

    this.actualizar([...this.estado(), tarea]);

    return tarea;
  }

  /**
   * Mueve una tarjeta a otra columna y a una posición concreta.
   *
   * - El índice se recorta al rango válido: pedir 99 en una columna de 3 la deja al final.
   * - Se renumeran **las dos** columnas: si solo se renumerara el destino, el origen
   *   quedaría con huecos y el siguiente movimiento sería impredecible.
   */
  mover(id: TaskId, columnaDestino: string, indiceDestino: number): void {
    const tarea = this.estado().find((candidata) => candidata.id === id);

    if (!tarea) {
      return;
    }

    if (tarea.columnaId === columnaDestino) {
      this.reordenar(tarea, indiceDestino);
      return;
    }

    const origen = tarea.columnaId;
    const resto = this.estado().filter((candidata) => candidata.id !== id);
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

    this.actualizar(renumerar(conDestino, origen));
  }

  editar(id: TaskId, cambios: Partial<Pick<Task, 'titulo' | 'descripcion' | 'responsable'>>): void {
    this.actualizar(
      this.estado().map((tarea) => (tarea.id === id ? { ...tarea, ...cambios } : tarea)),
    );
  }

  eliminar(id: TaskId): void {
    const tarea = this.estado().find((candidata) => candidata.id === id);

    if (!tarea) {
      return;
    }

    this.actualizar(
      renumerar(
        this.estado().filter((candidata) => candidata.id !== id),
        tarea.columnaId,
      ),
    );
  }

  /** Reordena dentro de la misma columna. */
  private reordenar(tarea: Task, indiceDestino: number): void {
    const sinLaTarea = this.estado().filter((candidata) => candidata.id !== tarea.id);
    const columna = sinLaTarea
      .filter((candidata) => candidata.columnaId === tarea.columnaId)
      .sort(porPosicion);

    const indice = recortar(indiceDestino, columna.length);
    const reordenada = [...columna.slice(0, indice), tarea, ...columna.slice(indice)].map(
      (candidata, posicion) => ({ ...candidata, posicion }),
    );

    const otras = sinLaTarea.filter((candidata) => candidata.columnaId !== tarea.columnaId);

    this.actualizar([...otras, ...reordenada]);
  }

  private actualizar(tareas: readonly Task[]): void {
    this.repositorio.guardar(tareas);
    this.estado.set(tareas);
  }
}

function recortar(indice: number, maximo: number): number {
  return Math.min(Math.max(indice, 0), maximo);
}
