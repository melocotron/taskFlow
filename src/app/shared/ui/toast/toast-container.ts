import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, Renderer2, afterNextRender, inject } from '@angular/core';
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
  host: {
    role: 'status',
    'aria-live': 'polite',
  },
  template: `
    <div class="pila">
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
      z-index: var(--z-toast);
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly documento = inject(DOCUMENT);

  constructor() {
    /*
     * El CDK oculta del árbol de accesibilidad a los hermanos del overlay que no son
     * regiones vivas. Si el aviso se queda dentro de `<app-root>`, el diálogo abierto
     * lo vuelve invisible para un lector de pantalla. Como hijo directo de `body` y
     * con `aria-live`, el CDK lo respeta; además su z-index puede quedar por encima.
     */
    afterNextRender(() => {
      this.renderer.appendChild(this.documento.body, this.host.nativeElement);
    });
  }
}
