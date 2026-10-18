/**
 * La regla `component-selector` exige que el *elemento* lleve prefijo `app`, pero
 * aquí el componente se aplica sobre un `<button>` nativo a propósito: así el
 * teclado, el foco, el `disabled` y el envío de formularios vienen gratis.
 * La excepción es consciente y está limitada a este archivo.
 */
/* eslint-disable @angular-eslint/component-selector */
import { Component, booleanAttribute, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

/**
 * Botón del sistema. Se aplica sobre un `<button>` nativo, nunca sobre un `div`:
 * el teclado, el foco y el envío de formularios ya vienen resueltos.
 *
 *   <button appButton variant="primary" (click)="guardar()">Guardar</button>
 *   <button appButton variant="ghost" [loading]="guardando()">Guardar</button>
 */
@Component({
  selector: 'button[appButton]',
  templateUrl: './button.html',
  styleUrl: './button.css',
  host: {
    class: 'app-button',
    '[class.app-button--primary]': "variant() === 'primary'",
    '[class.app-button--secondary]': "variant() === 'secondary'",
    '[class.app-button--ghost]': "variant() === 'ghost'",
    '[class.app-button--danger]': "variant() === 'danger'",
    '[class.app-button--lg]': "size() === 'lg'",
    '[class.app-button--busy]': 'loading()',
    '[attr.disabled]': 'bloqueado() ? "" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  // `booleanAttribute` permite escribir `disabled` y `loading` como atributos secos.
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Cargando también bloquea: evita el doble envío, que es el bug real. */
  protected readonly bloqueado = computed(() => this.disabled() || this.loading());
}
