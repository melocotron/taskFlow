import { Injectable, computed, signal } from '@angular/core';
import { escribirTexto, leerTexto } from '@shared/lib/almacenamiento';
import {
  Accion,
  Member,
  MemberId,
  MIEMBROS_DEMO,
  Rol,
  comoMemberId,
  puede,
} from '../model/member.model';

const CLAVE_SESION = 'taskflow.sesion';

/**
 * Personas del equipo y quién está usando la app ahora mismo.
 *
 * No hay login: se elige una persona de la lista, tal como fijó el spec 001. Los
 * permisos se derivan del rol, nunca del componente que los muestra.
 */
@Injectable({ providedIn: 'root' })
export class MemberStore {
  readonly miembros = signal<readonly Member[]>(MIEMBROS_DEMO);

  private readonly actual = signal<Member>(this.sesionInicial());

  readonly sesion = this.actual.asReadonly();
  readonly rol = computed<Rol>(() => this.actual().rol);

  readonly puedeEditar = computed(() => puede(this.rol(), 'editar'));
  readonly puedeAdministrar = computed(() => puede(this.rol(), 'administrar'));

  /** Atajo por si una acción concreta no está cubierta por los dos computeds. */
  puede(accion: Accion): boolean {
    return puede(this.rol(), accion);
  }

  cambiarSesion(id: MemberId): void {
    const elegida = this.miembros().find((miembro) => miembro.id === id);

    if (!elegida) {
      return;
    }

    escribirTexto(CLAVE_SESION, id);
    this.actual.set(elegida);
  }

  /** La sesión guardada puede apuntar a alguien que ya no existe: se cae a la primera. */
  private sesionInicial(): Member {
    const guardada = leerTexto(CLAVE_SESION);
    const miembros = MIEMBROS_DEMO;

    if (guardada) {
      const encontrada = miembros.find((miembro) => miembro.id === guardada);

      if (encontrada) {
        return encontrada;
      }
    }

    return miembros[0]!;
  }
}

export { comoMemberId };
