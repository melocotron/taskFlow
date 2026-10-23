import { Injectable, computed, inject, signal } from '@angular/core';
import type { MemberId, Rol } from '@entities/member';
import { EstadoCarga } from '@shared/lib/estado-carga';
import { BoardRepository } from '../api/board.repository';
import { Board, BoardId, BoardMember } from './board.model';

/**
 * Estado de los tableros.
 *
 * Una sola fuente de verdad con signals: leer es barato y derivar es gratis. Toda
 * mutación espera la respuesta del servidor antes de publicar el cambio; si la API
 * falla, el estado local no miente. El servidor comprueba los roles aunque la interfaz
 * esconda el botón.
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

  /** Quien crea el tablero entra como administrador; lo decide el servidor. */
  async crear(titulo: string): Promise<Board> {
    const limpio = titulo.trim();

    if (limpio.length === 0) {
      throw new Error('Un tablero necesita un título');
    }

    const board = await this.repositorio.crear(limpio);

    this.estado.update((tableros) => [...tableros, board]);

    return board;
  }

  async renombrar(id: BoardId, titulo: string): Promise<Board> {
    const limpio = titulo.trim();

    if (limpio.length === 0) {
      throw new Error('Un tablero necesita un título');
    }

    const board = await this.repositorio.renombrar(id, limpio);

    this.reemplazar(board);

    return board;
  }

  /** Invita a una cuenta real por email. El rol es de este tablero. */
  async invitar(id: BoardId, email: string, rol: Rol): Promise<BoardMember> {
    const member = await this.repositorio.invitar(id, email, rol);

    this.estado.update((tableros) =>
      tableros.map((board) =>
        board.id === id && !board.miembros.some((actual) => actual.memberId === member.memberId)
          ? { ...board, miembros: [...board.miembros, member] }
          : board,
      ),
    );

    return member;
  }

  async cambiarRol(id: BoardId, memberId: MemberId, rol: Rol): Promise<BoardMember> {
    const member = await this.repositorio.cambiarRol(id, memberId, rol);

    this.estado.update((tableros) =>
      tableros.map((board) =>
        board.id === id
          ? {
              ...board,
              miembros: board.miembros.map((actual) =>
                actual.memberId === member.memberId ? member : actual,
              ),
            }
          : board,
      ),
    );

    return member;
  }

  async archivar(id: BoardId): Promise<void> {
    this.reemplazar(await this.repositorio.archivar(id));
  }

  private reemplazar(board: Board): void {
    this.estado.update((tableros) =>
      tableros.map((candidato) => (candidato.id === board.id ? board : candidato)),
    );
  }
}
