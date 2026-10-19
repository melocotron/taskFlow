import { TestBed } from '@angular/core/testing';
import { COLUMNAS_POR_DEFECTO, comoBoardId } from '@entities/board';
import type { Board } from '@entities/board';
import { TaskStore } from '@entities/task';
import { BoardCanvas } from './board-canvas';

const TABLERO: Board = {
  id: comoBoardId('producto'),
  titulo: 'Producto',
  columnas: COLUMNAS_POR_DEFECTO,
  archivado: false,
  creadoEn: '2026-10-18T00:00:00.000Z',
};

interface TareaDePrueba {
  readonly columna: string;
  readonly titulo: string;
  readonly descripcion?: string;
  readonly responsable?: string;
}

describe('BoardCanvas', () => {
  async function montar(tareas: readonly TareaDePrueba[] = []) {
    TestBed.configureTestingModule({ imports: [BoardCanvas] });

    const store = TestBed.inject(TaskStore);
    await store.listo;

    for (const tarea of tareas) {
      store.crear(TABLERO.id, tarea.columna, tarea.titulo, {
        descripcion: tarea.descripcion,
        responsable: tarea.responsable ?? null,
      });
    }

    const fixture = TestBed.createComponent(BoardCanvas);
    fixture.componentRef.setInput('board', TABLERO);
    fixture.detectChanges();

    return { fixture, store, elemento: fixture.nativeElement as HTMLElement };
  }

  function columna(elemento: HTMLElement, indice: number): HTMLElement {
    return elemento.querySelectorAll('.columna')[indice] as HTMLElement;
  }

  function titulosDe(columna: HTMLElement): string[] {
    return Array.from(columna.querySelectorAll('.tarjeta-titulo')).map(
      (nodo) => nodo.textContent?.trim() ?? '',
    );
  }

  /** Texto del contador, con el espacio del texto oculto normalizado. */
  function contadorDe(columna: HTMLElement): string {
    return (columna.querySelector('.cuenta')?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('pinta las columnas en el orden del tablero', async () => {
    const { elemento } = await montar();

    const titulos = Array.from(elemento.querySelectorAll('h2')).map((nodo) =>
      nodo.textContent?.trim(),
    );

    expect(titulos).toEqual(['Por hacer', 'En curso', 'Hecho']);
  });

  it('coloca cada tarjeta en su columna', async () => {
    const { elemento } = await montar([
      { columna: 'por-hacer', titulo: 'Revisar el copy' },
      { columna: 'por-hacer', titulo: 'Preparar la demo' },
      { columna: 'hecho', titulo: 'Cerrar el sprint' },
    ]);

    expect(titulosDe(columna(elemento, 0))).toEqual(['Revisar el copy', 'Preparar la demo']);
    expect(titulosDe(columna(elemento, 1))).toEqual([]);
    expect(titulosDe(columna(elemento, 2))).toEqual(['Cerrar el sprint']);
  });

  it('cuenta las tarjetas de cada columna, también para quien no ve la pantalla', async () => {
    const { elemento } = await montar([
      { columna: 'por-hacer', titulo: 'Revisar el copy' },
      { columna: 'por-hacer', titulo: 'Preparar la demo' },
    ]);

    expect(contadorDe(columna(elemento, 0))).toBe('2 tarjetas');
    expect(contadorDe(columna(elemento, 1))).toBe('0 tarjetas');
  });

  it('avisa en la columna que no tiene nada', async () => {
    const { elemento } = await montar();

    expect(columna(elemento, 0).textContent).toContain('Sin tarjetas');
  });

  it('explica el tablero entero vacío una sola vez', async () => {
    const { elemento } = await montar();

    expect(elemento.textContent).toContain('Este tablero todavía no tiene tarjetas');
  });

  it('muestra a quien tiene la tarjeta, con su turno de color', async () => {
    const { elemento } = await montar([
      { columna: 'en-curso', titulo: 'Migrar el buscador', responsable: 'Marta Ruiz' },
    ]);

    const tarjeta = columna(elemento, 1).querySelector('.tarjeta-responsable') as HTMLElement;

    expect(tarjeta.textContent).toContain('Marta Ruiz');
    expect(tarjeta.textContent).toContain('MR');
  });

  it('no inventa responsable cuando la tarjeta no lo tiene', async () => {
    const { elemento } = await montar([{ columna: 'en-curso', titulo: 'Migrar el buscador' }]);

    expect(columna(elemento, 1).querySelector('.tarjeta-responsable')).toBeNull();
  });

  it('muestra la descripción de la tarjeta cuando la tiene', async () => {
    const { elemento } = await montar([
      {
        columna: 'por-hacer',
        titulo: 'Revisar el copy',
        descripcion: 'Una explicación larguísima que en la tarjeta no cabe ni de lejos.',
      },
    ]);

    const descripcion = columna(elemento, 0).querySelector('.tarjeta-descripcion') as HTMLElement;

    expect(descripcion.textContent).toContain('Una explicación larguísima');
  });
});
