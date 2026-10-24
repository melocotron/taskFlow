import type { Board, BoardMember } from '@entities/board';
import { COLUMNAS_POR_DEFECTO, comoBoardId } from '@entities/board';
import { comoMemberId } from '@entities/member';
import type { Rol } from '@entities/member';
import { comoTaskId } from '@entities/task';
import type { DatosTask, Task } from '@entities/task';

/**
 * Repositorios en memoria para los tests de UI.
 *
 * No sustituyen a los tests de contrato: permiten montar stores y pantallas sin una
 * base de datos. Los tests de repositorio usan `HttpTestingController` para comprobar
 * rutas, cuerpos y traducción de errores.
 */

export const MARTA: BoardMember = {
  memberId: comoMemberId('marta'),
  nombre: 'Marta Ruiz',
  email: 'marta@example.com',
  rol: 'admin',
};

export const IVAN: BoardMember = {
  memberId: comoMemberId('ivan'),
  nombre: 'Iván Soto',
  email: 'ivan@example.com',
  rol: 'editor',
};

export const ALBA: BoardMember = {
  memberId: comoMemberId('alba'),
  nombre: 'Alba Sanz',
  email: 'alba@example.com',
  rol: 'viewer',
};

const PERSONAS = new Map<string, BoardMember>([
  [MARTA.email, MARTA],
  [IVAN.email, IVAN],
  [ALBA.email, ALBA],
]);

const NOMBRES = new Map<string, string>([
  [MARTA.memberId, MARTA.nombre],
  [IVAN.memberId, IVAN.nombre],
  [ALBA.memberId, ALBA.nombre],
]);

export function tablero(cambios: Partial<Board> = {}): Board {
  return {
    id: comoBoardId('producto'),
    titulo: 'Producto',
    columnas: COLUMNAS_POR_DEFECTO,
    miembros: [MARTA, IVAN, ALBA],
    archivado: false,
    creadoEn: '2026-10-19T00:00:00.000Z',
    ...cambios,
  };
}

export class BoardRepositoryFalso {
  boards: Board[] = [];
  private siguiente = 1;

  constructor(
    boards: readonly Board[] = [],
    private readonly creador: BoardMember = MARTA,
  ) {
    this.boards = [...boards];
  }

  async cargar(): Promise<readonly Board[]> {
    return this.boards;
  }

  async crear(titulo: string): Promise<Board> {
    const board = tablero({
      id: comoBoardId(`board-${this.siguiente++}`),
      titulo: titulo.trim(),
      miembros: [this.creador],
    });

    this.boards = [...this.boards, board];

    return board;
  }

  async renombrar(id: string, titulo: string): Promise<Board> {
    return this.actualizar(id, { titulo: titulo.trim() });
  }

  async archivar(id: string): Promise<Board> {
    return this.actualizar(id, { archivado: true });
  }

  async invitar(id: string, email: string, rol: Rol): Promise<BoardMember> {
    const board = this.buscar(id);
    const persona = PERSONAS.get(email.trim().toLowerCase());

    if (!persona) {
      throw new Error('No hay ninguna cuenta con ese email');
    }

    if (board.miembros.some((miembro) => miembro.memberId === persona.memberId)) {
      throw new Error('Esa persona ya está en el tablero');
    }

    const member = { ...persona, rol };

    this.reemplazar({ ...board, miembros: [...board.miembros, member] });

    return member;
  }

  async cambiarRol(id: string, memberId: string, rol: Rol): Promise<BoardMember> {
    const board = this.buscar(id);
    const member = board.miembros.find((candidato) => candidato.memberId === memberId);

    if (!member) {
      throw new Error('Esa persona no está en el tablero');
    }

    const actualizado = { ...member, rol };

    this.reemplazar({
      ...board,
      miembros: board.miembros.map((candidato) =>
        candidato.memberId === memberId ? actualizado : candidato,
      ),
    });

    return actualizado;
  }

  async eliminarMiembro(id: string, memberId: string): Promise<void> {
    const board = this.buscar(id);

    this.reemplazar({
      ...board,
      miembros: board.miembros.filter((candidato) => candidato.memberId !== memberId),
    });
  }

  private buscar(id: string): Board {
    const board = this.boards.find((candidato) => candidato.id === id);

    if (!board) {
      throw new Error('El tablero no existe');
    }

    return board;
  }

  private actualizar(id: string, cambios: Partial<Board>): Board {
    const board = { ...this.buscar(id), ...cambios };

    this.reemplazar(board);

    return board;
  }

  private reemplazar(board: Board): void {
    this.boards = this.boards.map((candidato) => (candidato.id === board.id ? board : candidato));
  }
}

export class TaskRepositoryFalso {
  tareas: Task[] = [];
  private siguiente = 1;

  constructor(tareas: readonly Task[] = []) {
    this.tareas = [...tareas];
  }

  async cargar(boardId: string): Promise<readonly Task[]> {
    return this.tareas.filter((tarea) => tarea.boardId === boardId);
  }

  async crear(
    boardId: string,
    columnaId: string,
    titulo: string,
    datos: DatosTask = {},
  ): Promise<Task> {
    const tarea: Task = {
      id: comoTaskId(`tarea-${this.siguiente++}`),
      boardId,
      columnaId,
      titulo: titulo.trim(),
      descripcion: datos.descripcion?.trim() ?? '',
      responsableId: datos.responsableId ?? null,
      responsable: datos.responsableId ? (NOMBRES.get(datos.responsableId) ?? null) : null,
      posicion: this.tareas.filter(
        (candidata) => candidata.boardId === boardId && candidata.columnaId === columnaId,
      ).length,
      version: 1,
      creadoEn: '2026-10-19T00:00:00.000Z',
    };

    this.tareas = [...this.tareas, tarea];

    return tarea;
  }

  async editar(
    id: string,
    cambios: Partial<Pick<Task, 'titulo' | 'descripcion' | 'responsableId'>>,
    version: number,
  ): Promise<Task> {
    const tarea = this.buscar(id);

    if (tarea.version !== version) {
      throw new Error('La tarjeta cambió en otra sesión');
    }

    const actualizada: Task = {
      ...tarea,
      ...cambios,
      responsable:
        cambios.responsableId === undefined
          ? tarea.responsable
          : cambios.responsableId
            ? (NOMBRES.get(cambios.responsableId) ?? null)
            : null,
      version: tarea.version + 1,
    };

    this.reemplazar(actualizada);

    return actualizada;
  }

  async mover(id: string, columnaId: string, posicion: number, version: number): Promise<Task> {
    const tarea = this.buscar(id);

    if (tarea.version !== version) {
      throw new Error('La tarjeta cambió en otra sesión');
    }

    const movida: Task = {
      ...tarea,
      columnaId,
      posicion,
      version: tarea.version + 1,
    };

    this.reemplazar(movida);

    return movida;
  }

  async eliminar(id: string): Promise<void> {
    this.tareas = this.tareas.filter((tarea) => tarea.id !== id);
  }

  private buscar(id: string): Task {
    const tarea = this.tareas.find((candidata) => candidata.id === id);

    if (!tarea) {
      throw new Error('La tarjeta no existe');
    }

    return tarea;
  }

  private reemplazar(tarea: Task): void {
    this.tareas = this.tareas.map((candidata) => (candidata.id === tarea.id ? tarea : candidata));
  }
}
