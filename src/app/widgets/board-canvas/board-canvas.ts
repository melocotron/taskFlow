import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, Signal, computed, inject, input } from '@angular/core';
import type { Board } from '@entities/board';
import { MemberStore } from '@entities/member';
import { TaskStore } from '@entities/task';
import type { Task } from '@entities/task';
import { turnoPorIndice } from '@shared/lib/turnos';
import type { Turno } from '@shared/lib/turnos';
import {
  Avatar,
  Button,
  Card,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  ToastService,
} from '@shared/ui';

/**
 * Lienzo de un tablero: las columnas del flujo con sus tarjetas dentro.
 *
 * Es un widget y no una página porque no sabe de rutas ni de sesión: recibe el tablero
 * y compone entidades. El día que exista una vista de «mis tarjetas», se reutiliza.
 *
 * La estructura (columnas) se pinta siempre, incluso mientras cargan las tarjetas: así
 * el esqueleto no miente sobre la forma del tablero. Cada columna tiene su propio
 * desplazamiento, de modo que mover una no arrastra a las demás.
 *
 * Mover una tarjeta tiene dos caminos y **una sola** operación de dominio: el arrastre
 * del CDK y el menú «mover a…» de cada tarjeta llaman a `TaskStore.mover()`. El menú no
 * es un adorno: el arrastre no existe para el teclado.
 */
@Component({
  selector: 'app-board-canvas',
  imports: [
    Avatar,
    Button,
    Card,
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    CdkMenuTrigger,
    IconButton,
    Menu,
    MenuItem,
    Skeleton,
  ],
  templateUrl: './board-canvas.html',
  styleUrl: './board-canvas.css',
})
export class BoardCanvas {
  private readonly tareas = inject(TaskStore);
  private readonly equipo = inject(MemberStore);
  private readonly avisos = inject(ToastService);

  readonly board = input.required<Board>();

  protected readonly cargando = this.tareas.cargando;
  protected readonly fallo = computed(() => this.tareas.carga() === 'error');
  protected readonly error = this.tareas.error;
  protected readonly puedeEditar = this.equipo.puedeEditar;

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

  /** Suelta lo que venía arrastrado: la columna destino la dice la lista que lo recibe. */
  protected soltar(evento: CdkDragDrop<string, string, Task>): void {
    this.moverA(evento.item.data, evento.container.data, evento.currentIndex);
  }

  /**
   * Mueve una tarjeta a otra columna.
   *
   * Sin índice va al final de la columna, que es lo que espera quien elige «mover a…».
   */
  protected moverA(tarea: Task, columnaDestino: string, indice?: number): void {
    // Igual que al crear: la interfaz esconde la acción, pero el método la comprueba.
    if (!this.puedeEditar()) {
      this.avisos.mostrar('Tu rol no permite mover tarjetas', 'peligro');
      return;
    }

    const destino = this.board().columnas.find((columna) => columna.id === columnaDestino);

    if (!destino) {
      return;
    }

    this.tareas.mover(tarea.id, columnaDestino, indice ?? this.tareasDe(columnaDestino)().length);
    this.avisos.mostrar(`«${tarea.titulo}» a ${destino.titulo}`, 'acento');
  }

  protected reintentar(): void {
    void this.tareas.cargar();
  }
}
