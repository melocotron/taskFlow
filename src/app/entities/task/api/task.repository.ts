import { Injectable, inject } from '@angular/core';
import type { MemberId } from '@entities/member';
import { ApiClient } from '@shared/api';
import type { DatosTask, Task } from '../model/task.model';
import { comoTaskId } from '../model/task.model';
import { comoMemberId } from '@entities/member';

interface TaskDto {
  readonly id: string;
  readonly boardId: string;
  readonly columnaId: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly responsableId: string | null;
  readonly responsableNombre: string | null;
  readonly posicion: number;
  readonly version: number;
  readonly creadoEn: string;
}

interface BoardDetailDto {
  readonly tareas: readonly TaskDto[];
}

/**
 * Acceso HTTP a las tarjetas.
 *
 * La API entrega las tarjetas dentro del detalle del tablero: una sola consulta basta
 * para pintar el lienzo y evita pedir una por una. Las mutaciones devuelven la tarjeta
 * completa con su versión nueva, que el store publica sin inventar estados.
 */
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private readonly api = inject(ApiClient);

  async cargar(boardId: string): Promise<readonly Task[]> {
    const detalle = await this.api.get<BoardDetailDto>(`boards/${boardId}`);

    return detalle.tareas.map((tarea) => this.aTask(tarea));
  }

  async crear(
    boardId: string,
    columnaId: string,
    titulo: string,
    datos: DatosTask = {},
  ): Promise<Task> {
    return this.aTask(
      await this.api.post<TaskDto>(`boards/${boardId}/tasks`, {
        columnaId,
        titulo: titulo.trim(),
        descripcion: datos.descripcion?.trim() ?? '',
        responsableId: datos.responsableId ?? null,
      }),
    );
  }

  async editar(
    id: string,
    cambios: {
      readonly titulo?: string;
      readonly descripcion?: string;
      readonly responsableId?: MemberId | null;
    },
    version: number,
  ): Promise<Task> {
    return this.aTask(
      await this.api.patch<TaskDto>(`tasks/${id}`, {
        titulo: cambios.titulo,
        descripcion: cambios.descripcion,
        responsableId: cambios.responsableId,
        version,
      }),
    );
  }

  async mover(id: string, columnaId: string, posicion: number, version: number): Promise<Task> {
    return this.aTask(
      await this.api.post<TaskDto>(`tasks/${id}/move`, { columnaId, posicion, version }),
    );
  }

  async eliminar(id: string): Promise<void> {
    await this.api.delete(`tasks/${id}`);
  }

  private aTask(dto: TaskDto): Task {
    return {
      id: comoTaskId(dto.id),
      boardId: dto.boardId,
      columnaId: dto.columnaId,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      responsableId: dto.responsableId ? comoMemberId(dto.responsableId) : null,
      responsable: dto.responsableNombre,
      posicion: dto.posicion,
      version: dto.version,
      creadoEn: dto.creadoEn,
    };
  }
}
