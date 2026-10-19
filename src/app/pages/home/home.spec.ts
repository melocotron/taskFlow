import { TestBed } from '@angular/core/testing';
import { BoardStore } from '@entities/board';
import { MemberStore, comoMemberId } from '@entities/member';
import HomePage from './home';

describe('HomePage', () => {
  async function montar(rol: 'admin' | 'editor' | 'viewer' = 'admin') {
    TestBed.configureTestingModule({ imports: [HomePage] });

    const equipo = TestBed.inject(MemberStore);
    const id = rol === 'admin' ? 'marta' : rol === 'editor' ? 'ivan' : 'alba';
    equipo.cambiarSesion(comoMemberId(id));

    const fixture = TestBed.createComponent(HomePage);
    const store = TestBed.inject(BoardStore);

    await store.listo;
    fixture.detectChanges();

    return { fixture, store, equipo, elemento: fixture.nativeElement as HTMLElement };
  }

  function botonNuevo(elemento: HTMLElement): HTMLButtonElement | null {
    const botones = Array.from(elemento.querySelectorAll('button'));
    return botones.find((boton) => boton.textContent?.includes('Nuevo tablero')) ?? null;
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('presenta el nombre del producto y a la persona de la sesión', async () => {
    const { elemento } = await montar();

    expect(elemento.querySelector('h1')?.textContent).toContain('TaskFlow');
    expect(elemento.textContent).toContain('Marta Ruiz');
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
    expect(elemento.textContent).toContain('3 columnas');
  });

  describe('permisos en la interfaz', () => {
    it('quien administra ve el botón de crear', async () => {
      const { elemento } = await montar('admin');

      expect(botonNuevo(elemento)).not.toBeNull();
    });

    it('quien solo observa no ve el botón de crear', async () => {
      const { elemento } = await montar('viewer');

      expect(botonNuevo(elemento)).toBeNull();
      expect(elemento.textContent).toContain('no crear tableros');
    });

    it('quien edita ve el botón aunque no pueda administrar', async () => {
      const { elemento } = await montar('editor');

      expect(botonNuevo(elemento)).not.toBeNull();
    });
  });
});
