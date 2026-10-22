import { Service } from '@angular/core';

/**
 * Servicio de laboratorio para demostrar `injectAsync()`.
 *
 * No lo usa el producto: se importa dinámicamente desde /kitchen-sink para que
 * el ejemplo sea real sin cargar este código en el camino crítico.
 */
@Service()
export class V22LabService {
  readonly mensaje = 'Servicio cargado bajo demanda con injectAsync().';
}
