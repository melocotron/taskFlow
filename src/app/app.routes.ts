import { Routes } from '@angular/router';

/**
 * Rutas raíz. Todas las páginas entran por lazy loading: así el bundle inicial
 * no crece cuando el proyecto crezca.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'TaskFlow',
    loadComponent: () => import('@pages/home/home'),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
