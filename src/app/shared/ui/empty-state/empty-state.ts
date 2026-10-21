import { Component, input } from '@angular/core';

/** Niveles que necesita el producto: página, sección y subsección. */
export type NivelEncabezado = 1 | 2 | 3;

/**
 * Estado vacío.
 *
 * Explica qué no hay y qué se puede hacer. Nunca es un "No hay datos" a secas:
 * eso deja a la persona sin salida.
 *
 * El nivel del encabezado es configurable para que la página no salte de `h1` a `h3`
 * cuando el estado vacío cuelga directamente del título principal.
 *
 *   <app-empty-state titulo="Aún no hay tareas" descripcion="Crea la primera…">
 *     <button appButton variant="primary">Añadir tarea</button>
 *   </app-empty-state>
 */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyState {
  readonly titulo = input.required<string>();
  readonly descripcion = input('');
  readonly nivel = input<NivelEncabezado>(2);
}
