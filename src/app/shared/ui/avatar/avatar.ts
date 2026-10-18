import { Component, computed, input } from '@angular/core';
import type { Turno } from '../card/card';

export type AvatarSize = 'sm' | 'md';

/**
 * Persona del equipo.
 *
 * Dos iniciales sobre un fondo tonal del color de su turno. Sin anillo arcoíris:
 * el color ya identifica, el nombre es lo que informa.
 *
 *   <app-avatar nombre="Marta Ruiz" turno="verde" />
 */
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
  host: {
    '[class.app-avatar--sm]': "size() === 'sm'",
    '[class.app-avatar--sin-turno]': 'turno() === null',
  },
})
export class Avatar {
  readonly nombre = input.required<string>();
  readonly turno = input<Turno | null>(null);
  readonly size = input<AvatarSize>('md');

  /** "Marta Ruiz" → "MR". Una sola palabra → sus dos primeras letras. */
  protected readonly iniciales = computed(() => {
    const palabras = this.nombre()
      .trim()
      .split(/\s+/)
      .filter((parte) => parte.length > 0);

    if (palabras.length === 0) {
      return '?';
    }

    if (palabras.length === 1) {
      return palabras[0]!.slice(0, 2).toUpperCase();
    }

    return `${palabras[0]![0]}${palabras[palabras.length - 1]![0]}`.toUpperCase();
  });

  protected readonly color = computed(() =>
    this.turno() ? `var(--turno-${this.turno()})` : 'var(--surface-sunken)',
  );
}
