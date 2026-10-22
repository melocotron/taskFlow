import type { Routes } from '@angular/router';

/**
 * Variante de producción: el kitchen-sink es una herramienta de desarrollo.
 *
 * La configuración de producción sustituye `kitchen-sink.routes.ts` por este
 * archivo, de modo que ni la página ni `HttpClient` entran en el bundle inicial.
 */
export default [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/',
  },
] satisfies Routes;
