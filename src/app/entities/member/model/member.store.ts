import { Injectable, signal } from '@angular/core';
import { borrarTexto, escribirTexto, leerTexto } from '@shared/lib/almacenamiento';
import { Member, MemberId, MIEMBROS_DEMO, comoMemberId } from '../model/member.model';

const CLAVE_SESION = 'taskflow.sesion';

/**
 * Personas del equipo y quién está usando la app ahora mismo.
 *
 * No hay login: se elige una persona de la lista, tal como fijó el spec 001. El rol no
 * vive aquí: cada tablero guarda quién entra y con qué permiso, así que la misma persona
 * puede administrar un tablero y solo mirar otro.
 */
@Injectable({ providedIn: 'root' })
export class MemberStore {
  readonly miembros = signal<readonly Member[]>(MIEMBROS_DEMO);

  private readonly actual = signal<Member>(MIEMBROS_DEMO[0]!);
  private readonly elegida = signal(false);

  /**
   * `true` solo si alguien eligió persona (ahora o en una visita anterior).
   *
   * Es lo que hace útil al guard: distingue "entré" de "esto es el valor por defecto".
   * Sin esta señal la sesión siempre existiría y proteger rutas sería un adorno.
   */
  readonly haySesion = this.elegida.asReadonly();

  readonly sesion = this.actual.asReadonly();

  constructor() {
    const guardada = leerTexto(CLAVE_SESION);
    const encontrada = guardada
      ? this.miembros().find((miembro) => miembro.id === guardada)
      : undefined;

    if (encontrada) {
      this.actual.set(encontrada);
      this.elegida.set(true);
    }
  }

  /** Elegir persona es entrar: a partir de aquí hay sesión. */
  cambiarSesion(id: MemberId): void {
    const elegida = this.miembros().find((miembro) => miembro.id === id);

    if (!elegida) {
      return;
    }

    escribirTexto(CLAVE_SESION, id);
    this.actual.set(elegida);
    this.elegida.set(true);
  }

  salir(): void {
    borrarTexto(CLAVE_SESION);
    this.actual.set(this.miembros()[0]!);
    this.elegida.set(false);
  }
}

export { comoMemberId };
