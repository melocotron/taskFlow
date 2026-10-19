import { Component, inject } from '@angular/core';
import { BoardStore } from '@entities/board';
import { Button, Card, EmptyState, Skeleton, ToastService } from '@shared/ui';

/**
 * Pantalla de arranque: lista de tableros.
 *
 * Es la primera pantalla real y sirve de prueba de extremo a extremo del sistema:
 * store → estados de carga → design system. Se sustituye por `board-list` en la Fase 3.
 */
@Component({
  selector: 'app-home',
  imports: [Button, Card, EmptyState, Skeleton],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export default class HomePage {
  private readonly tableros = inject(BoardStore);
  private readonly avisos = inject(ToastService);

  protected readonly cargando = this.tableros.cargando;
  protected readonly conFallo = this.tableros.conFallo;
  protected readonly error = this.tableros.error;
  protected readonly activos = this.tableros.activos;
  protected readonly cuantos = this.tableros.cuantosActivos;

  protected crearTablero(): void {
    try {
      const board = this.tableros.crear('Tablero sin nombre');
      this.avisos.mostrar(`«${board.titulo}» creado`, 'acento');
    } catch (fallo) {
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudo crear el tablero',
        'peligro',
      );
    }
  }

  protected reintentar(): void {
    void this.tableros.cargar();
  }
}
