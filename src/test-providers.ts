import { Provider } from '@angular/core';
import { LATENCIA_SIMULADA } from '@shared/lib/estado-carga';

/**
 * Proveedores globales de los tests.
 *
 * Anula la latencia simulada opcional para que ninguna prueba espere de más. La app
 * real carga por HTTP; este punto de extensión se registra en `angular.json` →
 * `targets.test.options.providersFile`.
 */
const testProviders: Provider[] = [{ provide: LATENCIA_SIMULADA, useValue: 0 }];

export default testProviders;
