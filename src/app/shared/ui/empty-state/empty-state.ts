import { Component, input } from '@angular/core';

/**
 * Estado vacío.
 *
 * Explica qué no hay y qué se puede hacer. Nunca es un "No hay datos" a secas:
 * eso deja a la persona sin salida.
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
}
