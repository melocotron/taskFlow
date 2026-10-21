import { CdkMenu } from '@angular/cdk/menu';
import { Component } from '@angular/core';

/**
 * Panel de menú.
 *
 * Es un componente y no un `<div class="menu">` suelto porque el CDK renderiza el
 * menú en un overlay, fuera del árbol de la página: los estilos globales no llegan
 * de forma fiable, los del componente sí.
 *
 * `cdkMenu` vive en el elemento anfitrión, no en un `<div>` interno. El CDK busca
 * sus opciones entre el contenido del menú; con un `<div>` dentro del componente,
 * las opciones proyectadas quedaban fuera de esa búsqueda y el teclado no podía
 * entrar en ellas. En el anfitrión, las ve y las flechas funcionan.
 *
 *   <app-menu>
 *     <button appMenuItem (click)="renombrar()">Renombrar</button>
 *   </app-menu>
 */
@Component({
  selector: 'app-menu',
  hostDirectives: [CdkMenu],
  template: '<ng-content />',
  host: { class: 'menu' },
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-width: 200px;
      padding: var(--space-1);
      border: var(--border-width) solid var(--border-color-strong);
      border-radius: var(--card-radius);
      background-color: var(--surface-raised);
      box-shadow: var(--shadow-overlay);
    }
  `,
})
export class Menu {}
