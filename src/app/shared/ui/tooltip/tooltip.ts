import { Directive, ElementRef, OnDestroy, Renderer2, inject, input } from '@angular/core';

let siguienteId = 0;

/**
 * Texto de ayuda al pasar el ratón **o al enfocar con el teclado**.
 *
 * No es un `title`: el `title` no aparece con teclado, tarda un segundo y no se puede
 * leer con un lector de pantalla de forma fiable. Aquí el texto existe siempre en el
 * DOM, oculto visualmente, y se anuncia por `aria-describedby`.
 *
 *   <button appIconButton label="Eliminar" [appTooltip]="'Eliminar la tarea'">…</button>
 */
@Directive({
  selector: '[appTooltip]',
  host: {
    class: 'app-tooltip-ancla',
    '[attr.aria-describedby]': 'id',
    '(mouseenter)': 'mostrar()',
    '(mouseleave)': 'ocultar()',
    '(focusin)': 'mostrar()',
    '(focusout)': 'ocultar()',
    '(keydown.escape)': 'ocultar()',
  },
})
export class Tooltip implements OnDestroy {
  readonly texto = input.required<string>({ alias: 'appTooltip' });

  protected readonly id = `tooltip-${++siguienteId}`;

  private readonly anfitrion = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly burbuja: HTMLElement;

  constructor() {
    const elemento = this.anfitrion.nativeElement;

    this.burbuja = this.renderer.createElement('span');
    this.renderer.setAttribute(this.burbuja, 'id', this.id);
    this.renderer.setAttribute(this.burbuja, 'role', 'tooltip');
    this.renderer.addClass(this.burbuja, 'app-tooltip');
    this.renderer.setAttribute(this.burbuja, 'data-visible', 'false');
    this.renderer.appendChild(elemento, this.burbuja);
  }

  protected mostrar(): void {
    this.renderer.setProperty(this.burbuja, 'textContent', this.texto());
    this.renderer.setAttribute(this.burbuja, 'data-visible', 'true');
  }

  protected ocultar(): void {
    this.renderer.setAttribute(this.burbuja, 'data-visible', 'false');
  }

  ngOnDestroy(): void {
    this.renderer.removeChild(this.anfitrion.nativeElement, this.burbuja);
  }
}
