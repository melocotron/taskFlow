/**
 * Acceso a `localStorage` con red de seguridad.
 *
 * Vive en `shared/lib` porque no sabe nada del negocio: serializa y deserializa.
 * Los repositorios de cada entidad deciden qué se guarda y qué se considera válido.
 */

/** En un entorno sin `localStorage` (o bloqueado) devuelve `null` en vez de explotar. */
function almacen(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Lee una lista y descarta lo que no pase el guardián de forma.
 *
 * Un dato corrupto nunca debe impedir abrir la aplicación: se ignora y se sigue.
 */
export function leerLista<T>(
  clave: string,
  esValido: (valor: unknown) => valor is T,
): readonly T[] {
  const crudo = almacen()?.getItem(clave);

  if (!crudo) {
    return [];
  }

  try {
    const datos: unknown = JSON.parse(crudo);

    if (!Array.isArray(datos)) {
      return [];
    }

    return datos.filter(esValido);
  } catch {
    return [];
  }
}

export function escribirLista(clave: string, valor: unknown): void {
  almacen()?.setItem(clave, JSON.stringify(valor));
}

/** Para valores sueltos que no son listas (por ejemplo, la sesión elegida). */
export function leerTexto(clave: string): string | null {
  return almacen()?.getItem(clave) ?? null;
}

export function escribirTexto(clave: string, valor: string): void {
  almacen()?.setItem(clave, valor);
}
