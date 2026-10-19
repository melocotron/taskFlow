import { Injectable, computed, inject, signal } from '@angular/core';
import { EstadoCarga } from '@shared/lib/estado-carga';
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
  private readonly estadoCarga = signal<EstadoCarga>('cargando');
  private readonly motivoFallo = signal<string | null>(null);

  /** Se resuelve cuando termina la primera carga. Los tests la esperan. */
  readonly listo: Promise<void>;

  readonly tableros = this.estado.asReadonly();
  readonly carga = this.estadoCarga.asReadonly();
  readonly error = this.motivoFallo.asReadonly();

  readonly cargando = computed(() => this.estadoCarga() === 'cargando');
  readonly conFallo = computed(() => this.estadoCarga() === 'error');

  /** Lo que se ve en la lista: los archivados siguen existiendo, pero no se muestran. */
  readonly activos = computed(() => this.estado().filter((board) => !board.archivado));

  readonly cuantosActivos = computed(() => this.activos().length);

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
        fallo instanceof Error ? fallo.message : 'No se pudieron cargar los tableros',
      );
      this.estadoCarga.set('error');
    }
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
