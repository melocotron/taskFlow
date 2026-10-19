import { CdkMenu } from '@angular/cdk/menu';
import { Component } from '@angular/core';

/**
 * Panel de menú.
 *
 * Es un componente y no un `<div class="menu">` suelto porque el CDK renderiza el
 * menú en un overlay, fuera del árbol de la página: los estilos globales no llegan
 * de forma fiable, los del componente sí.
 *
 *   <app-menu>
 *     <button appMenuItem (click)="renombrar()">Renombrar</button>
 *   </app-menu>
 */
@Component({
  selector: 'app-menu',
  imports: [CdkMenu],
  template: `
    <div cdkMenu class="menu">
      <ng-content />
    </div>
  `,
  styles: `
    .menu {
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
