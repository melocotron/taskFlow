import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardStore, comoBoardId } from '@entities/board';

/**
 * Pantalla de un tablero.
 *
 * En S3.2 solo resuelve la navegación: se entra por `tableros/:id` y se identifica
 * el tablero. El lienzo con las columnas y sus tarjetas llega en el sprint siguiente.
 */
@Component({
  selector: 'app-board-detail',
  imports: [RouterLink],
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
