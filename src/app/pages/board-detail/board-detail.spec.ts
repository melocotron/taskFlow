import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { BoardStore } from '@entities/board';
import { MemberStore, comoMemberId } from '@entities/member';
import { TaskStore } from '@entities/task';
import BoardDetailPage from './board-detail';

const MARTA = comoMemberId('marta');
const ALBA = comoMemberId('alba');

describe('BoardDetailPage', () => {
  /** Con `crear` se monta un tablero de verdad; sin él, la ruta apunta a la nada. */
  async function montar(
    opciones: {
      crear?: string;
      rol?: 'admin' | 'viewer' | 'ninguno';
      q?: string;
      persona?: string;
    } = {},
  ) {
    TestBed.configureTestingModule({
      imports: [BoardDetailPage],
      providers: [provideRouter([])],
    });

    const store = TestBed.inject(BoardStore);
    await store.listo;

    // El tablero siempre lo crea Marta; el rol decide qué hace la sesión con él.
    const board = opciones.crear ? store.crear(opciones.crear, MARTA) : null;

    if (board && opciones.rol === 'viewer') {
      store.invitar(board.id, MARTA, ALBA, 'viewer');
    }

    if (opciones.rol === 'viewer' || opciones.rol === 'ninguno') {
      TestBed.inject(MemberStore).cambiarSesion(ALBA);
    }

    // El lienzo pinta las columnas, pero sus tarjetas llegan con la carga del otro store.
    const tareas = TestBed.inject(TaskStore);
    await tareas.listo;

    const fixture = TestBed.createComponent(BoardDetailPage);
    fixture.componentRef.setInput('id', board?.id ?? 'no-existe');
    fixture.componentRef.setInput('q', opciones.q ?? '');
    fixture.componentRef.setInput('persona', opciones.persona ?? '');
    fixture.detectChanges();

    return { fixture, store, tareas, elemento: fixture.nativeElement as HTMLElement };
  }

  function botonRenombrar(elemento: HTMLElement): HTMLButtonElement | null {
    const botones = Array.from(elemento.querySelectorAll('button'));

    return botones.find((boton) => boton.textContent?.trim() === 'Renombrar') ?? null;
  }

  function botonPersonas(elemento: HTMLElement): HTMLButtonElement | null {
    const botones = Array.from(elemento.querySelectorAll('button'));

    return botones.find((boton) => boton.textContent?.includes('Personas')) ?? null;
  }

  function dialogo(): HTMLElement | null {
    return document.querySelector('[role="dialog"]');
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('muestra el nombre del tablero y sus columnas', async () => {
    const { elemento } = await montar({ crear: 'Producto' });

    expect(elemento.querySelector('h1')?.textContent).toContain('Producto');
    expect(elemento.textContent).toContain('Por hacer');
    expect(elemento.textContent).toContain('Hecho');
    expect(elemento.querySelectorAll('.columna').length).toBe(3);
  });

  it('avisa cuando el tablero no existe', async () => {
    const { elemento } = await montar();

    expect(elemento.textContent).toContain('No se encontró ese tablero');
  });

  it('quien no es miembro no entra ni por URL directa', async () => {
    const { elemento } = await montar({ crear: 'Producto', rol: 'ninguno' });

    expect(elemento.textContent).toContain('No tienes acceso a este tablero');
    expect(elemento.querySelectorAll('.columna').length).toBe(0);
    expect(elemento.querySelector('h1')).toBeNull();
  });

  it('quien observa ve el trabajo y las personas, pero no las acciones de edición', async () => {
    const { elemento } = await montar({ crear: 'Producto', rol: 'viewer' });

    expect(elemento.querySelector('h1')?.textContent).toContain('Producto');
    expect(elemento.querySelectorAll('.columna').length).toBe(3);
    expect(botonRenombrar(elemento)).toBeNull();
    expect(botonPersonas(elemento)?.textContent).toContain('Personas (2)');
    expect(elemento.textContent).not.toContain('Añadir tarjeta');
  });

  it('abre el panel de personas desde el encabezado', async () => {
    const { fixture, elemento } = await montar({ crear: 'Producto' });

    botonPersonas(elemento)!.click();
    fixture.detectChanges();

    expect(dialogo()?.getAttribute('aria-label')).toBe('Personas del tablero');
    expect(dialogo()?.textContent).toContain('Marta Ruiz');
    expect(dialogo()?.textContent).toContain('Administración');
  });

  describe('renombrar el tablero', () => {
    it('abre el diálogo con el nombre actual', async () => {
      const { fixture, elemento } = await montar({ crear: 'Producto' });

      botonRenombrar(elemento)!.click();
      fixture.detectChanges();

      expect(dialogo()?.getAttribute('aria-label')).toBe('Renombrar tablero');
      expect((dialogo()?.querySelector('input') as HTMLInputElement).value).toBe('Producto');
    });

    it('guarda el nombre nuevo y lo pinta en el encabezado', async () => {
      const { fixture, store, elemento } = await montar({ crear: 'Producto' });
      const board = store.activos()[0]!;

      botonRenombrar(elemento)!.click();
      fixture.detectChanges();

      const input = dialogo()?.querySelector('input') as HTMLInputElement;
      input.value = 'Producto digital';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      dialogo()?.querySelector('form')?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(elemento.querySelector('h1')?.textContent).toContain('Producto digital');
      expect(store.buscar(board.id)?.titulo).toBe('Producto digital');
      expect(dialogo()).toBeNull();
    });

    it('no renombra a vacío y deja el diálogo abierto', async () => {
      const { fixture, store, elemento } = await montar({ crear: 'Producto' });
      const board = store.activos()[0]!;

      botonRenombrar(elemento)!.click();
      fixture.detectChanges();

      const input = dialogo()?.querySelector('input') as HTMLInputElement;
      input.value = '';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      dialogo()?.querySelector('form')?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(dialogo()?.textContent).toContain('Ponle un nombre al tablero');
      expect(store.buscar(board.id)?.titulo).toBe('Producto');
    });
  });

  it('quien solo observa no ve el botón de renombrar', async () => {
    const { elemento } = await montar({ crear: 'Producto', rol: 'viewer' });

    expect(botonRenombrar(elemento)).toBeNull();
  });

  describe('el filtro vive en la URL', () => {
    function campoBuscar(elemento: HTMLElement): HTMLInputElement {
      return elemento.querySelector('app-board-filters input') as HTMLInputElement;
    }

    function botonLimpiar(elemento: HTMLElement): HTMLButtonElement | null {
      const botones = Array.from(elemento.querySelectorAll('button'));

      return botones.find((boton) => boton.textContent?.trim() === 'Quitar filtro') ?? null;
    }

    it('siembra el filtro desde los query params', async () => {
      const { fixture, store, tareas, elemento } = await montar({ crear: 'Producto', q: 'copy' });
      const board = store.activos()[0]!;

      tareas.crear(board.id, 'por-hacer', 'Revisar el copy');
      tareas.crear(board.id, 'por-hacer', 'Preparar la demo');
      fixture.detectChanges();

      expect(campoBuscar(elemento).value).toBe('copy');

      const titulos = Array.from(elemento.querySelectorAll('.tarjeta-titulo')).map((nodo) =>
        nodo.textContent?.trim(),
      );

      expect(titulos).toEqual(['Revisar el copy']);
      expect(elemento.textContent).toContain('1 de 2 tarjetas');
    });

    it('escribe el texto en la URL al buscar', async () => {
      const { fixture, elemento } = await montar({ crear: 'Producto' });

      const campo = campoBuscar(elemento);
      campo.value = 'copy';
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      await vi.waitFor(() => expect(TestBed.inject(Router).url).toContain('q=copy'));
    });

    it('quitar el filtro deja la URL sin parámetros', async () => {
      const { fixture, elemento } = await montar({ crear: 'Producto', q: 'copy' });

      botonLimpiar(elemento)!.click();
      fixture.detectChanges();

      await vi.waitFor(() => expect(TestBed.inject(Router).url).not.toContain('q='));
      expect(campoBuscar(elemento).value).toBe('');
    });
  });
});
