/**
 * Generador de identificadores.
 *
 * Vive en `shared/lib` porque no sabe nada del negocio: solo produce cadenas únicas.
 */
export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
