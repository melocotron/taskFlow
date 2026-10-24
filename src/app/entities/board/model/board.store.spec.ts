import { TestBed } from '@angular/core/testing';
import { BoardRepository } from '../api/board.repository';
import { ALBA, BoardRepositoryFalso, IVAN, MARTA, tablero } from '@testing/repositorios';
import { BoardStore } from './board.store';

describe('BoardStore', () => {
  async function montar(boards = [] as ReturnType<typeof tablero>[]) {
    const repositorio = new BoardRepositoryFalso(boards);

    TestBed.configureTestingModule({
      providers: [{ provide: BoardRepository, useValue: repositorio }],
    });

    const store = TestBed.inject(BoardStore);
    await store.listo;

    return { store, repositorio };
  }

  it('arranca vacío cuando la API no devuelve tableros', async () => {
    const { store } = await montar();

    expect(store.tableros()).toEqual([]);
    expect(store.cuantosActivos()).toBe(0);
  });

  it('carga los tableros que devuelve el servidor', async () => {
    const { store } = await montar([tablero()]);

    expect(store.tableros().length).toBe(1);
    expect(store.tableros()[0]?.titulo).toBe('Producto');
    expect(store.tableros()[0]?.miembros).toContainEqual(MARTA);
  });

  it('crea un tablero y lo añade al estado', async () => {
    const { store } = await montar();

    const board = await store.crear('Producto');

    expect(board.titulo).toBe('Producto');
    expect(board.columnas.map((columna) => columna.titulo)).toEqual([
      'Por hacer',
      'En curso',
      'Hecho',
    ]);
    expect(board.miembros).toEqual([MARTA]);
    expect(store.activos().length).toBe(1);
  });

  it('recorta los espacios del título al crear', async () => {
    const { store } = await montar();

    expect((await store.crear('   Producto   ')).titulo).toBe('Producto');
  });

  it('se niega a crear un tablero sin título', async () => {
    const { store } = await montar();

    await expect(store.crear('   ')).rejects.toThrow(/necesita un título/);
    expect(store.tableros().length).toBe(0);
  });

  it('renombra solo el tablero indicado', async () => {
    const { store } = await montar();
    const producto = await store.crear('Producto');
    await store.crear('Marketing');

    await store.renombrar(producto.id, 'Producto digital');

    expect(store.buscar(producto.id)?.titulo).toBe('Producto digital');
    expect(store.activos().length).toBe(2);
  });

  it('archivar lo saca de la lista visible pero no lo borra', async () => {
    const { store } = await montar();
    const board = await store.crear('Producto');

    await store.archivar(board.id);

    expect(store.activos().length).toBe(0);
    expect(store.tableros().length).toBe(1);
    expect(store.buscar(board.id)?.archivado).toBe(true);
  });

  describe('invitaciones y roles por tablero', () => {
    it('invita por email con el rol elegido', async () => {
      const { store } = await montar();
      const board = await store.crear('Producto');

      const member = await store.invitar(board.id, ALBA.email, 'viewer');

      expect(member).toEqual(ALBA);
      expect(store.buscar(board.id)?.miembros).toContainEqual(ALBA);
    });

    it('no invita dos veces a la misma cuenta', async () => {
      const { store } = await montar();
      const board = await store.crear('Producto');
      await store.invitar(board.id, ALBA.email, 'viewer');

      await expect(store.invitar(board.id, ALBA.email, 'editor')).rejects.toThrow(
        /ya está en el tablero/,
      );
    });

    it('cambia el rol de alguien que ya está en el tablero', async () => {
      const { store } = await montar();
      const board = await store.crear('Producto');
      await store.invitar(board.id, ALBA.email, 'viewer');

      await store.cambiarRol(board.id, ALBA.memberId, 'editor');

      expect(store.buscar(board.id)?.miembros).toContainEqual({ ...ALBA, rol: 'editor' });
    });

    it('no cambia el rol de quien no está en el tablero', async () => {
      const { store } = await montar();
      const board = await store.crear('Producto');

      await expect(store.cambiarRol(board.id, IVAN.memberId, 'editor')).rejects.toThrow(
        /no está en el tablero/,
      );
    });
  });

  describe('estados de carga', () => {
    it('empieza en cargando y termina en listo', async () => {
      let resolver: (boards: readonly ReturnType<typeof tablero>[]) => void = () => undefined;
      const repositorio = {
        cargar: () =>
          new Promise<readonly ReturnType<typeof tablero>[]>((resolve) => {
            resolver = resolve;
          }),
      };

      TestBed.configureTestingModule({
        providers: [{ provide: BoardRepository, useValue: repositorio }],
      });

      const store = TestBed.inject(BoardStore);

      expect(store.carga()).toBe('cargando');
      expect(store.cargando()).toBe(true);

      resolver([]);
      await store.listo;

      expect(store.carga()).toBe('listo');
      expect(store.cargando()).toBe(false);
    });

    it('si la API falla, queda en error con un motivo legible', async () => {
      TestBed.configureTestingModule({
        providers: [
          {
            provide: BoardRepository,
            useValue: {
              cargar: () => Promise.reject(new Error('Sin conexión con la API')),
            },
          },
        ],
      });

      const store = TestBed.inject(BoardStore);
      await store.listo;

      expect(store.carga()).toBe('error');
      expect(store.conFallo()).toBe(true);
      expect(store.error()).toBe('Sin conexión con la API');
    });

    it('recargar vuelve a pasar por cargando y deja el estado en listo', async () => {
      const { store } = await montar();

      const recarga = store.cargar();
      expect(store.cargando()).toBe(true);

      await recarga;

      expect(store.carga()).toBe('listo');
      expect(store.error()).toBeNull();
    });
  });
});
