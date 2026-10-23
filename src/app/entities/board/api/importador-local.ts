import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@shared/api';
import { borrarTexto, leerLista } from '@shared/lib/almacenamiento';

const CLAVE_TABLEROS = 'taskflow.tableros';
const CLAVE_TAREAS = 'taskflow.tareas';

interface TableroLocal {
  readonly id: string;
  readonly titulo: string;
  readonly columnas?: readonly unknown[];
  readonly archivado?: boolean;
  readonly creadoEn?: string;
}

interface TareaLocal {
  readonly id: string;
  readonly boardId: string;
  readonly columnaId: string;
  readonly titulo: string;
  readonly descripcion?: string;
  readonly responsable?: string | null;
  readonly posicion?: number;
  readonly creadoEn?: string;
}

export interface ResultadoImportacion {
  readonly tablerosImportados: number;
  readonly tablerosOmitidos: number;
  readonly tareasImportadas: number;
  readonly tareasOmitidas: number;
}

/**
 * Importa una sola vez el trabajo que quedó en `localStorage` antes de la cuenta.
 *
 * No es una fuente de datos: lee los dos depósitos de la versión 1.0, los envía a
 * `POST /import/local` y solo los borra cuando el servidor confirma. El backend usa
 * `legacy_id`, así que repetir la operación no duplica tableros.
 */
@Injectable({ providedIn: 'root' })
export class ImportadorLocal {
  private readonly api = inject(ApiClient);

  /** `true` mientras haya algo que ofrecer; la interfaz muestra la invitación. */
  hayDatos(): boolean {
    return this.tableros().length > 0 || this.tareas().length > 0;
  }

  async importar(): Promise<ResultadoImportacion | null> {
    const tableros = this.tableros();
    const tareas = this.tareas();

    if (tableros.length === 0 && tareas.length === 0) {
      return null;
    }

    const resultado = await this.api.post<ResultadoImportacion>('import/local', {
      tableros,
      tareas,
    });

    borrarTexto(CLAVE_TABLEROS);
    borrarTexto(CLAVE_TAREAS);

    return resultado;
  }

  private tableros(): readonly TableroLocal[] {
    return leerLista(CLAVE_TABLEROS, esTableroLocal);
  }

  private tareas(): readonly TareaLocal[] {
    return leerLista(CLAVE_TAREAS, esTareaLocal);
  }
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esTableroLocal(valor: unknown): valor is TableroLocal {
  return (
    esRegistro(valor) && typeof valor['id'] === 'string' && typeof valor['titulo'] === 'string'
  );
}

function esTareaLocal(valor: unknown): valor is TareaLocal {
  return (
    esRegistro(valor) &&
    typeof valor['id'] === 'string' &&
    typeof valor['boardId'] === 'string' &&
    typeof valor['columnaId'] === 'string' &&
    typeof valor['titulo'] === 'string'
  );
}
