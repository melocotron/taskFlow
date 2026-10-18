import { Injectable, computed, inject, signal } from '@angular/core';
import { nuevoId } from '@shared/lib/id';
import { BoardRepository } from '../api/board.repository';
import { Board, BoardId, crearBoard } from './board.model';

/**
 * Estado de los tableros.
 *
 * Una sola fuente de verdad con signals: leer es barato, derivar es gratis y no hay
 * suscripciones que olvidar. Toda mutación persiste antes de publicar el cambio.
 */
@Injectable({ providedIn: 'root' })
export class BoardStore {
  private readonly repositorio = inject(BoardRepository);
  private readonly estado = signal<readonly Board[]>([]);

  readonly tableros = this.estado.asReadonly();

  /** Lo que se ve en la lista: los archivados siguen existiendo, pero no se muestran. */
  readonly activos = computed(() => this.estado().filter((board) => !board.archivado));

  readonly cuantosActivos = computed(() => this.activos().length);

  constructor() {
    this.estado.set(this.repositorio.cargar());
  }

  buscar(id: BoardId): Board | undefined {
    return this.estado().find((board) => board.id === id);
  }

  crear(titulo: string, ahora = new Date()): Board {
    const board = crearBoard(titulo, nuevoId(), ahora.toISOString());

    this.actualizar([...this.estado(), board]);

    return board;
  }

  renombrar(id: BoardId, titulo: string): void {
    const limpio = titulo.trim();

    if (limpio.length === 0) {
      throw new Error('Un tablero necesita un título');
    }

    this.actualizar(
      this.estado().map((board) => (board.id === id ? { ...board, titulo: limpio } : board)),
    );
  }

  archivar(id: BoardId): void {
    this.actualizar(
      this.estado().map((board) => (board.id === id ? { ...board, archivado: true } : board)),
    );
  }

  /** Único punto de escritura: así es imposible guardar en un sitio y olvidar el otro. */
  private actualizar(tableros: readonly Board[]): void {
    this.repositorio.guardar(tableros);
    this.estado.set(tableros);
  }
}
