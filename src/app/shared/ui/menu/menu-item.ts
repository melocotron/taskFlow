import { CdkMenuItem } from '@angular/cdk/menu';
import { Component } from '@angular/core';

/**
 * Elemento de menú.
 *
 * El `<button>` vive dentro de la plantilla de este componente, así que sus estilos
 * sí se aplican aunque el menú se renderice en un overlay.
 */
@Component({
  selector: 'app-menu-item',
  imports: [CdkMenuItem],
  template: `
    <button cdkMenuItem type="button">
      <ng-content />
    </button>
  `,
  styles: `
    button {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: var(--text-body);
      text-align: left;
      white-space: nowrap;
      cursor: pointer;
    }

    button:hover,
    button:focus-visible {
      background-color: var(--surface-sunken);
    }
  `,
})
export class MenuItem {}
