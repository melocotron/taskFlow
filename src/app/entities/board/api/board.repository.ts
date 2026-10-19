import { Injectable, inject } from '@angular/core';
import { escribirLista, leerLista } from '@shared/lib/almacenamiento';
import { LATENCIA_SIMULADA, esperar } from '@shared/lib/estado-carga';
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
  private readonly latencia = inject(LATENCIA_SIMULADA);

  async cargar(): Promise<readonly Board[]> {
    await esperar(this.latencia);

    return leerLista(CLAVE, esTablero);
  }

  guardar(tableros: readonly Board[]): void {
    escribirLista(CLAVE, tableros);
  }
}

function esTablero(valor: unknown): valor is Board {
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
