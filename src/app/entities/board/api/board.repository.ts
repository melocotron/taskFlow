import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@shared/api';
import type { Rol } from '@entities/member';
import { Board, BoardMember, comoBoardId } from '../model/board.model';
import { comoMemberId } from '@entities/member';

interface BoardSummaryDto {
  readonly id: string;
  readonly titulo: string;
  readonly archivado: boolean;
  readonly creadoEn: string;
}

interface ColumnDto {
  readonly id: string;
  readonly titulo: string;
  readonly posicion: number;
}

interface MemberDto {
  readonly memberId: string;
  readonly nombre: string;
  readonly email: string;
  readonly rol: Rol;
}

interface BoardDetailDto {
  readonly id: string;
  readonly titulo: string;
  readonly archivado: boolean;
  readonly creadoEn: string;
  readonly columnas: readonly ColumnDto[];
  readonly miembros: readonly MemberDto[];
}

/**
 * Acceso HTTP a los tableros.
 *
 * La API no tiene un endpoint de «tablero completo» en la lista, así que se piden los
 * detalles de cada tablero visible. La lista es pequeña y así el modelo de la interfaz
 * conserva columnas y personas sin inventar datos parciales. El servidor sigue siendo
 * la autoridad: un tablero ajeno responde `404` aunque la URL se escriba a mano.
 */
@Injectable({ providedIn: 'root' })
export class BoardRepository {
  private readonly api = inject(ApiClient);

  async cargar(): Promise<readonly Board[]> {
    const resumenes = await this.api.get<readonly BoardSummaryDto[]>('boards', {
      archivados: true,
    });

    return Promise.all(resumenes.map((resumen) => this.detalle(resumen.id)));
  }

  async crear(titulo: string): Promise<Board> {
    return this.aBoard(await this.api.post<BoardDetailDto>('boards', { titulo: titulo.trim() }));
  }

  async renombrar(id: string, titulo: string): Promise<Board> {
    return this.aBoard(
      await this.api.patch<BoardDetailDto>(`boards/${id}`, { titulo: titulo.trim() }),
    );
  }

  async archivar(id: string): Promise<Board> {
    return this.aBoard(await this.api.patch<BoardDetailDto>(`boards/${id}`, { archivado: true }));
  }

  async invitar(id: string, email: string, rol: Rol): Promise<BoardMember> {
    return this.aMiembro(
      await this.api.post<MemberDto>(`boards/${id}/members`, { email: email.trim(), rol }),
    );
  }

  async cambiarRol(id: string, memberId: string, rol: Rol): Promise<BoardMember> {
    return this.aMiembro(
      await this.api.patch<MemberDto>(`boards/${id}/members/${memberId}`, { rol }),
    );
  }

  async eliminarMiembro(id: string, memberId: string): Promise<void> {
    await this.api.delete(`boards/${id}/members/${memberId}`);
  }

  private async detalle(id: string): Promise<Board> {
    return this.aBoard(await this.api.get<BoardDetailDto>(`boards/${id}`));
  }

  private aBoard(dto: BoardDetailDto): Board {
    return {
      id: comoBoardId(dto.id),
      titulo: dto.titulo,
      columnas: [...dto.columnas]
        .sort((a, b) => a.posicion - b.posicion)
        .map((columna) => ({ id: columna.id, titulo: columna.titulo })),
      miembros: dto.miembros.map((miembro) => this.aMiembro(miembro)),
      archivado: dto.archivado,
      creadoEn: dto.creadoEn,
    };
  }

  private aMiembro(dto: MemberDto): BoardMember {
    return {
      memberId: comoMemberId(dto.memberId),
      nombre: dto.nombre,
      email: dto.email,
      rol: dto.rol,
    };
  }
}
