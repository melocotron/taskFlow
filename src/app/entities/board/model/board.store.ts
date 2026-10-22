import { Injectable, computed, inject, signal } from '@angular/core';
import type { MemberId, Rol } from '@entities/member';
import { EstadoCarga } from '@shared/lib/estado-carga';
import { nuevoId } from '@shared/lib/id';
import { BoardRepository } from '../api/board.repository';
import { Board, BoardId, crearBoard, puedeEn } from './board.model';

/**
 * Estado de los tableros.
 *
 * Una sola fuente de verdad con signals: leer es barato, derivar es gratis y no hay
 * suscripciones que olvidar. Toda mutación persiste antes de publicar el cambio.
 *
 * Quién puede hacer qué no es global: se pregunta al tablero concreto. Invitar o
 * cambiar un rol exige administrarlo, y esa comprobación vive aquí, no solo en la UI.
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

  /** Quien crea el tablero entra como administrador. */
  crear(titulo: string, creador: MemberId, ahora = new Date()): Board {
    const board = crearBoard(titulo, nuevoId(), ahora.toISOString(), creador);

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

  /**
   * Invita a una persona con un rol concreto.
   *
   * El actor se pasa desde fuera y se comprueba aquí: esconder el botón no es la
   * puerta. Tampoco se puede invitar dos veces a la misma persona.
   */
  invitar(id: BoardId, actor: MemberId, nuevo: MemberId, rol: Rol): void {
    const board = this.exigirTablero(id);
    this.exigirAdministracion(board, actor);

    if (board.miembros.some((miembro) => miembro.memberId === nuevo)) {
      throw new Error('Esa persona ya está en el tablero');
    }

    this.actualizar(
      this.estado().map((candidato) =>
        candidato.id === id
          ? { ...candidato, miembros: [...candidato.miembros, { memberId: nuevo, rol }] }
          : candidato,
      ),
    );
  }

  /**
   * Cambia el rol de alguien que ya está en el tablero.
   *
   * Se impide dejar el tablero sin administración: sería un callejón sin salida para
   * invitar, cambiar roles o, en el futuro, archivar.
   */
  cambiarRol(id: BoardId, actor: MemberId, memberId: MemberId, rol: Rol): void {
    const board = this.exigirTablero(id);
    this.exigirAdministracion(board, actor);

    const actual = board.miembros.find((miembro) => miembro.memberId === memberId);

    if (!actual) {
      throw new Error('Esa persona no está en el tablero');
    }

    if (actual.rol === rol) {
      return;
    }

    const administradores = board.miembros.filter((miembro) => miembro.rol === 'admin').length;

    if (actual.rol === 'admin' && administradores === 1) {
      throw new Error('El tablero necesita al menos una persona que lo administre');
    }

    this.actualizar(
      this.estado().map((candidato) =>
        candidato.id === id
          ? {
              ...candidato,
              miembros: candidato.miembros.map((miembro) =>
                miembro.memberId === memberId ? { ...miembro, rol } : miembro,
              ),
            }
          : candidato,
      ),
    );
  }

  archivar(id: BoardId): void {
    this.actualizar(
      this.estado().map((board) => (board.id === id ? { ...board, archivado: true } : board)),
    );
  }

  private exigirTablero(id: BoardId): Board {
    const board = this.buscar(id);

    if (!board) {
      throw new Error('Ese tablero no existe');
    }

    return board;
  }

  private exigirAdministracion(board: Board, actor: MemberId): void {
    if (!puedeEn(board, actor, 'administrar')) {
      throw new Error('Solo quien administra puede gestionar las personas del tablero');
    }
  }

  /** Único punto de escritura: así es imposible guardar en un sitio y olvidar el otro. */
  private actualizar(tableros: readonly Board[]): void {
    this.repositorio.guardar(tableros);
    this.estado.set(tableros);
  }
}
