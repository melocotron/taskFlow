import { TestBed } from '@angular/core/testing';
import { BoardStore } from '@entities/board';
import HomePage from './home';

describe('HomePage', () => {
  async function montar() {
    TestBed.configureTestingModule({ imports: [HomePage] });
    const fixture = TestBed.createComponent(HomePage);
    const store = TestBed.inject(BoardStore);

    await store.listo;
    fixture.detectChanges();

    return { fixture, store, elemento: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('presenta el nombre del producto', async () => {
    const { elemento } = await montar();

    expect(elemento.querySelector('h1')?.textContent).toContain('TaskFlow');
  });

  it('muestra el estado vacío cuando no hay tableros', async () => {
    const { elemento } = await montar();

    expect(elemento.textContent).toContain('Todavía no hay tableros');
  });

  it('pinta una tarjeta por tablero y cuenta sus columnas', async () => {
    const { fixture, store, elemento } = await montar();

    store.crear('Producto');
    fixture.detectChanges();

    expect(elemento.querySelectorAll('app-card').length).toBe(1);
    expect(elemento.textContent).toContain('Producto');
    expect(elemento.textContent).toContain('3 columnas');
  });

  it('crear desde la pantalla añade el tablero a la lista', async () => {
    const { fixture, elemento } = await montar();

    const boton = elemento.querySelector('button') as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();

    expect(elemento.querySelectorAll('app-card').length).toBe(1);
  });
});
