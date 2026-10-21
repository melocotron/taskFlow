import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';

/**
 * Contenedor de overlays con un landmark propio.
 *
 * El CDK monta diálogos y menús en un `<div>` hermano del `main`. Para un lector de
 * pantalla ese contenido queda fuera de cualquier landmark, y axe lo denuncia con la
 * regla `region` aunque el menú o el diálogo tengan su rol correcto. El contenedor
 * pasa a ser una región con nombre: el overlay sigue siendo el mismo, pero su
 * contenido ya pertenece a una zona identificable.
 *
 * No se pone el rol en cada overlay porque el contenedor es el que está fuera del
 * `main`; los roles propios de diálogo y menú se conservan intactos.
 */
@Injectable()
export class OverlayContainerAccesible extends OverlayContainer {
  protected override _createContainer(): void {
    super._createContainer();

    this._containerElement?.setAttribute('role', 'region');
    this._containerElement?.setAttribute('aria-label', 'Diálogos y menús');
  }
}
