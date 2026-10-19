import { Injectable, inject } from '@angular/core';
import { MIEMBROS_DEMO, ROLES_HEREDADOS, comoMemberId } from '@entities/member';
import type { Rol } from '@entities/member';
import { escribirLista, leerLista } from '@shared/lib/almacenamiento';
import { LATENCIA_SIMULADA, esperar } from '@shared/lib/estado-carga';
import { Board, BoardMember, comoBoardId } from '../model/board.model';

const CLAVE = 'taskflow.tableros';

/**
 * Persistencia de tableros en el propio navegador.
 *
 * Es el `api/` del slice: el store no sabe si esto es `localStorage`, un archivo o
 * un servidor. Cuando exista un backend, solo cambia este archivo.
 *
 * Los tableros anteriores a S3.7 no tienen `miembros`. Al cargarlos se les asignan los
 * roles que tenían en la demo y se reescribe el almacén: así nadie pierde acceso al
 * actualizar, y la migración ocurre una sola vez.
 */
@Injectable({ providedIn: 'root' })
export class BoardRepository {
  private readonly latencia = inject(LATENCIA_SIMULADA);

  async cargar(): Promise<readonly Board[]> {
    await esperar(this.latencia);

    const crudos = leerLista(CLAVE, esTablero);
    let migrado = false;

    const tableros = crudos.map((crudo) => {
      const normalizado = normalizar(crudo);
      migrado ||= normalizado.migrado;

      return normalizado.board;
    });

    if (migrado) {
      escribirLista(CLAVE, tableros);
    }

    return tableros;
  }

  guardar(tableros: readonly Board[]): void {
    escribirLista(CLAVE, tableros);
  }
}

/** Forma mínima de un tablero guardado; `miembros` puede faltar en datos antiguos. */
interface TableroCrudo {
  readonly id: string;
  readonly titulo: string;
  readonly columnas: readonly { readonly id: string; readonly titulo: string }[];
  readonly miembros?: readonly unknown[];
  readonly archivado: boolean;
  readonly creadoEn: string;
}

function esTablero(valor: unknown): valor is TableroCrudo {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }

  const candidato = valor as Record<string, unknown>;

  return (
    typeof candidato['id'] === 'string' &&
    typeof candidato['titulo'] === 'string' &&
    Array.isArray(candidato['columnas']) &&
    (candidato['miembros'] === undefined || Array.isArray(candidato['miembros'])) &&
    typeof candidato['archivado'] === 'boolean' &&
    typeof candidato['creadoEn'] === 'string'
  );
}

/** Acepta una pertenencia guardada y la devuelve con sus tipos de dominio. */
function esMiembro(valor: unknown): valor is { memberId: string; rol: Rol } {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }

  const candidato = valor as Record<string, unknown>;

  return (
    typeof candidato['memberId'] === 'string' &&
    (candidato['rol'] === 'admin' || candidato['rol'] === 'editor' || candidato['rol'] === 'viewer')
  );
}

function normalizar(crudo: TableroCrudo): { board: Board; migrado: boolean } {
  const miembros: readonly BoardMember[] = Array.isArray(crudo.miembros)
    ? crudo.miembros.filter(esMiembro).map((miembro) => ({
        memberId: comoMemberId(miembro.memberId),
        rol: miembro.rol,
      }))
    : [];

  if (miembros.length > 0) {
    return {
      board: {
        id: comoBoardId(crudo.id),
        titulo: crudo.titulo,
        columnas: crudo.columnas,
        miembros,
        archivado: crudo.archivado,
        creadoEn: crudo.creadoEn,
      },
      migrado: false,
    };
  }

  return {
    board: {
      id: comoBoardId(crudo.id),
      titulo: crudo.titulo,
      columnas: crudo.columnas,
      miembros: miembrosHeredados(),
      archivado: crudo.archivado,
      creadoEn: crudo.creadoEn,
    },
    migrado: true,
  };
}

/** Roles con los que la demo abría todos los tableros antes de existir las invitaciones. */
function miembrosHeredados(): readonly BoardMember[] {
  return MIEMBROS_DEMO.map((miembro) => ({
    memberId: miembro.id,
    rol: ROLES_HEREDADOS[miembro.id] ?? 'viewer',
  }));
}
