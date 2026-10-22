import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { Routes } from '@angular/router';
import { labInterceptor } from './lab.interceptor';

/**
 * El proveedor de HTTP vive en la ruta lazy, no en la aplicación.
 *
 * Así el laboratorio puede usar `httpResource` sin añadir HttpClient al bundle
 * inicial ni permitir que una petición de producto acabe en el interceptor mock.
 */
export default [
  {
    path: '',
    title: 'Kitchen sink · TaskFlow',
    providers: [provideHttpClient(withInterceptors([labInterceptor]))],
    loadComponent: () => import('./kitchen-sink'),
  },
] satisfies Routes;
