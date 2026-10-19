import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BoardStore } from '@entities/board';
import { MemberStore, comoMemberId } from '@entities/member';
import BoardListPage from './board-list';

/** Destino de mentira: aquí solo interesa que la navegación tenga a dónde ir. */
@Component({ template: '' })
class DestinoVacio {}

describe('BoardListPage', () => {
  async function montar(rol: 'admin' | 'editor' | 'viewer' = 'admin') {
    TestBed.configureTestingModule({
      imports: [BoardListPage],
      providers: [provideRouter([{ path: 'tableros/:id', component: DestinoVacio }])],
    });

    const equipo = TestBed.inject(MemberStore);
    const id = rol === 'admin' ? 'marta' : rol === 'editor' ? 'ivan' : 'alba';
    equipo.cambiarSesion(comoMemberId(id));

    const fixture = TestBed.createComponent(BoardListPage);
    const store = TestBed.inject(BoardStore);

    await store.listo;
    fixture.detectChanges();

    return { fixture, store, equipo, elemento: fixture.nativeElement as HTMLElement };
  }

  function botonNuevo(elemento: HTMLElement): HTMLButtonElement | null {
    const botones = Array.from(elemento.querySelectorAll('button'));
    return botones.find((boton) => boton.textContent?.includes('Nuevo tablero')) ?? null;
  }

  function dialogo(): HTMLElement | null {
    return document.querySelector('[role="dialog"]');
  }

  /** Escribe en el campo del diálogo como lo haría una persona. */
  function escribir(campo: HTMLInputElement, texto: string): void {
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
  }

  function enviarFormulario(): void {
    const formulario = dialogo()?.querySelector('form');

    formulario?.dispatchEvent(new Event('submit', { cancelable: true }));
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

  describe('crear un tablero desde el diálogo', () => {
    it('pide el nombre y lo crea con ese nombre', async () => {
      const { fixture, elemento, store } = await montar();

      botonNuevo(elemento)?.click();
      fixture.detectChanges();

      const campo = dialogo()?.querySelector('input') as HTMLInputElement;
      escribir(campo, 'Producto');
      fixture.detectChanges();
      enviarFormulario();
      fixture.detectChanges();

      expect(store.activos().map((board) => board.titulo)).toEqual(['Producto']);
      expect(elemento.textContent).toContain('Producto');
    });

    it('se cierra al crear y no deja el aviso de creación a medias', async () => {
      const { fixture, elemento } = await montar();

      botonNuevo(elemento)?.click();
      fixture.detectChanges();

      escribir(dialogo()?.querySelector('input') as HTMLInputElement, 'Producto');
      enviarFormulario();
      fixture.detectChanges();

      expect(dialogo()).toBeNull();
    });

    it('no crea nada sin nombre y lo explica en el campo', async () => {
      const { fixture, elemento, store } = await montar();

      botonNuevo(elemento)?.click();
      fixture.detectChanges();
      enviarFormulario();
      fixture.detectChanges();

      expect(store.activos().length).toBe(0);
      expect(dialogo()?.textContent).toContain('Ponle un nombre al tablero');
    });

    it('tampoco acepta solo espacios en blanco', async () => {
      const { fixture, elemento, store } = await montar();

      botonNuevo(elemento)?.click();
      fixture.detectChanges();

      escribir(dialogo()?.querySelector('input') as HTMLInputElement, '   ');
      enviarFormulario();
      fixture.detectChanges();

      expect(store.activos().length).toBe(0);
      expect(dialogo()).not.toBeNull();
    });
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

  it('cada tarjeta lleva al detalle de su tablero', async () => {
    const { fixture, store, elemento } = await montar();
    const board = store.crear('Producto');
    fixture.detectChanges();

    const enlace = elemento.querySelector('a.enlace-tablero') as HTMLAnchorElement;

    enlace.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe(`/tableros/${board.id}`);
  });
});
