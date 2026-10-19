/**
 * La regla `component-selector` exige que el *elemento* lleve prefijo `app`, pero
 * aquí el componente se aplica sobre un `<button>` nativo a propósito: es el único
 * sitio donde el clic del CDK y el nuestro conviven.
 */
/* eslint-disable @angular-eslint/component-selector */
import { CdkMenuItem } from '@angular/cdk/menu';
import { Component } from '@angular/core';

/**
 * Acción de un menú. Igual que `Button` y `IconButton`, se aplica sobre un `<button>`
 * nativo, nunca sobre un componente que lo envuelva.
 *
 * No es un capricho de estilo: el CDK cierra el menú al pulsar un ítem, y cerrar el menú
 * destruye la vista del overlay. Si el `(click)` vive en un elemento **por encima** del
 * botón, esa destrucción se lleva su escucha antes de que el clic termine de llegar, y la
 * acción no se ejecuta nunca. En el propio botón el clic ya se ha entregado.
 *
 *   <app-menu>
 *     <button appMenuItem (click)="archivar()">Archivar tablero</button>
 *   </app-menu>
 */
@Component({
  selector: 'button[appMenuItem]',
  template: '<ng-content />',
  styleUrl: './menu-item.css',
  hostDirectives: [CdkMenuItem],
  host: { class: 'app-menu-item' },
})
export class MenuItem {}
