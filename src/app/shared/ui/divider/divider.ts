import { Component, booleanAttribute, input } from '@angular/core';

/**
 * Separador. Horizontal por defecto; vertical para barras de herramientas.
 *
 *   <app-divider />
 *   <app-divider vertical />
 */
@Component({
  selector: 'app-divider',
  template: `
    @if (vertical()) {
      <span class="linea linea--vertical" role="separator" aria-orientation="vertical"></span>
    } @else {
      <hr class="linea" />
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .linea {
      height: 0;
      margin: 0;
      border: 0;
      border-top: var(--border-width) solid var(--border-color);
    }

    .linea--vertical {
      width: 0;
      height: 100%;
      min-height: var(--space-6);
      border-top: 0;
      border-left: var(--border-width) solid var(--border-color);
    }
  `,
})
export class Divider {
  readonly vertical = input(false, { transform: booleanAttribute });
}
