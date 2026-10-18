import { Component, input } from '@angular/core';

export type BadgeTono = 'neutro' | 'acento' | 'signal' | 'peligro' | 'info';

/**
 * Etiqueta corta de estado. Nunca sustituye a un texto: lo acompaña.
 *
 *   <app-badge tono="peligro">Bloqueada</app-badge>
 */
@Component({
  selector: 'app-badge',
  template: '<ng-content />',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      height: 20px;
      padding: 0 var(--space-2);
      border: var(--border-width) solid transparent;
      border-radius: var(--radius-full);
      font-size: var(--text-caption);
      font-weight: var(--weight-medium);
      letter-spacing: 0.02em;
      line-height: 1;
      white-space: nowrap;
    }

    :host(.app-badge--neutro) {
      border-color: var(--border-color-strong);
      background-color: var(--surface-sunken);
      color: var(--text-secondary);
    }

    :host(.app-badge--acento) {
      background-color: var(--accent);
      color: var(--text-on-accent);
    }

    :host(.app-badge--signal) {
      background-color: var(--signal);
      color: var(--text-primary);
    }

    :host(.app-badge--peligro) {
      background-color: var(--danger);
      color: var(--text-on-danger);
    }

    :host(.app-badge--info) {
      background-color: var(--info);
      color: var(--text-on-accent);
    }
  `,
  host: {
    '[class.app-badge--neutro]': "tono() === 'neutro'",
    '[class.app-badge--acento]': "tono() === 'acento'",
    '[class.app-badge--signal]': "tono() === 'signal'",
    '[class.app-badge--peligro]': "tono() === 'peligro'",
    '[class.app-badge--info]': "tono() === 'info'",
  },
})
export class Badge {
  readonly tono = input<BadgeTono>('neutro');
}
