import { InjectionToken } from '@angular/core';

/**
 * Estados por los que pasa una carga de datos.
 *
 * Existen aunque hoy el origen sea `localStorage`: en cuanto haya un backend, las
 * pantallas ya saben dibujar el esqueleto y el error sin cambiar una línea.
 */
export type EstadoCarga = 'cargando' | 'listo' | 'error';

/**
 * Latencia simulada, en milisegundos.
 *
 * En la app son 350 ms para que los estados de carga sean visibles y se puedan
 * diseñar. En los tests se sobrescribe a 0 para que corran rápido y sin esperas.
 */
export const LATENCIA_SIMULADA = new InjectionToken<number>('LATENCIA_SIMULADA', {
  providedIn: 'root',
  factory: () => 350,
});

/** Espera explícita: deja claro que el retardo es intencionado, no una carrera. */
export function esperar(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolver) => setTimeout(resolver, ms));
}
