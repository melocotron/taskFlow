import { Routes } from '@angular/router';
import { invitadoGuard, sesionGuard } from './sesion.guard';

/**
 * Rutas raíz. Todas las páginas entran por lazy loading: así el bundle inicial
 * no crece cuando el proyecto crezca.
 */
export const routes: Routes = [
  {
    path: 'entrar',
    title: 'Entrar · TaskFlow',
    canActivate: [invitadoGuard],
    loadComponent: () => import('@pages/entrar/entrar'),
  },
  {
    path: '',
    title: 'TaskFlow',
    canActivate: [sesionGuard],
    loadComponent: () => import('@pages/board-list/board-list'),
  },
  {
    path: 'tableros/:id',
    title: 'Tablero · TaskFlow',
    canActivate: [sesionGuard],
    loadComponent: () => import('@pages/board-detail/board-detail'),
  },
  {
    // Banco de pruebas del design system. No es producto: no aparece en la navegación.
    // Las rutas hijas cargan HttpClient solo para el laboratorio v22.
    path: 'kitchen-sink',
    loadChildren: () => import('@pages/kitchen-sink/kitchen-sink.routes'),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
