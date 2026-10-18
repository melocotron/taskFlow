import { Component, input, output } from '@angular/core';
import { IconButton } from '../icon-button/icon-button';

export type ToastTono = 'neutro' | 'acento' | 'peligro';

/**
 * Aviso efímero. El contenedor ya anuncia los cambios con `role="status"`:
 * este componente solo pinta.
 */
@Component({
  selector: 'app-toast',
  imports: [IconButton],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
  host: {
    '[class.app-toast--acento]': "tono() === 'acento'",
    '[class.app-toast--peligro]': "tono() === 'peligro'",
  },
})
export class Toast {
  readonly mensaje = input.required<string>();
  readonly tono = input<ToastTono>('neutro');
  readonly cerrado = output<void>();
}
