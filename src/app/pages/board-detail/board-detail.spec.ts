import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BoardStore } from '@entities/board';
import BoardDetailPage from './board-detail';

describe('BoardDetailPage', () => {
  /** Con `crear` se monta un tablero de verdad; sin él, la ruta apunta a la nada. */
  async function montar(opciones: { crear?: string } = {}) {
    TestBed.configureTestingModule({
      imports: [BoardDetailPage],
      providers: [provideRouter([])],
    });

    const store = TestBed.inject(BoardStore);
    await store.listo;
    const board = opciones.crear ? store.crear(opciones.crear) : null;

    const fixture = TestBed.createComponent(BoardDetailPage);
    fixture.componentRef.setInput('id', board?.id ?? 'no-existe');
    fixture.detectChanges();

    return { fixture, store, elemento: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('muestra el nombre del tablero y sus columnas', async () => {
    const { elemento } = await montar({ crear: 'Producto' });

    expect(elemento.querySelector('h1')?.textContent).toContain('Producto');
    expect(elemento.textContent).toContain('Por hacer');
    expect(elemento.textContent).toContain('Hecho');
  });

  it('avisa cuando el tablero no existe', async () => {
    const { elemento } = await montar();

    expect(elemento.textContent).toContain('No se encontró ese tablero');
  });
});
