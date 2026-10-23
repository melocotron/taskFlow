import { Injectable, signal } from '@angular/core';
import { borrarTexto, escribirTexto, leerTexto } from '@shared/lib/almacenamiento';
import { Member, MemberId, MIEMBROS_DEMO, comoMemberId } from '../model/member.model';

const CLAVE_SESION = 'taskflow.sesion';

/**
 * Identidad adaptada al modelo de tableros.
 *
 * `AuthService` es la fuente de verdad de la sesión. Este store conserva la interfaz
 * que ya usan los tableros y sincroniza la cuenta autenticada desde `App`. El rol no
 * vive aquí: cada tablero guarda quién entra y con qué permiso. Los métodos de la
 * demo (elegir persona y `localStorage`) sobreviven hasta retirar los repositorios
 * locales en T074.
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

  /**
   * Sincroniza el store con la cuenta que devuelve la API.
   *
   * La autenticación real vive en `AuthService`; este método solo adapta la identidad
   * al modelo de miembro que ya usan los tableros. Al cerrar sesión se vuelve a la
   * lista de demostración para que los tests y la pantalla antigua sigan funcionando
   * mientras termina la migración de datos (T070).
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
    borrarTexto(CLAVE_SESION);
  }

  salir(): void {
    borrarTexto(CLAVE_SESION);
    this.actual.set(this.miembros()[0]!);
    this.elegida.set(false);
  }
}

export { comoMemberId };
