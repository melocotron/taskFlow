import { Component, computed, input } from '@angular/core';

export type Turno = 'verde' | 'cinta' | 'madera' | 'tiza' | 'lapiz';

/**
 * Tarjeta del sistema.
 *
 * La lengüeta de turno es parte del componente, no un adorno que se añade después:
 * si se pudiera olvidar, alguien la olvidaría.
 *
 *   <app-card turno="verde" persona="Marta">…</app-card>
 *   <app-card>…</app-card>   <!-- sin turno: se ve el hueco, no un gris -->
 */
@Component({
  selector: 'app-card',
  templateUrl: './card.html',
  styleUrl: './card.css',
  host: {
    '[class.app-card--con-turno]': 'conTurno()',
  },
})
export class Card {
  readonly turno = input<Turno | null>(null);
  readonly persona = input('');

  protected readonly conTurno = computed(() => this.turno() !== null);

  protected readonly colorLengueta = computed(() => `var(--turno-${this.turno()})`);

  /** El color nunca informa solo: el nombre acompaña, aunque sea invisible en pantalla. */
  protected readonly textoAsignacion = computed(() => {
    const persona = this.persona();

    return persona ? `Asignada a ${persona}` : 'Con turno asignado';
  });
}
