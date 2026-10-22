import { TestBed } from '@angular/core/testing';
import { comoMemberId } from '@entities/member';
import { BoardRepository } from '../api/board.repository';
import { BoardStore } from './board.store';

const MARTA = comoMemberId('marta');
const IVAN = comoMemberId('ivan');
const ALBA = comoMemberId('alba');

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

  it('crea un tablero con sus columnas por defecto y al creador como administrador', async () => {
    const { store } = await montar();

    const board = store.crear('Producto', MARTA);

    expect(board.titulo).toBe('Producto');
    expect(board.columnas.map((columna) => columna.titulo)).toEqual([
      'Por hacer',
      'En curso',
      'Hecho',
    ]);
    expect(board.miembros).toEqual([{ memberId: MARTA, rol: 'admin' }]);
    expect(store.activos().length).toBe(1);
  });

  it('recorta los espacios del título al crear', async () => {
    const { store } = await montar();

    expect(store.crear('   Producto   ', MARTA).titulo).toBe('Producto');
  });

  it('se niega a crear un tablero sin título', async () => {
    const { store } = await montar();

    expect(() => store.crear('   ', MARTA)).toThrow(/necesita un título/);
    expect(store.tableros().length).toBe(0);
  });

  it('renombra solo el tablero indicado', async () => {
    const { store } = await montar();
    const producto = store.crear('Producto', MARTA);
    store.crear('Marketing', MARTA);

    store.renombrar(producto.id, 'Producto digital');

    expect(store.buscar(producto.id)?.titulo).toBe('Producto digital');
    expect(store.activos().length).toBe(2);
  });

  it('archivar lo saca de la lista visible pero no lo borra', async () => {
    const { store } = await montar();
    const board = store.crear('Producto', MARTA);

    store.archivar(board.id);

    expect(store.activos().length).toBe(0);
    expect(store.tableros().length).toBe(1);
    expect(store.buscar(board.id)?.archivado).toBe(true);
  });

  it('persiste cada cambio: un store nuevo recupera lo guardado', async () => {
    const { store } = await montar();
    store.crear('Producto', MARTA);

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

  describe('invitaciones y roles por tablero', () => {
    it('invita a una persona con el rol elegido y lo persiste', async () => {
      const { store } = await montar();
      const board = store.crear('Producto', MARTA);

      store.invitar(board.id, MARTA, ALBA, 'viewer');

      expect(store.buscar(board.id)?.miembros).toContainEqual({
        memberId: ALBA,
        rol: 'viewer',
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const recargado = TestBed.inject(BoardStore);
      await recargado.listo;

      expect(recargado.tableros()[0]?.miembros).toContainEqual({
        memberId: ALBA,
        rol: 'viewer',
      });
    });

    it('no invita dos veces a la misma persona', async () => {
      const { store } = await montar();
      const board = store.crear('Producto', MARTA);
      store.invitar(board.id, MARTA, ALBA, 'viewer');

      expect(() => store.invitar(board.id, MARTA, ALBA, 'editor')).toThrow(/ya está en el tablero/);
    });

    it('solo quien administra puede invitar', async () => {
      const { store } = await montar();
      const board = store.crear('Producto', MARTA);
      store.invitar(board.id, MARTA, IVAN, 'editor');

      expect(() => store.invitar(board.id, IVAN, ALBA, 'viewer')).toThrow(/Solo quien administra/);
      expect(() => store.invitar(board.id, ALBA, ALBA, 'viewer')).toThrow(/Solo quien administra/);
      expect(store.buscar(board.id)?.miembros.length).toBe(2);
    });

    it('cambia el rol de alguien que ya está en el tablero', async () => {
      const { store } = await montar();
      const board = store.crear('Producto', MARTA);
      store.invitar(board.id, MARTA, ALBA, 'viewer');

      store.cambiarRol(board.id, MARTA, ALBA, 'editor');

      expect(store.buscar(board.id)?.miembros).toContainEqual({
        memberId: ALBA,
        rol: 'editor',
      });
    });

    it('no deja el tablero sin administración', async () => {
      const { store } = await montar();
      const board = store.crear('Producto', MARTA);

      expect(() => store.cambiarRol(board.id, MARTA, MARTA, 'viewer')).toThrow(
        /al menos una persona que lo administre/,
      );
      expect(store.buscar(board.id)?.miembros).toEqual([{ memberId: MARTA, rol: 'admin' }]);
    });

    it('permite rebajar a una persona administradora si queda otra', async () => {
      const { store } = await montar();
      const board = store.crear('Producto', MARTA);
      store.invitar(board.id, MARTA, IVAN, 'admin');

      store.cambiarRol(board.id, MARTA, MARTA, 'viewer');

      expect(store.buscar(board.id)?.miembros).toContainEqual({
        memberId: MARTA,
        rol: 'viewer',
      });
    });

    it('no cambia el rol de quien no está en el tablero', async () => {
      const { store } = await montar();
      const board = store.crear('Producto', MARTA);

      expect(() => store.cambiarRol(board.id, MARTA, ALBA, 'editor')).toThrow(
        /no está en el tablero/,
      );
    });
  });

  describe('migración de datos anteriores a S3.7', () => {
    it('da acceso a la demo con los roles que tenía y reescribe el almacén', async () => {
      localStorage.setItem(
        'taskflow.tableros',
        JSON.stringify([
          {
            id: 'viejo',
            titulo: 'Viejo',
            columnas: [],
            archivado: false,
            creadoEn: '2026-10-18T00:00:00.000Z',
          },
        ]),
      );

      const { store } = await montar();
      const board = store.tableros()[0]!;

      expect(board.miembros).toEqual([
        { memberId: MARTA, rol: 'admin' },
        { memberId: IVAN, rol: 'editor' },
        { memberId: ALBA, rol: 'viewer' },
      ]);

      const guardado = JSON.parse(localStorage.getItem('taskflow.tableros')!) as {
        miembros: unknown[];
      }[];

      expect(guardado[0]?.miembros.length).toBe(3);
    });

    it('respeta los tableros que ya tienen miembros', async () => {
      localStorage.setItem(
        'taskflow.tableros',
        JSON.stringify([
          {
            id: 'nuevo',
            titulo: 'Nuevo',
            columnas: [],
            miembros: [{ memberId: 'ivan', rol: 'admin' }],
            archivado: false,
            creadoEn: '2026-10-18T00:00:00.000Z',
          },
        ]),
      );

      const { store } = await montar();

      expect(store.tableros()[0]?.miembros).toEqual([{ memberId: IVAN, rol: 'admin' }]);
    });
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
      store.crear('Producto', MARTA);

      const recarga = store.cargar();
      expect(store.cargando()).toBe(true);

      await recarga;

      expect(store.carga()).toBe('listo');
      expect(store.error()).toBeNull();
    });
  });
});
