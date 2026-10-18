import { Component, inject } from '@angular/core';
import { Toast } from './toast';
import { ToastService } from './toast.service';

/**
 * Contenedor de avisos. Vive una sola vez, en la raíz de la aplicación.
 *
 * `role="status"` + `aria-live="polite"` es lo que hace que un lector de pantalla
 * anuncie el aviso sin interrumpir lo que la persona estaba haciendo.
 */
@Component({
  selector: 'app-toast-container',
  imports: [Toast],
  template: `
    <div class="pila" role="status" aria-live="polite">
      @for (aviso of servicio.avisos(); track aviso.id) {
        <app-toast
          [mensaje]="aviso.mensaje"
          [tono]="aviso.tono"
          (cerrado)="servicio.cerrar(aviso.id)"
        />
      }
    </div>
  `,
  styles: `
    .pila {
      position: fixed;
      right: var(--space-6);
      bottom: var(--space-6);
      z-index: 40;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      pointer-events: none;
    }

    app-toast {
      pointer-events: auto;
    }
  `,
})
export class ToastContainer {
  protected readonly servicio = inject(ToastService);
}
