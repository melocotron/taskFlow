import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

/**
 * Configuración raíz de la aplicación.
 *
 * No hay `provideZonelessChangeDetection()` porque en Angular 22 el modo zoneless
 * es el comportamiento por defecto: el proyecto no incluye zone.js.
 *
 * `withComponentInputBinding()` permite recibir parámetros de ruta directamente
 * como `input()` del componente, sin leer el ActivatedRoute a mano.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
  ],
};
