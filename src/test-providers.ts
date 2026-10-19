import { Provider } from '@angular/core';
import { LATENCIA_SIMULADA } from '@shared/lib/estado-carga';

/**
 * Proveedores globales de los tests.
 *
 * La app simula 350 ms de latencia para que los estados de carga se puedan ver y
 * diseñar; en tests eso solo añadiría esperas. Aquí se anula una vez para todos.
 *
 * Se registra en `angular.json` → `targets.test.options.providersFile`.
 */
const testProviders: Provider[] = [{ provide: LATENCIA_SIMULADA, useValue: 0 }];

export default testProviders;
