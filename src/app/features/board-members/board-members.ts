import { Component, computed, inject, input, signal } from '@angular/core';
import {
  FormField as EnlaceDeCampo,
  FormRoot,
  email as validarEmail,
  form,
  required,
} from '@angular/forms/signals';
import type { ReadonlyFieldState } from '@angular/forms/signals';
import { BoardStore, puedeEn } from '@entities/board';
import type { Board } from '@entities/board';
import { MemberStore, etiquetaRol } from '@entities/member';
import type { MemberId, Rol } from '@entities/member';
import { turnoPorIndice } from '@shared/lib/turnos';
import type { Turno } from '@shared/ui';
import { Avatar, Badge, Button, FormField, TextInput, ToastService } from '@shared/ui';
import type { BadgeTono } from '@shared/ui';

/** Una persona del tablero, ya resuelta para pintarla. */
interface MiembroVisible {
  readonly id: MemberId;
  readonly nombre: string;
  readonly email: string;
  readonly rol: Rol;
  readonly turno: Turno | null;
  readonly eresTu: boolean;
}

interface ModeloInvitacion {
  email: string;
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
 * puede invitar o cambiar roles; la comprobación se repite en el servidor, porque
 * esconder un control no es una puerta.
 *
 * Invitar es por email: la cuenta tiene que existir. No se crean cuentas desde aquí ni
 * se envía correo; la API responde `404` si no hay una cuenta con ese email.
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
    const sesion = this.equipo.sesion().id;

    return this.actual().miembros.map((miembro, indice) => ({
      id: miembro.memberId,
      nombre: miembro.nombre,
      email: miembro.email,
      rol: miembro.rol,
      turno: turnoPorIndice(indice),
      eresTu: miembro.memberId === sesion,
    }));
  });

  protected readonly roles = ROLES;
  protected etiqueta = etiquetaRol;

  private readonly modelo = signal<ModeloInvitacion>({ email: '', rol: 'editor' });

  protected readonly formulario = form(
    this.modelo,
    (invitacion) => {
      required(invitacion.email, { message: 'Escribe el email de la persona' });
      validarEmail(invitacion.email, { message: 'El email no tiene un formato válido' });
    },
    {
      submission: {
        action: async () => {
          await this.invitar();
        },
      },
    },
  );

  protected readonly errorEmail = computed(() => this.mensaje(this.formulario.email()));

  protected tonoDe(rol: Rol): BadgeTono {
    return rol === 'admin' ? 'acento' : rol === 'editor' ? 'info' : 'neutro';
  }

  protected async invitar(): Promise<void> {
    const { email, rol } = this.modelo();

    if (email.trim().length === 0) {
      return;
    }

    try {
      const member = await this.tableros.invitar(this.actual().id, email, rol);

      this.avisos.mostrar(`«${member.nombre}» · ${etiquetaRol(rol)}`, 'acento');
      this.formulario().reset({ email: '', rol: 'editor' });
    } catch (fallo) {
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudo invitar a esa persona',
        'peligro',
      );
    }
  }

  protected async cambiarRol(miembro: MiembroVisible, evento: Event): Promise<void> {
    const control = evento.target as HTMLSelectElement;
    const rol = control.value as Rol;

    try {
      await this.tableros.cambiarRol(this.actual().id, miembro.id, rol);
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
