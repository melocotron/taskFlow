import { Injectable } from '@angular/core';
import { Board } from '../model/board.model';

const CLAVE = 'taskflow.tableros';

/**
 * Persistencia de tableros en el propio navegador.
 *
 * Es el `api/` del slice: el store no sabe si esto es `localStorage`, un archivo o
 * un servidor. Cuando exista un backend, solo cambia este archivo.
 */
@Injectable({ providedIn: 'root' })
export class BoardRepository {
  /** Devuelve `[]` ante cualquier problema: un dato corrupto no debe impedir abrir la app. */
  cargar(): readonly Board[] {
    const crudo = this.almacen()?.getItem(CLAVE);

    if (!crudo) {
      return [];
    }

    try {
      const datos: unknown = JSON.parse(crudo);

      if (!Array.isArray(datos)) {
        return [];
      }

      return datos.filter((item): item is Board => this.esTablero(item));
    } catch {
      return [];
    }
  }

  guardar(tableros: readonly Board[]): void {
    this.almacen()?.setItem(CLAVE, JSON.stringify(tableros));
  }

  /** El acceso va envuelto: en un entorno sin `localStorage` la app sigue funcionando. */
  private almacen(): Storage | null {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  }

  private esTablero(valor: unknown): valor is Board {
    if (typeof valor !== 'object' || valor === null) {
      return false;
    }

    const candidato = valor as Record<string, unknown>;

    return (
      typeof candidato['id'] === 'string' &&
      typeof candidato['titulo'] === 'string' &&
      Array.isArray(candidato['columnas']) &&
      typeof candidato['archivado'] === 'boolean' &&
      typeof candidato['creadoEn'] === 'string'
    );
  }
}
