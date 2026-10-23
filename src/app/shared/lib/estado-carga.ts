import { InjectionToken } from '@angular/core';

/**
 * Estados por los que pasa una carga de datos.
 *
 * Las pantallas dibujan el esqueleto y el error sin saber si el origen es HTTP u otro;
 * los repositorios actuales responden desde la API.
 */
export type EstadoCarga = 'cargando' | 'listo' | 'error';

/** Latencia simulada opcional para pruebas de UI; los tests la fijan a 0. */
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
