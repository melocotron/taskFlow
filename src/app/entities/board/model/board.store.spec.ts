import { TestBed } from '@angular/core/testing';
import { BoardRepository } from '../api/board.repository';
import { BoardStore } from './board.store';

describe('BoardStore', () => {
  function montar() {
    TestBed.configureTestingModule({});
    return {
      store: TestBed.inject(BoardStore),
      repositorio: TestBed.inject(BoardRepository),
    };
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('arranca vacío cuando no hay nada guardado', () => {
    const { store } = montar();

    expect(store.tableros()).toEqual([]);
    expect(store.cuantosActivos()).toBe(0);
  });

  it('crea un tablero con sus columnas por defecto', () => {
    const { store } = montar();

    const board = store.crear('Producto');

    expect(board.titulo).toBe('Producto');
    expect(board.columnas.map((columna) => columna.titulo)).toEqual([
      'Por hacer',
      'En curso',
      'Hecho',
    ]);
    expect(store.activos().length).toBe(1);
  });

  it('recorta los espacios del título al crear', () => {
    const { store } = montar();

    expect(store.crear('   Producto   ').titulo).toBe('Producto');
  });

  it('se niega a crear un tablero sin título', () => {
    const { store } = montar();

    expect(() => store.crear('   ')).toThrow(/necesita un título/);
    expect(store.tableros().length).toBe(0);
  });

  it('renombra solo el tablero indicado', () => {
    const { store } = montar();
    const producto = store.crear('Producto');
    store.crear('Marketing');

    store.renombrar(producto.id, 'Producto digital');

    expect(store.buscar(producto.id)?.titulo).toBe('Producto digital');
    expect(store.activos().length).toBe(2);
  });

  it('archivar lo saca de la lista visible pero no lo borra', () => {
    const { store } = montar();
    const board = store.crear('Producto');

    store.archivar(board.id);

    expect(store.activos().length).toBe(0);
    expect(store.tableros().length).toBe(1);
    expect(store.buscar(board.id)?.archivado).toBe(true);
  });

  it('persiste cada cambio: un store nuevo recupera lo guardado', () => {
    const { store } = montar();
    store.crear('Producto');

    // Simula un recargado: se descarta el store y se construye otro sobre el mismo almacén.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const recargado = TestBed.inject(BoardStore);

    expect(recargado.tableros().length).toBe(1);
    expect(recargado.tableros()[0]?.titulo).toBe('Producto');
  });

  it('no se rompe si el almacén tiene basura', () => {
    localStorage.setItem('taskflow.tableros', 'esto no es json');

    const { store } = montar();

    expect(store.tableros()).toEqual([]);
  });

  it('ignora entradas que no tienen forma de tablero', () => {
    localStorage.setItem(
      'taskflow.tableros',
      JSON.stringify([
        { id: 'x' },
        { id: 'b', titulo: 'Bueno', columnas: [], archivado: false, creadoEn: '2026-01-01' },
      ]),
    );

    const { store } = montar();

    expect(store.tableros().length).toBe(1);
    expect(store.tableros()[0]?.titulo).toBe('Bueno');
  });
});
