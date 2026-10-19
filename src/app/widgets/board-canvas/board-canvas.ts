import { Component, Signal, computed, inject, input } from '@angular/core';
import type { Board } from '@entities/board';
import { MemberStore } from '@entities/member';
import { TaskStore } from '@entities/task';
import type { Task } from '@entities/task';
import { turnoPorIndice } from '@shared/lib/turnos';
import type { Turno } from '@shared/lib/turnos';
import { Avatar, Button, Card, Skeleton } from '@shared/ui';

/**
 * Lienzo de un tablero: las columnas del flujo con sus tarjetas dentro.
 *
 * Es un widget y no una página porque no sabe de rutas ni de sesión: recibe el tablero
 * y compone entidades. El día que exista una vista de «mis tarjetas», se reutiliza.
 *
 * La estructura (columnas) se pinta siempre, incluso mientras cargan las tarjetas: así
 * el esqueleto no miente sobre la forma del tablero. Cada columna tiene su propio
 * desplazamiento, de modo que mover una no arrastra a las demás.
 */
@Component({
  selector: 'app-board-canvas',
  imports: [Avatar, Button, Card, Skeleton],
  templateUrl: './board-canvas.html',
  styleUrl: './board-canvas.css',
})
export class BoardCanvas {
  private readonly tareas = inject(TaskStore);
  private readonly equipo = inject(MemberStore);

  readonly board = input.required<Board>();

  protected readonly cargando = this.tareas.cargando;
  protected readonly fallo = computed(() => this.tareas.carga() === 'error');
  protected readonly error = this.tareas.error;

  protected readonly total = computed(
    () => this.tareas.tareas().filter((tarea) => tarea.boardId === this.board().id).length,
  );

  /** El store cachea una señal por columna: pedirla en cada render no crea basura. */
  protected tareasDe(columnaId: string): Signal<readonly Task[]> {
    return this.tareas.deColumna(this.board().id, columnaId);
  }

  /** Turno de color de la persona responsable; `null` si no hay o no es del equipo. */
  protected turnoDe(nombre: string | null): Turno | null {
    if (!nombre) {
      return null;
    }

    const indice = this.equipo.miembros().findIndex((miembro) => miembro.nombre === nombre);

    return indice === -1 ? null : turnoPorIndice(indice);
  }

  protected reintentar(): void {
    void this.tareas.cargar();
  }
}
