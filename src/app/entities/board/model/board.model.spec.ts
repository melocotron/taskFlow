import { comoMemberId } from '@entities/member';
import { crearBoard, esMiembro, puedeEn, rolEn } from './board.model';
import type { Board } from './board.model';

const MARTA = comoMemberId('marta');
const IVAN = comoMemberId('ivan');
const ALBA = comoMemberId('alba');

function tableroConRoles(): Board {
  return {
    ...crearBoard('Producto', 'producto', '2026-10-19T00:00:00.000Z', MARTA),
    miembros: [
      { memberId: MARTA, rol: 'admin' },
      { memberId: IVAN, rol: 'editor' },
      { memberId: ALBA, rol: 'viewer' },
    ],
  };
}

describe('miembros del tablero', () => {
  it('quien crea el tablero entra como administrador', () => {
    const board = crearBoard('Producto', 'producto', '2026-10-19T00:00:00.000Z', MARTA);

    expect(board.miembros).toEqual([{ memberId: MARTA, rol: 'admin' }]);
  });

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
    const deAlba = crearBoard('Marketing', 'marketing', '2026-10-19T00:00:00.000Z', ALBA);

    expect(rolEn(deMarta, ALBA)).toBe('viewer');
    expect(rolEn(deAlba, ALBA)).toBe('admin');
    expect(puedeEn(deMarta, ALBA, 'editar')).toBe(false);
    expect(puedeEn(deAlba, ALBA, 'editar')).toBe(true);
  });
});
