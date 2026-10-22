import { Injectable, inject } from '@angular/core';
import { escribirLista, leerLista } from '@shared/lib/almacenamiento';
import { LATENCIA_SIMULADA, esperar } from '@shared/lib/estado-carga';
import { Task } from '../model/task.model';

const CLAVE = 'taskflow.tareas';

/** Persistencia de tarjetas. Un solo array: el orden lo da `columnaId` + `posicion`. */
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private readonly latencia = inject(LATENCIA_SIMULADA);

  async cargar(): Promise<readonly Task[]> {
    await esperar(this.latencia);

    return leerLista(CLAVE, esTask);
  }

  guardar(tareas: readonly Task[]): void {
    escribirLista(CLAVE, tareas);
  }
}

function esTask(valor: unknown): valor is Task {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }

  const candidato = valor as Record<string, unknown>;

  return (
    typeof candidato['id'] === 'string' &&
    typeof candidato['boardId'] === 'string' &&
    typeof candidato['columnaId'] === 'string' &&
    typeof candidato['titulo'] === 'string' &&
    typeof candidato['posicion'] === 'number'
  );
}
