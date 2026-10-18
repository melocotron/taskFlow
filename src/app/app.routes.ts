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
    // Banco de pruebas del design system. No es producto: no aparece en la navegación.
    path: 'kitchen-sink',
    title: 'Kitchen sink · TaskFlow',
    loadComponent: () => import('@pages/kitchen-sink/kitchen-sink'),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
