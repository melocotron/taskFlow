import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardStore, comoBoardId } from '@entities/board';
import { BoardCanvas } from '@widgets/board-canvas';

/**
 * Pantalla de un tablero.
 *
 * Resuelve la navegación por `tableros/:id` y compone el lienzo. Todo el trabajo
 * de pintar columnas y tarjetas vive en `board-canvas`.
 */
@Component({
  selector: 'app-board-detail',
  imports: [BoardCanvas, RouterLink],
  templateUrl: './board-detail.html',
  styleUrl: './board-detail.css',
})
export default class BoardDetailPage {
  private readonly tableros = inject(BoardStore);

  /** Llega desde la ruta gracias a `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  protected readonly cargando = this.tableros.cargando;
  protected readonly tablero = computed(() => this.tableros.buscar(comoBoardId(this.id())));
}
