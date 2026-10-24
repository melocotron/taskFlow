import { OVERLAY_DEFAULT_CONFIG, OverlayContainer } from '@angular/cdk/overlay';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { OverlayContainerAccesible } from '@shared/ui/overlay/overlay-container';
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
    provideHttpClient(withFetch()),
    provideRouter(routes, withComponentInputBinding()),
    /*
     * El CDK 22 monta los overlays en la capa superior del navegador (Popover API),
     * donde el z-index deja de ordenar. Con un diálogo abierto, el aviso de
     * confirmación quedaba detrás de su fondo y no se podía cerrar. Sin popover, el
     * contenedor del CDK vuelve al z-index 1000 y el aviso (1100) puede quedar encima.
     */
    { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } },
    { provide: OverlayContainer, useClass: OverlayContainerAccesible },
  ],
};
