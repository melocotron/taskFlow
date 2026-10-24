import { Injectable, signal } from '@angular/core';
import { Member, MemberId, MIEMBROS_DEMO, comoMemberId } from '../model/member.model';

/**
 * Identidad adaptada al modelo de tableros.
 *
 * `AuthService` es la fuente de verdad de la sesión. Este store conserva la interfaz
 * que ya usan los tableros y sincroniza la cuenta autenticada desde `App`. El rol no
 * vive aquí: cada tablero guarda quién entra y con qué permiso.
 *
 * No hay persistencia local: al recargar, `AuthService` pregunta a `/me` y vuelve a
 * sincronizar la identidad. La lista de demostración solo existe para los tests y
 * para tener un valor por defecto antes de que llegue la sesión.
 */
@Injectable({ providedIn: 'root' })
export class MemberStore {
  readonly miembros = signal<readonly Member[]>(MIEMBROS_DEMO);

  private readonly actual = signal<Member>(MIEMBROS_DEMO[0]!);
  private readonly elegida = signal(false);

  /**
   * `true` solo si hay una cuenta autenticada o alguien llamó a `cambiarSesion`.
   *
   * Es lo que hace útil al guard: distingue "entré" de "esto es el valor por defecto".
   */
  readonly haySesion = this.elegida.asReadonly();

  readonly sesion = this.actual.asReadonly();

  /** Elegir persona abre la sesión en memoria; ya no se guarda en el navegador. */
  cambiarSesion(id: MemberId): void {
    const elegida = this.miembros().find((miembro) => miembro.id === id);

    if (!elegida) {
      return;
    }

    this.actual.set(elegida);
    this.elegida.set(true);
  }

  /**
   * Sincroniza el store con la cuenta que devuelve la API.
   *
   * La autenticación real vive en `AuthService`; este método solo adapta la identidad
   * al modelo de miembro que ya usan los tableros. Al cerrar sesión se vuelve a la
   * lista de demostración para no conservar una identidad obsoleta.
   */
  sincronizarSesion(miembro: Member | null): void {
    if (miembro) {
      this.miembros.set([miembro]);
      this.actual.set(miembro);
      this.elegida.set(true);
      return;
    }

    this.miembros.set(MIEMBROS_DEMO);
    this.actual.set(MIEMBROS_DEMO[0]!);
    this.elegida.set(false);
  }

  salir(): void {
    this.actual.set(this.miembros()[0]!);
    this.elegida.set(false);
  }
}

export { comoMemberId };
