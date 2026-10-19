import { TestBed } from '@angular/core/testing';
import { COLUMNAS_POR_DEFECTO, comoBoardId } from '@entities/board';
import type { Board } from '@entities/board';
import { MemberStore, comoMemberId } from '@entities/member';
import { TaskStore } from '@entities/task';
import { ToastService } from '@shared/ui';
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
  async function montar(tareas: readonly TareaDePrueba[] = [], rol: 'admin' | 'viewer' = 'admin') {
    TestBed.configureTestingModule({ imports: [BoardCanvas] });

    if (rol === 'viewer') {
      TestBed.inject(MemberStore).cambiarSesion(comoMemberId('alba'));
    }

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

  function botonAcciones(elemento: HTMLElement): HTMLButtonElement | null {
    return elemento.querySelector('button[aria-label^="Acciones de "]');
  }

  function abrirMenuDeLaTarjeta(elemento: HTMLElement): void {
    botonAcciones(elemento)?.click();
  }

  function opcionesDelMenu(): HTMLElement[] {
    return Array.from(document.querySelectorAll('[role="menuitem"]'));
  }

  function opcion(texto: string): HTMLElement | undefined {
    return opcionesDelMenu().find((nodo) => nodo.textContent?.trim() === texto);
  }

  function botonAnadir(elemento: HTMLElement, indiceColumna: number): HTMLButtonElement | null {
    return columna(elemento, indiceColumna).querySelector('button.anadir-tarjeta');
  }

  function dialogo(): HTMLElement | null {
    return document.querySelector('[role="dialog"]');
  }

  function campoDelDialogo(etiqueta: string): HTMLElement {
    const dialogoAbierto = dialogo() as HTMLElement;
    const label = Array.from(dialogoAbierto.querySelectorAll('label')).find((nodo) =>
      nodo.textContent?.includes(etiqueta),
    ) as HTMLLabelElement;

    return dialogoAbierto.querySelector(`#${CSS.escape(label.htmlFor)}`) as HTMLElement;
  }

  function escribir(control: HTMLElement, valor: string): void {
    control.setAttribute('value', valor);
    (control as HTMLInputElement).value = valor;
    control.dispatchEvent(new Event('input'));
  }

  function enviarFormulario(): void {
    dialogo()
      ?.querySelector('form')
      ?.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  function avisos(): string[] {
    return TestBed.inject(ToastService)
      .avisos()
      .map((aviso) => aviso.mensaje);
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

  it('cuenta en singular cuando solo hay una', async () => {
    const { elemento } = await montar([{ columna: 'por-hacer', titulo: 'Revisar el copy' }]);

    expect(contadorDe(columna(elemento, 0))).toBe('1 tarjeta');
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

  describe('el menú de la tarjeta', () => {
    it('ofrece editar y las demás columnas, y ninguna más', async () => {
      const { fixture, elemento } = await montar([
        { columna: 'por-hacer', titulo: 'Revisar el copy' },
      ]);

      abrirMenuDeLaTarjeta(elemento);
      fixture.detectChanges();

      expect(opcionesDelMenu().map((opcion) => opcion.textContent?.trim())).toEqual([
        'Editar tarjeta',
        'Mover a En curso',
        'Mover a Hecho',
      ]);
    });

    it('mover desde el menú cambia la tarjeta de columna', async () => {
      const { fixture, elemento } = await montar([
        { columna: 'por-hacer', titulo: 'Revisar el copy' },
      ]);

      abrirMenuDeLaTarjeta(elemento);
      fixture.detectChanges();
      opcion('Mover a En curso')!.click();
      fixture.detectChanges();

      expect(titulosDe(columna(elemento, 0))).toEqual([]);
      expect(titulosDe(columna(elemento, 1))).toEqual(['Revisar el copy']);
    });

    it('la tarjeta va al final de la columna de destino', async () => {
      const { fixture, elemento } = await montar([
        { columna: 'por-hacer', titulo: 'Revisar el copy' },
        { columna: 'en-curso', titulo: 'Migrar el buscador' },
      ]);

      abrirMenuDeLaTarjeta(elemento);
      fixture.detectChanges();
      opcion('Mover a En curso')!.click();
      fixture.detectChanges();

      expect(titulosDe(columna(elemento, 1))).toEqual(['Migrar el buscador', 'Revisar el copy']);
    });

    it('avisa de dónde fue la tarjeta, que es lo que oye quien no lo ve', async () => {
      const { fixture, elemento } = await montar([
        { columna: 'por-hacer', titulo: 'Revisar el copy' },
      ]);

      abrirMenuDeLaTarjeta(elemento);
      fixture.detectChanges();
      opcion('Mover a En curso')!.click();
      fixture.detectChanges();

      expect(avisos()).toContain('«Revisar el copy» a En curso');
    });
  });

  describe('crear una tarjeta', () => {
    it('abre el formulario desde la columna', async () => {
      const { fixture, elemento } = await montar();

      botonAnadir(elemento, 0)!.click();
      fixture.detectChanges();

      expect(dialogo()?.getAttribute('aria-label')).toBe('Nueva tarjeta en Por hacer');
      expect(dialogo()?.querySelector('form')).not.toBeNull();
    });

    it('la deja al final de su columna con el título escrito', async () => {
      const { fixture, elemento } = await montar([
        { columna: 'por-hacer', titulo: 'Revisar el copy' },
      ]);

      botonAnadir(elemento, 0)!.click();
      fixture.detectChanges();

      escribir(campoDelDialogo('Título'), 'Preparar la demo');
      enviarFormulario();
      fixture.detectChanges();

      expect(titulosDe(columna(elemento, 0))).toEqual(['Revisar el copy', 'Preparar la demo']);
      expect(dialogo()).toBeNull();
      expect(avisos()).toContain('«Preparar la demo» añadida');
    });

    it('no crea nada sin título y no cierra el diálogo', async () => {
      const { fixture, elemento, store } = await montar();

      botonAnadir(elemento, 0)!.click();
      fixture.detectChanges();
      enviarFormulario();
      fixture.detectChanges();

      expect(store.tareas()).toEqual([]);
      expect(dialogo()?.textContent).toContain('Escribe qué hay que hacer');
    });
  });

  describe('editar una tarjeta', () => {
    it('abre la tarjeta con sus datos y guarda el cambio', async () => {
      const { fixture, elemento, store } = await montar([
        {
          columna: 'en-curso',
          titulo: 'Revisar el copy',
          descripcion: 'Texto viejo',
          responsable: 'Marta Ruiz',
        },
      ]);

      abrirMenuDeLaTarjeta(elemento);
      fixture.detectChanges();
      opcion('Editar tarjeta')!.click();
      fixture.detectChanges();

      expect(dialogo()?.getAttribute('aria-label')).toBe('Editar tarjeta');
      expect((campoDelDialogo('Título') as HTMLInputElement).value).toBe('Revisar el copy');

      escribir(campoDelDialogo('Título'), 'Revisar el copy final');
      enviarFormulario();
      fixture.detectChanges();

      expect(titulosDe(columna(elemento, 1))).toEqual(['Revisar el copy final']);
      expect(avisos()).toContain('«Revisar el copy final» actualizada');
      // Lo que no se toca no se pisa.
      expect(store.tareas()[0]?.descripcion).toBe('Texto viejo');
      expect(store.tareas()[0]?.responsable).toBe('Marta Ruiz');
    });
  });

  describe('permisos en la interfaz', () => {
    it('quien solo observa no ve el menú, ni puede añadir ni arrastrar', async () => {
      const { elemento } = await montar(
        [{ columna: 'por-hacer', titulo: 'Revisar el copy' }],
        'viewer',
      );

      expect(botonAcciones(elemento)).toBeNull();
      expect(botonAnadir(elemento, 0)).toBeNull();
      expect(elemento.querySelectorAll('.cdk-drag-disabled').length).toBe(1);
      expect(elemento.querySelectorAll('.cdk-drop-list-disabled').length).toBe(3);
    });
  });
});
