import { comoMemberId } from '@entities/member';
import { esMiembro, puedeEn, rolEn } from './board.model';
import type { Board } from './board.model';
import { COLUMNAS_POR_DEFECTO, comoBoardId } from './board.model';

const MARTA = comoMemberId('marta');
const IVAN = comoMemberId('ivan');
const ALBA = comoMemberId('alba');

function tablero(titulo: string, miembros: Board['miembros']): Board {
  return {
    id: comoBoardId(titulo.toLowerCase()),
    titulo,
    columnas: COLUMNAS_POR_DEFECTO,
    miembros,
    archivado: false,
    creadoEn: '2026-10-19T00:00:00.000Z',
  };
}

function tableroConRoles(): Board {
  return tablero('Producto', [
    { memberId: MARTA, nombre: 'Marta Ruiz', email: 'marta@example.com', rol: 'admin' },
    { memberId: IVAN, nombre: 'Iván Soto', email: 'ivan@example.com', rol: 'editor' },
    { memberId: ALBA, nombre: 'Alba Sanz', email: 'alba@example.com', rol: 'viewer' },
  ]);
}

describe('miembros del tablero', () => {
  it('el rol se lee del tablero concreto', () => {
    const board = tableroConRoles();

    expect(rolEn(board, MARTA)).toBe('admin');
    expect(rolEn(board, IVAN)).toBe('editor');
    expect(rolEn(board, ALBA)).toBe('viewer');
  });

  it('quien no aparece en la lista no tiene ningún acceso', () => {
    const board = tableroConRoles();

    expect(esMiembro(board, 'fantasma')).toBe(false);
    expect(rolEn(board, 'fantasma')).toBeNull();
    expect(puedeEn(board, 'fantasma', 'ver')).toBe(false);
  });

  it('los permisos se derivan del rol de ese tablero', () => {
    const board = tableroConRoles();

    expect(puedeEn(board, MARTA, 'administrar')).toBe(true);
    expect(puedeEn(board, IVAN, 'editar')).toBe(true);
    expect(puedeEn(board, IVAN, 'administrar')).toBe(false);
    expect(puedeEn(board, ALBA, 'ver')).toBe(true);
    expect(puedeEn(board, ALBA, 'editar')).toBe(false);
  });

  it('la misma persona puede tener roles distintos en tableros distintos', () => {
    const deMarta = tableroConRoles();
    const deAlba = tablero('Marketing', [
      { memberId: ALBA, nombre: 'Alba Sanz', email: 'alba@example.com', rol: 'admin' },
    ]);

    expect(rolEn(deMarta, ALBA)).toBe('viewer');
    expect(rolEn(deAlba, ALBA)).toBe('admin');
    expect(puedeEn(deMarta, ALBA, 'editar')).toBe(false);
    expect(puedeEn(deAlba, ALBA, 'editar')).toBe(true);
  });
});
