/**
 * Igual que `Button`: se aplica sobre un `<button>` nativo, no sobre un componente
 * contenedor. Excepción consciente y limitada a este archivo.
 */
/* eslint-disable @angular-eslint/component-selector */
import { Component, booleanAttribute, input } from '@angular/core';

export type IconButtonSize = 'sm' | 'md';

/**
 * Botón de solo icono. Exige `label`: un icono sin nombre accesible es invisible
 * para un lector de pantalla y para quien no reconoce el símbolo.
 *
 *   <button appIconButton label="Cerrar" (click)="cerrar()">✕</button>
 */
@Component({
  selector: 'button[appIconButton]',
  template: '<ng-content />',
  styleUrl: './icon-button.css',
  host: {
    class: 'app-icon-button',
    '[attr.aria-label]': 'label()',
    '[class.app-icon-button--sm]': "size() === 'sm'",
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.title]': 'title() || null',
  },
})
export class IconButton {
  readonly label = input.required<string>();
  readonly title = input('');
  readonly size = input<IconButtonSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
}
