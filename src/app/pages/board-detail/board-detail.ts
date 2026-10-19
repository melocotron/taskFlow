import type { DialogRef } from '@angular/cdk/dialog';
import { Component, TemplateRef, computed, inject, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardStore, comoBoardId } from '@entities/board';
import { MemberStore } from '@entities/member';
import { BoardForm } from '@features/board-form';
import type { DatosTablero } from '@features/board-form';
import { Button, DialogService, ToastService } from '@shared/ui';
import type { DialogContent } from '@shared/ui';
import { BoardCanvas } from '@widgets/board-canvas';

/**
 * Pantalla de un tablero.
 *
 * Resuelve la navegación por `tableros/:id` y compone el lienzo. Todo el trabajo
 * de pintar columnas y tarjetas vive en `board-canvas`.
 *
 * El nombre del tablero se puede cambiar desde aquí: el store sabía renombrar desde
 * S2.1, pero hasta ahora no había ninguna puerta en la interfaz.
 */
@Component({
  selector: 'app-board-detail',
  imports: [BoardCanvas, BoardForm, Button, RouterLink],
  templateUrl: './board-detail.html',
  styleUrl: './board-detail.css',
})
export default class BoardDetailPage {
  private readonly tableros = inject(BoardStore);
  private readonly equipo = inject(MemberStore);
  private readonly dialogos = inject(DialogService);
  private readonly avisos = inject(ToastService);

  /** Llega desde la ruta gracias a `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  private referencia: DialogRef<unknown, DialogContent> | null = null;

  protected readonly plantillaRenombrar =
    viewChild.required<TemplateRef<unknown>>('plantillaRenombrar');

  protected readonly cargando = this.tableros.cargando;
  protected readonly tablero = computed(() => this.tableros.buscar(comoBoardId(this.id())));
  protected readonly puedeEditar = this.equipo.puedeEditar;

  /** Abre el diálogo con el nombre actual ya cargado. */
  protected renombrar(): void {
    // La interfaz esconde el botón sin permiso; el método lo vuelve a comprobar.
    if (!this.puedeEditar()) {
      this.avisos.mostrar('Tu rol no permite renombrar tableros', 'peligro');
      return;
    }

    if (!this.tablero()) {
      return;
    }

    this.referencia = this.dialogos.abrir('Renombrar tablero', this.plantillaRenombrar());
  }

  /** Recibe el nombre ya validado y recortado por el formulario. */
  protected guardarNombre(datos: DatosTablero): void {
    const tablero = this.tablero();

    if (!tablero) {
      return;
    }

    try {
      this.tableros.renombrar(tablero.id, datos.titulo);
      this.avisos.mostrar(`El tablero ahora se llama «${datos.titulo}»`, 'acento');
      this.cerrarRenombrar();
    } catch (fallo) {
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudo renombrar el tablero',
        'peligro',
      );
    }
  }

  protected cerrarRenombrar(): void {
    this.referencia?.close();
    this.referencia = null;
  }
}
