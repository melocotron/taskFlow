import { TestBed } from '@angular/core/testing';
import { BoardRepository } from '../api/board.repository';
import { BoardStore } from './board.store';

describe('BoardStore', () => {
  async function montar() {
    TestBed.configureTestingModule({});
    const store = TestBed.inject(BoardStore);

    await store.listo;

    return { store, repositorio: TestBed.inject(BoardRepository) };
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('arranca vacío cuando no hay nada guardado', async () => {
    const { store } = await montar();

    expect(store.tableros()).toEqual([]);
    expect(store.cuantosActivos()).toBe(0);
  });

  it('crea un tablero con sus columnas por defecto', async () => {
    const { store } = await montar();

    const board = store.crear('Producto');

    expect(board.titulo).toBe('Producto');
    expect(board.columnas.map((columna) => columna.titulo)).toEqual([
      'Por hacer',
      'En curso',
      'Hecho',
    ]);
    expect(store.activos().length).toBe(1);
  });

  it('recorta los espacios del título al crear', async () => {
    const { store } = await montar();

    expect(store.crear('   Producto   ').titulo).toBe('Producto');
  });

  it('se niega a crear un tablero sin título', async () => {
    const { store } = await montar();

    expect(() => store.crear('   ')).toThrow(/necesita un título/);
    expect(store.tableros().length).toBe(0);
  });

  it('renombra solo el tablero indicado', async () => {
    const { store } = await montar();
    const producto = store.crear('Producto');
    store.crear('Marketing');

    store.renombrar(producto.id, 'Producto digital');

    expect(store.buscar(producto.id)?.titulo).toBe('Producto digital');
    expect(store.activos().length).toBe(2);
  });

  it('archivar lo saca de la lista visible pero no lo borra', async () => {
    const { store } = await montar();
    const board = store.crear('Producto');

    store.archivar(board.id);

    expect(store.activos().length).toBe(0);
    expect(store.tableros().length).toBe(1);
    expect(store.buscar(board.id)?.archivado).toBe(true);
  });

  it('persiste cada cambio: un store nuevo recupera lo guardado', async () => {
    const { store } = await montar();
    store.crear('Producto');

    // Simula un recargado: se descarta el store y se construye otro sobre el mismo almacén.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const recargado = TestBed.inject(BoardStore);
    await recargado.listo;

    expect(recargado.tableros().length).toBe(1);
    expect(recargado.tableros()[0]?.titulo).toBe('Producto');
  });

  it('no se rompe si el almacén tiene basura', async () => {
    localStorage.setItem('taskflow.tableros', 'esto no es json');

    const { store } = await montar();

    expect(store.tableros()).toEqual([]);
  });

  it('ignora entradas que no tienen forma de tablero', async () => {
    localStorage.setItem(
      'taskflow.tableros',
      JSON.stringify([
        { id: 'x' },
        { id: 'b', titulo: 'Bueno', columnas: [], archivado: false, creadoEn: '2026-01-01' },
      ]),
    );

    const { store } = await montar();

    expect(store.tableros().length).toBe(1);
    expect(store.tableros()[0]?.titulo).toBe('Bueno');
  });

  describe('estados de carga', () => {
    it('empieza en cargando y termina en listo', async () => {
      TestBed.configureTestingModule({});
      const store = TestBed.inject(BoardStore);

      // La carga arranca en el constructor; en este instante todavía no ha resuelto.
      expect(store.carga()).toBe('cargando');
      expect(store.cargando()).toBe(true);

      await store.listo;

      expect(store.carga()).toBe('listo');
      expect(store.cargando()).toBe(false);
    });

    it('si el origen falla, queda en error con un motivo legible', async () => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: BoardRepository,
            useValue: {
              cargar: () => Promise.reject(new Error('Sin conexión con el almacén')),
              guardar: () => undefined,
            },
          },
        ],
      });

      const store = TestBed.inject(BoardStore);
      await store.listo;

      expect(store.carga()).toBe('error');
      expect(store.conFallo()).toBe(true);
      expect(store.error()).toBe('Sin conexión con el almacén');
    });

    it('recargar vuelve a pasar por cargando y deja el estado en listo', async () => {
      const { store } = await montar();
      store.crear('Producto');

      const recarga = store.cargar();
      expect(store.cargando()).toBe(true);

      await recarga;

      expect(store.carga()).toBe('listo');
      expect(store.error()).toBeNull();
    });
  });
});
