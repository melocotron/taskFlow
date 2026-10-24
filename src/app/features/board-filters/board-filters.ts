import { Component, computed, input, output } from '@angular/core';
import type { BoardMember } from '@entities/board';
import { Button, FormField, TextInput } from '@shared/ui';
import { filtroActivo } from './filtro';
import type { FiltroTablero } from './filtro';

/**
 * Barra de búsqueda y filtro del tablero.
 *
 * Es un componente controlado: recibe el filtro y emite el siguiente. Quien lo usa
 * decide dónde vive el estado —aquí, en `board-detail`, vive en la URL—, así que esta
 * pieza no sabe nada de rutas y se puede reutilizar en otra vista.
 *
 * No usa Signal Forms a propósito: no hay nada que validar, y un filtro debe responder
 * a cada tecla sin ceremonia.
 */
@Component({
  selector: 'app-board-filters',
  imports: [Button, FormField, TextInput],
  templateUrl: './board-filters.html',
  styleUrl: './board-filters.css',
})
export class BoardFilters {
  readonly filtro = input.required<FiltroTablero>();
  readonly miembros = input.required<readonly BoardMember[]>();

  readonly cambios = output<FiltroTablero>();

  /** Con un filtro puesto aparece la salida rápida; sin él, sería ruido. */
  protected readonly filtrando = computed(() => filtroActivo(this.filtro()));

  protected cambiarTexto(evento: Event): void {
    const texto = (evento.target as HTMLInputElement).value;

    this.cambios.emit({ ...this.filtro(), texto });
  }

  protected cambiarPersona(evento: Event): void {
    const persona = (evento.target as HTMLSelectElement).value;

    this.cambios.emit({ ...this.filtro(), persona });
  }

  protected limpiar(): void {
    this.cambios.emit({ texto: '', persona: '' });
  }
}
