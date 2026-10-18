import { Dialog as CdkDialog } from '@angular/cdk/dialog';
import { Injectable, TemplateRef, inject } from '@angular/core';
import { DialogContent } from './dialog-content';

export interface OpcionesDialogo {
  /** Ancho del panel. Por defecto el de un diálogo de formulario. */
  readonly ancho?: string;
}

/**
 * Abre diálogos con el overlay del CDK.
 *
 * Lo que nos ahorra no es el CSS: es **la trampa de foco, `Esc` y devolver el foco
 * al elemento que abrió**. Reimplementarlo a mano es donde se rompe la accesibilidad.
 *
 *   dialog.abrir('Renombrar tablero', plantilla);
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly cdk = inject(CdkDialog);

  abrir(titulo: string, contenido: TemplateRef<unknown>, opciones: OpcionesDialogo = {}) {
    return this.cdk.open(DialogContent, {
      data: { titulo, contenido },
      width: opciones.ancho ?? '480px',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      // El diálogo necesita nombre accesible; sin esto un lector anuncia "diálogo" y nada más.
      ariaLabel: titulo,
      panelClass: 'app-dialogo-panel',
      backdropClass: 'app-dialogo-fondo',
    });
  }
}
