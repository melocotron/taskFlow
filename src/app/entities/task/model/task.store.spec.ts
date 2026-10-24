import { TestBed } from '@angular/core/testing';
import { MARTA, TaskRepositoryFalso } from '@testing/repositorios';
import { TaskRepository } from '../api/task.repository';
import type { Task } from './task.model';
import { TaskStore } from './task.store';

const TABLERO = 'tablero-1';

describe('TaskStore', () => {
  async function montar(repositorio = new TaskRepositoryFalso()) {
    TestBed.configureTestingModule({
      providers: [{ provide: TaskRepository, useValue: repositorio }],
    });

    const store = TestBed.inject(TaskStore);
    await store.cargar(TABLERO);

    return { store, repositorio };
  }

  function titulos(tareas: readonly Task[]): string[] {
    return tareas.map((tarea) => tarea.titulo);
  }

  function columna(store: TaskStore, nombre: string): readonly Task[] {
    return TestBed.runInInjectionContext(() => store.deColumna(TABLERO, nombre)());
  }

  describe('crear', () => {
    it('añade la tarjeta al final de su columna', async () => {
      const { store } = await montar();

      await store.crear(TABLERO, 'por-hacer', 'Primera');
      await store.crear(TABLERO, 'por-hacer', 'Segunda');

      const tareas = columna(store, 'por-hacer');

      expect(titulos(tareas)).toEqual(['Primera', 'Segunda']);
      expect(tareas.map((t) => t.posicion)).toEqual([0, 1]);
    });

    it('se niega a crear una tarjeta sin título', async () => {
      const { store } = await montar();

      await expect(store.crear(TABLERO, 'por-hacer', '  ')).rejects.toThrow(/necesita un título/);
    });

    it('guarda descripción y responsable opcionales', async () => {
      const { store } = await montar();

      const tarea = await store.crear(TABLERO, 'por-hacer', 'Revisar copy', {
        descripcion: 'El de la home',
        responsableId: MARTA.memberId,
      });

      expect(tarea.descripcion).toBe('El de la home');
      expect(tarea.responsableId).toBe(MARTA.memberId);
      expect(tarea.responsable).toBe(MARTA.nombre);
    });
  });

  describe('mover entre columnas', () => {
    it('cambia de columna y deja la posición pedida', async () => {
      const { store } = await montar();
      const a = await store.crear(TABLERO, 'por-hacer', 'A');
      await store.crear(TABLERO, 'en-curso', 'B');
      await store.crear(TABLERO, 'en-curso', 'C');

      await store.mover(a.id, 'en-curso', 1);

      expect(titulos(columna(store, 'en-curso'))).toEqual(['B', 'A', 'C']);
    });

    it('renumera la columna de origen sin dejar huecos', async () => {
      const { store } = await montar();
      const a = await store.crear(TABLERO, 'por-hacer', 'A');
      await store.crear(TABLERO, 'por-hacer', 'B');
      await store.crear(TABLERO, 'por-hacer', 'C');

      await store.mover(a.id, 'hecho', 0);

      const origen = columna(store, 'por-hacer');

      expect(titulos(origen)).toEqual(['B', 'C']);
      expect(origen.map((t) => t.posicion)).toEqual([0, 1]);
    });

    it('recorta un índice fuera de rango en vez de romperse', async () => {
      const { store } = await montar();
      const a = await store.crear(TABLERO, 'por-hacer', 'A');
      await store.crear(TABLERO, 'hecho', 'B');

      await store.mover(a.id, 'hecho', 99);

      expect(titulos(columna(store, 'hecho'))).toEqual(['B', 'A']);
    });

    it('ignora un id que no existe', async () => {
      const { store } = await montar();
      await store.crear(TABLERO, 'por-hacer', 'A');

      await expect(store.mover('no-existe' as never, 'hecho', 0)).resolves.toBeUndefined();
      expect(store.tareas().length).toBe(1);
    });
  });

  describe('mover dentro de la misma columna', () => {
    it('reordena sin tocar las demás columnas', async () => {
      const { store } = await montar();
      const a = await store.crear(TABLERO, 'por-hacer', 'A');
      await store.crear(TABLERO, 'por-hacer', 'B');
      await store.crear(TABLERO, 'por-hacer', 'C');
      const otra = await store.crear(TABLERO, 'hecho', 'D');

      await store.mover(a.id, 'por-hacer', 2);

      const tareas = columna(store, 'por-hacer');

      expect(titulos(tareas)).toEqual(['B', 'C', 'A']);
      expect(tareas.map((t) => t.posicion)).toEqual([0, 1, 2]);
      expect(store.tareas().find((t) => t.id === otra.id)?.posicion).toBe(0);
    });

    it('subir a la primera posición funciona', async () => {
      const { store } = await montar();
      await store.crear(TABLERO, 'por-hacer', 'A');
      await store.crear(TABLERO, 'por-hacer', 'B');
      const c = await store.crear(TABLERO, 'por-hacer', 'C');

      await store.mover(c.id, 'por-hacer', 0);

      expect(titulos(columna(store, 'por-hacer'))).toEqual(['C', 'A', 'B']);
    });
  });

  describe('editar y eliminar', () => {
    it('edita solo los campos indicados', async () => {
      const { store } = await montar();
      const tarea = await store.crear(TABLERO, 'por-hacer', 'A', { descripcion: 'Original' });

      await store.editar(tarea.id, { titulo: 'A revisada' });

      const actualizada = store.tareas().find((t) => t.id === tarea.id);
      expect(actualizada?.titulo).toBe('A revisada');
      expect(actualizada?.descripcion).toBe('Original');
    });

    it('al eliminar renumera la columna', async () => {
      const { store } = await montar();
      const a = await store.crear(TABLERO, 'por-hacer', 'A');
      await store.crear(TABLERO, 'por-hacer', 'B');
      await store.crear(TABLERO, 'por-hacer', 'C');

      await store.eliminar(a.id);

      const tareas = columna(store, 'por-hacer');

      expect(titulos(tareas)).toEqual(['B', 'C']);
      expect(tareas.map((t) => t.posicion)).toEqual([0, 1]);
    });

    it('revierte el movimiento si el servidor rechaza la versión', async () => {
      const repositorio = new TaskRepositoryFalso();
      const { store } = await montar(repositorio);
      const a = await store.crear(TABLERO, 'por-hacer', 'A');
      repositorio.mover = () => Promise.reject(new Error('La tarjeta cambió en otra sesión'));

      await expect(store.mover(a.id, 'hecho', 0)).rejects.toThrow(/cambió/);

      expect(titulos(columna(store, 'por-hacer'))).toEqual(['A']);
      expect(titulos(columna(store, 'hecho'))).toEqual([]);
    });
  });

  it('recargar desde el repositorio recupera el orden guardado', async () => {
    const repositorio = new TaskRepositoryFalso();
    const { store } = await montar(repositorio);
    const a = await store.crear(TABLERO, 'por-hacer', 'A');
    await store.mover(a.id, 'hecho', 0);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: TaskRepository, useValue: repositorio }],
    });
    const recargado = TestBed.inject(TaskStore);
    await recargado.cargar(TABLERO);

    expect(titulos(columna(recargado, 'hecho'))).toEqual(['A']);
  });

  it('expone el estado de carga y termina en listo', async () => {
    const repositorio = new TaskRepositoryFalso();

    TestBed.configureTestingModule({
      providers: [{ provide: TaskRepository, useValue: repositorio }],
    });

    const store = TestBed.inject(TaskStore);
    const carga = store.cargar(TABLERO);

    expect(store.cargando()).toBe(true);

    await carga;

    expect(store.carga()).toBe('listo');
    expect(store.error()).toBeNull();
  });
});
