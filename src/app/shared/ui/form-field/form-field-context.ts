import { InjectionToken, Signal } from '@angular/core';

/**
 * Contrato entre `app-field` y el control que proyecta.
 *
 * Es lo que hace que la accesibilidad sea automática: el control recibe su `id` y
 * su `aria-describedby` del campo que lo envuelve, sin que quien lo usa tenga que
 * repetir identificadores a mano (y equivocarse).
 */
export interface FieldContext {
  /** Id que debe llevar el control para que el `<label for>` apunte a él. */
  readonly inputId: Signal<string>;
  /** Ids de los textos de ayuda/error, ya resueltos según el estado. */
  readonly describedBy: Signal<string>;
  /** true cuando el campo está en error. */
  readonly invalid: Signal<boolean>;
}

export const FIELD = new InjectionToken<FieldContext>('FIELD');
