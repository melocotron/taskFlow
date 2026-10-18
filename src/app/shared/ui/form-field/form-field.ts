import { Component, booleanAttribute, computed, forwardRef, input, Signal } from '@angular/core';
import { FIELD, FieldContext } from './form-field-context';

/** Contador de módulo: ids estables dentro de una sesión, sin dependencias. */
let siguienteId = 0;

/**
 * Envoltorio de campo: etiqueta, control, texto de ayuda o error.
 *
 * No impone el control: se proyecta cualquiera que lleve `appInput`.
 * El vínculo `label → control` y el `aria-describedby` se resuelven solos.
 *
 *   <app-field label="Título" hint="Máximo 80 caracteres" [error]="error()">
 *     <input appInput type="text" />
 *   </app-field>
 */
@Component({
  selector: 'app-field',
  templateUrl: './form-field.html',
  styleUrl: './form-field.css',
  providers: [{ provide: FIELD, useExisting: forwardRef(() => FormField) }],
})
export class FormField implements FieldContext {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly error = input('');
  readonly optional = input(false, { transform: booleanAttribute });

  private readonly propioId = `campo-${++siguienteId}`;

  readonly inputId: Signal<string> = computed(() => this.propioId);
  private readonly hintId = `${this.propioId}-ayuda`;
  private readonly errorId = `${this.propioId}-error`;

  readonly invalid = computed(() => this.error().length > 0);

  /**
   * Solo un texto describe al control a la vez: si hay error, el error manda y la
   * ayuda se oculta. Un lector de pantalla no debe oír dos mensajes contradictorios.
   */
  readonly describedBy = computed(() => {
    if (this.invalid()) {
      return this.errorId;
    }

    return this.hint() ? this.hintId : '';
  });

  protected readonly ayudaId = this.hintId;
  protected readonly falloId = this.errorId;
}
