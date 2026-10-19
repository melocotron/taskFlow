import { TestBed } from '@angular/core/testing';
import { Task } from './task.model';
import { TaskStore } from './task.store';

const TABLERO = 'tablero-1';

describe('TaskStore', () => {
  function montar() {
    TestBed.configureTestingModule({});
    return TestBed.inject(TaskStore);
  }

  function titulos(tareas: readonly Task[]): string[] {
    return tareas.map((tarea) => tarea.titulo);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  describe('crear', () => {
    it('añade la tarjeta al final de su columna', () => {
      const store = montar();

      store.crear(TABLERO, 'por-hacer', 'Primera');
      store.crear(TABLERO, 'por-hacer', 'Segunda');

      const columna = TestBed.runInInjectionContext(() => store.deColumna(TABLERO, 'por-hacer')());

      expect(titulos(columna)).toEqual(['Primera', 'Segunda']);
      expect(columna.map((t) => t.posicion)).toEqual([0, 1]);
    });

    it('se niega a crear una tarjeta sin título', () => {
      const store = montar();

      expect(() => store.crear(TABLERO, 'por-hacer', '  ')).toThrow(/necesita un título/);
    });

    it('guarda descripción y responsable opcionales', () => {
      const store = montar();

      const tarea = store.crear(TABLERO, 'por-hacer', 'Revisar copy', {
        descripcion: 'El de la home',
        responsable: 'Marta',
      });

      expect(tarea.descripcion).toBe('El de la home');
      expect(tarea.responsable).toBe('Marta');
    });
  });

  describe('mover entre columnas', () => {
    it('cambia de columna y deja la posición pedida', () => {
      const store = montar();
      const a = store.crear(TABLERO, 'por-hacer', 'A');
      store.crear(TABLERO, 'en-curso', 'B');
      store.crear(TABLERO, 'en-curso', 'C');

      store.mover(a.id, 'en-curso', 1);

      const destino = TestBed.runInInjectionContext(() => store.deColumna(TABLERO, 'en-curso')());

      expect(titulos(destino)).toEqual(['B', 'A', 'C']);
    });

    it('renumera la columna de origen sin dejar huecos', () => {
      const store = montar();
      const a = store.crear(TABLERO, 'por-hacer', 'A');
      store.crear(TABLERO, 'por-hacer', 'B');
      store.crear(TABLERO, 'por-hacer', 'C');

      store.mover(a.id, 'hecho', 0);

      const origen = TestBed.runInInjectionContext(() => store.deColumna(TABLERO, 'por-hacer')());

      expect(titulos(origen)).toEqual(['B', 'C']);
      expect(origen.map((t) => t.posicion)).toEqual([0, 1]);
    });

    it('recorta un índice fuera de rango en vez de romperse', () => {
      const store = montar();
      const a = store.crear(TABLERO, 'por-hacer', 'A');
      store.crear(TABLERO, 'hecho', 'B');

      store.mover(a.id, 'hecho', 99);

      const destino = TestBed.runInInjectionContext(() => store.deColumna(TABLERO, 'hecho')());

      expect(titulos(destino)).toEqual(['B', 'A']);
    });

    it('ignora un id que no existe', () => {
      const store = montar();
      store.crear(TABLERO, 'por-hacer', 'A');

      expect(() => store.mover('no-existe' as never, 'hecho', 0)).not.toThrow();
      expect(store.tareas().length).toBe(1);
    });
  });

  describe('mover dentro de la misma columna', () => {
    it('reordena sin tocar las demás columnas', () => {
      const store = montar();
      const a = store.crear(TABLERO, 'por-hacer', 'A');
      store.crear(TABLERO, 'por-hacer', 'B');
      store.crear(TABLERO, 'por-hacer', 'C');
      const otra = store.crear(TABLERO, 'hecho', 'D');

      store.mover(a.id, 'por-hacer', 2);

      const columna = TestBed.runInInjectionContext(() => store.deColumna(TABLERO, 'por-hacer')());

      expect(titulos(columna)).toEqual(['B', 'C', 'A']);
      expect(columna.map((t) => t.posicion)).toEqual([0, 1, 2]);
      expect(store.tareas().find((t) => t.id === otra.id)?.posicion).toBe(0);
    });

    it('subir a la primera posición funciona', () => {
      const store = montar();
      store.crear(TABLERO, 'por-hacer', 'A');
      store.crear(TABLERO, 'por-hacer', 'B');
      const c = store.crear(TABLERO, 'por-hacer', 'C');

      store.mover(c.id, 'por-hacer', 0);

      const columna = TestBed.runInInjectionContext(() => store.deColumna(TABLERO, 'por-hacer')());

      expect(titulos(columna)).toEqual(['C', 'A', 'B']);
    });
  });

  describe('editar y eliminar', () => {
    it('edita solo los campos indicados', () => {
      const store = montar();
      const tarea = store.crear(TABLERO, 'por-hacer', 'A', { descripcion: 'Original' });

      store.editar(tarea.id, { titulo: 'A revisada' });

      const actualizada = store.tareas().find((t) => t.id === tarea.id);
      expect(actualizada?.titulo).toBe('A revisada');
      expect(actualizada?.descripcion).toBe('Original');
    });

    it('al eliminar renumera la columna', () => {
      const store = montar();
      const a = store.crear(TABLERO, 'por-hacer', 'A');
      store.crear(TABLERO, 'por-hacer', 'B');
      store.crear(TABLERO, 'por-hacer', 'C');

      store.eliminar(a.id);

      const columna = TestBed.runInInjectionContext(() => store.deColumna(TABLERO, 'por-hacer')());

      expect(titulos(columna)).toEqual(['B', 'C']);
      expect(columna.map((t) => t.posicion)).toEqual([0, 1]);
    });
  });

  it('persiste los movimientos: un store nuevo recupera el orden', () => {
    const store = montar();
    const a = store.crear(TABLERO, 'por-hacer', 'A');
    store.mover(a.id, 'hecho', 0);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const recargado = TestBed.inject(TaskStore);

    const enHecho = TestBed.runInInjectionContext(() => recargado.deColumna(TABLERO, 'hecho')());

    expect(titulos(enHecho)).toEqual(['A']);
  });
});
