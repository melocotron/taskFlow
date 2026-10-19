import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BoardStore } from '@entities/board';
import { MemberStore, comoMemberId } from '@entities/member';
import { TaskStore } from '@entities/task';
import BoardDetailPage from './board-detail';

describe('BoardDetailPage', () => {
  /** Con `crear` se monta un tablero de verdad; sin él, la ruta apunta a la nada. */
  async function montar(opciones: { crear?: string; rol?: 'admin' | 'viewer' } = {}) {
    TestBed.configureTestingModule({
      imports: [BoardDetailPage],
      providers: [provideRouter([])],
    });

    if (opciones.rol === 'viewer') {
      TestBed.inject(MemberStore).cambiarSesion(comoMemberId('alba'));
    }

    const store = TestBed.inject(BoardStore);
    await store.listo;
    const board = opciones.crear ? store.crear(opciones.crear) : null;

    // El lienzo pinta las columnas, pero sus tarjetas llegan con la carga del otro store.
    await TestBed.inject(TaskStore).listo;

    const fixture = TestBed.createComponent(BoardDetailPage);
    fixture.componentRef.setInput('id', board?.id ?? 'no-existe');
    fixture.detectChanges();

    return { fixture, store, elemento: fixture.nativeElement as HTMLElement };
  }

  function botonRenombrar(elemento: HTMLElement): HTMLButtonElement | null {
    const botones = Array.from(elemento.querySelectorAll('button'));

    return botones.find((boton) => boton.textContent?.trim() === 'Renombrar') ?? null;
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
});
