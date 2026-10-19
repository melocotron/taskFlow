/**
 * Marca de tipo para los ids de persona.
 */
declare const marcaMember: unique symbol;

export type MemberId = string & { readonly [marcaMember]: true };

export function comoMemberId(valor: string): MemberId {
  return valor as MemberId;
}

/** Nivel de permiso de una persona sobre un tablero. */
export type Rol = 'admin' | 'editor' | 'viewer';

/** Lo que se puede hacer, expresado como intención y no como botón. */
export type Accion = 'ver' | 'editar' | 'administrar';

export interface Member {
  readonly id: MemberId;
  readonly nombre: string;
}

/** Las tres personas de ejemplo que fija el spec 001. */
export const MIEMBROS_DEMO: readonly Member[] = [
  { id: comoMemberId('marta'), nombre: 'Marta Ruiz' },
  { id: comoMemberId('ivan'), nombre: 'Iván Soto' },
  { id: comoMemberId('alba'), nombre: 'Alba Sanz' },
];

/**
 * Roles con los que se abrieron los tableros de la demo antes de S3.7.
 *
 * El rol dejó de ser global: ahora vive en cada tablero. Esta tabla solo existe para
 * migrar los datos ya guardados en `localStorage`, de modo que quien ya tenía un
 * tablero no se quede fuera al actualizar. Los tableros nuevos no la usan.
 */
export const ROLES_HEREDADOS: Readonly<Record<string, Rol>> = {
  marta: 'admin',
  ivan: 'editor',
  alba: 'viewer',
};

/**
 * La regla de permisos, en un solo sitio.
 *
 * No vive en el componente que pinta el botón: si la interfaz esconde una acción pero
 * el dominio no la comprueba, basta con una URL o una llamada directa para saltársela.
 * Aquí, cualquier camino pasa por la misma función.
 */
export function puede(rol: Rol, accion: Accion): boolean {
  switch (rol) {
    case 'admin':
      return true;
    case 'editor':
      return accion === 'ver' || accion === 'editar';
    case 'viewer':
      return accion === 'ver';
    default: {
      // Si algún día se añade un rol sin actualizar esta tabla, el compilador lo delata.
      const jamas: never = rol;
      throw new Error(`Rol desconocido: ${String(jamas)}`);
    }
  }
}

/** Etiqueta legible del rol, para mostrarla junto al nombre. */
export function etiquetaRol(rol: Rol): string {
  return rol === 'admin' ? 'Administración' : rol === 'editor' ? 'Edición' : 'Solo lectura';
}
