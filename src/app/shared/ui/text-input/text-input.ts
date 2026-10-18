import { Directive, computed, inject } from '@angular/core';
import { FIELD } from '../form-field/form-field-context';

/**
 * Estilo e identidad accesible de un control nativo.
 *
 * Es una directiva y no un componente a propósito: el elemento nativo ya tiene
 * teclado, foco, autocompletado y semántica. Solo hay que vestirlo.
 *
 *   <input appInput type="text" />
 *   <textarea appInput rows="3"></textarea>
 */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: {
    class: 'app-input',
    '[attr.id]': 'idDelCampo()',
    '[attr.aria-describedby]': 'descritoPor()',
    '[attr.aria-invalid]': 'invalido() ? "true" : null',
    '[class.app-input--invalid]': 'invalido()',
  },
})
export class TextInput {
  private readonly campo = inject(FIELD, { optional: true });

  protected readonly invalido = computed(() => this.campo?.invalid() ?? false);
  protected readonly idDelCampo = computed(() => this.campo?.inputId() ?? null);
  protected readonly descritoPor = computed(() => this.campo?.describedBy() || null);
}
