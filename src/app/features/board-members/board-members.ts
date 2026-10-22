import { Component, computed, inject, input, signal } from '@angular/core';
import { FormField as EnlaceDeCampo, FormRoot, form, required } from '@angular/forms/signals';
import type { ReadonlyFieldState } from '@angular/forms/signals';
import { BoardStore, puedeEn } from '@entities/board';
import type { Board } from '@entities/board';
import { MemberStore, comoMemberId, etiquetaRol } from '@entities/member';
import type { MemberId, Rol } from '@entities/member';
import { turnoPorIndice } from '@shared/lib/turnos';
import type { Turno } from '@shared/ui';
import { Avatar, Badge, Button, FormField, TextInput, ToastService } from '@shared/ui';
import type { BadgeTono } from '@shared/ui';

/** Una persona del tablero, ya resuelta para pintarla. */
interface MiembroVisible {
  readonly id: MemberId;
  readonly nombre: string;
  readonly rol: Rol;
  readonly turno: Turno | null;
  readonly eresTu: boolean;
}

interface ModeloInvitacion {
  persona: string;
  rol: Rol;
}

const ROLES: readonly { readonly valor: Rol; readonly etiqueta: string }[] = [
  { valor: 'admin', etiqueta: etiquetaRol('admin') },
  { valor: 'editor', etiqueta: etiquetaRol('editor') },
  { valor: 'viewer', etiqueta: etiquetaRol('viewer') },
];

/**
 * Personas de un tablero.
 *
 * Cualquier persona con acceso ve quién está y con qué rol. Solo quien administra
 * puede invitar o cambiar roles; la comprobación se repite en el dominio, porque
 * esconder un control no es una puerta.
 *
 * El rol es por tablero: la misma persona puede administrar uno y solo mirar otro.
 */
@Component({
  selector: 'app-board-members',
  imports: [Avatar, Badge, Button, EnlaceDeCampo, FormField, FormRoot, TextInput],
  templateUrl: './board-members.html',
  styleUrl: './board-members.css',
})
export class BoardMembers {
  private readonly tableros = inject(BoardStore);
  private readonly equipo = inject(MemberStore);
  private readonly avisos = inject(ToastService);

  readonly board = input.required<Board>();

  /** Se lee del store para que la lista se actualice al invitar sin cerrar el diálogo. */
  private readonly actual = computed(() => this.tableros.buscar(this.board().id) ?? this.board());

  protected readonly puedeAdministrar = computed(() =>
    puedeEn(this.actual(), this.equipo.sesion().id, 'administrar'),
  );

  protected readonly miembros = computed<readonly MiembroVisible[]>(() => {
    const equipo = this.equipo.miembros();
    const sesion = this.equipo.sesion().id;

    return this.actual().miembros.map((miembro) => {
      const indice = equipo.findIndex((persona) => persona.id === miembro.memberId);

      return {
        id: miembro.memberId,
        nombre: indice >= 0 ? (equipo[indice]?.nombre ?? miembro.memberId) : miembro.memberId,
        rol: miembro.rol,
        turno: indice >= 0 ? turnoPorIndice(indice) : null,
        eresTu: miembro.memberId === sesion,
      };
    });
  });

  /** Quienes todavía no están en el tablero; invitar a alguien que ya está no tiene sentido. */
  protected readonly disponibles = computed(() => {
    const dentro = new Set(this.actual().miembros.map((miembro) => miembro.memberId));

    return this.equipo.miembros().filter((persona) => !dentro.has(persona.id));
  });

  protected readonly roles = ROLES;
  protected etiqueta = etiquetaRol;

  private readonly modelo = signal<ModeloInvitacion>({ persona: '', rol: 'editor' });

  protected readonly formulario = form(
    this.modelo,
    (invitacion) => {
      required(invitacion.persona, { message: 'Elige a quién invitar' });
    },
    {
      submission: {
        action: async () => {
          this.invitar();
        },
      },
    },
  );

  protected readonly errorPersona = computed(() => this.mensaje(this.formulario.persona()));

  protected tonoDe(rol: Rol): BadgeTono {
    return rol === 'admin' ? 'acento' : rol === 'editor' ? 'info' : 'neutro';
  }

  protected invitar(): void {
    const { persona, rol } = this.modelo();

    if (persona.length === 0) {
      return;
    }

    try {
      this.tableros.invitar(this.actual().id, this.equipo.sesion().id, comoMemberId(persona), rol);

      const nombre = this.equipo.miembros().find((miembro) => miembro.id === persona)?.nombre;
      this.avisos.mostrar(`«${nombre ?? persona}» · ${etiquetaRol(rol)}`, 'acento');
      this.formulario().reset({ persona: '', rol: 'editor' });
    } catch (fallo) {
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudo invitar a esa persona',
        'peligro',
      );
    }
  }

  protected cambiarRol(miembro: MiembroVisible, evento: Event): void {
    const control = evento.target as HTMLSelectElement;
    const rol = control.value as Rol;

    try {
      this.tableros.cambiarRol(this.actual().id, this.equipo.sesion().id, miembro.id, rol);
      this.avisos.mostrar(`«${miembro.nombre}» · ${etiquetaRol(rol)}`, 'acento');
    } catch (fallo) {
      // El store no cambió nada; el control debe volver a contar la verdad.
      control.value = miembro.rol;
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudo cambiar el rol',
        'peligro',
      );
    }
  }

  /**
   * Un error solo se anuncia cuando el campo ya se tocó. Después de invitar, el
   * formulario se reinicia y vuelve a estar en silencio.
   */
  private mensaje(campo: ReadonlyFieldState<string>): string {
    if (!campo.touched()) {
      return '';
    }

    return campo.errors()[0]?.message ?? '';
  }
}
