import { Component, computed, input } from '@angular/core';

/**
 * Esqueleto de carga.
 *
 * Es decorativo: se oculta a los lectores de pantalla. Quien anuncia la carga es el
 * contenedor con `aria-busy="true"`, no este componente.
 *
 *   <app-skeleton [lineas]="3" />
 */
@Component({
  selector: 'app-skeleton',
  template: `
    @for (linea of rango(); track linea) {
      <span class="bloque" [style.width]="anchoDeLinea(linea)"></span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .bloque {
      display: block;
      height: 12px;
      border-radius: var(--radius-sm);
      background-color: var(--surface-sunken);
      animation: latido 1600ms var(--ease-move) infinite;
    }

    @keyframes latido {
      50% {
        opacity: 0.55;
      }
    }
  `,
  host: {
    'aria-hidden': 'true',
  },
})
export class Skeleton {
  readonly lineas = input(1);
  readonly anchoUltima = input('60%');

  protected readonly rango = computed(() =>
    Array.from({ length: Math.max(1, this.lineas()) }, (_, indice) => indice),
  );

  /** La última línea rompe la mancha: es lo que la hace parecer texto, no una caja. */
  protected anchoDeLinea(indice: number): string {
    return indice === this.rango().length - 1 && this.lineas() > 1 ? this.anchoUltima() : '100%';
  }
}
