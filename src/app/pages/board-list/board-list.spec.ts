import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BoardStore } from '@entities/board';
import { MemberStore, comoMemberId } from '@entities/member';
import type { MemberId } from '@entities/member';
import BoardListPage from './board-list';

const MARTA = comoMemberId('marta');
const ALBA = comoMemberId('alba');

/** Destino de mentira: aquí solo interesa que la navegación tenga a dónde ir. */
@Component({ template: '' })
class DestinoVacio {}

describe('BoardListPage', () => {
  async function montar(persona: MemberId = MARTA) {
    TestBed.configureTestingModule({
      imports: [BoardListPage],
      providers: [
        provideRouter([
          { path: 'tableros/:id', component: DestinoVacio },
          { path: 'entrar', component: DestinoVacio },
        ]),
      ],
    });

    const equipo = TestBed.inject(MemberStore);
    equipo.cambiarSesion(persona);

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

    expect(elemento.textContent).toContain('No tienes tableros todavía');
  });

  it('pinta una tarjeta por tablero, cuenta columnas y personas, y dice tu rol', async () => {
    const { fixture, store, elemento } = await montar();

    store.crear('Producto', MARTA);
    fixture.detectChanges();

    expect(elemento.querySelectorAll('app-card').length).toBe(1);
    expect(elemento.textContent).toContain('3 columnas · 1 persona');
    expect(elemento.textContent).toContain('Tu rol: Administración');
  });

  it('solo enseña los tableros a los que la persona tiene acceso', async () => {
    const { fixture, store, elemento } = await montar(ALBA);

    store.crear('Producto', MARTA);
    fixture.detectChanges();

    expect(elemento.querySelectorAll('app-card').length).toBe(0);
    expect(elemento.textContent).toContain('No tienes tableros todavía');
  });

  it('quien fue invitada ve el tablero con el rol que le dieron', async () => {
    const { fixture, store, elemento } = await montar(ALBA);
    const board = store.crear('Producto', MARTA);

    store.invitar(board.id, MARTA, ALBA, 'viewer');
    fixture.detectChanges();

    expect(elemento.querySelectorAll('app-card').length).toBe(1);
    expect(elemento.textContent).toContain('Tu rol: Solo lectura');
  });

  describe('crear un tablero desde el diálogo', () => {
    it('pide el nombre y lo crea con ese nombre y a la sesión como administradora', async () => {
      const { fixture, elemento, store } = await montar();

      botonNuevo(elemento)?.click();
      fixture.detectChanges();

      const campo = dialogo()?.querySelector('input') as HTMLInputElement;
      escribir(campo, 'Producto');
      fixture.detectChanges();
      enviarFormulario();
      fixture.detectChanges();

      expect(store.activos().map((board) => board.titulo)).toEqual(['Producto']);
      expect(store.activos()[0]?.miembros).toEqual([{ memberId: MARTA, rol: 'admin' }]);
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

  it('cualquier persona de la sesión puede crear su propio tablero', async () => {
    const { fixture, elemento, store } = await montar(ALBA);

    botonNuevo(elemento)?.click();
    fixture.detectChanges();

    escribir(dialogo()?.querySelector('input') as HTMLInputElement, 'Marketing');
    enviarFormulario();
    fixture.detectChanges();

    expect(store.activos()[0]?.miembros).toEqual([{ memberId: ALBA, rol: 'admin' }]);
    expect(elemento.textContent).toContain('Marketing');
  });

  it('cada tarjeta lleva al detalle de su tablero', async () => {
    const { fixture, store, elemento } = await montar();
    const board = store.crear('Producto', MARTA);
    fixture.detectChanges();

    const enlace = elemento.querySelector('a.enlace-tablero') as HTMLAnchorElement;

    enlace.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe(`/tableros/${board.id}`);
  });

  describe('el menú de sesión', () => {
    function abrirMenu(elemento: HTMLElement, fixture: { detectChanges(): void }) {
      const disparador = elemento.querySelector(
        'button[aria-haspopup="menu"]',
      ) as HTMLButtonElement;
      disparador.click();
      fixture.detectChanges();

      return Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLButtonElement[];
    }

    it('cambia de persona y la sesión queda guardada', async () => {
      const { fixture, equipo, elemento } = await montar();
      // El menú es del CDK y se abre en un overlay: hay que detectar cambios tras cada paso.
      const opciones = abrirMenu(elemento, fixture);
      const alba = opciones.find((opcion) => opcion.textContent?.includes('Alba Sanz'))!;

      alba.click();
      fixture.detectChanges();

      expect(equipo.sesion().nombre).toBe('Alba Sanz');
    });

    it('salir cierra la sesión y saca de la aplicación', async () => {
      const { fixture, equipo, elemento } = await montar();
      const opciones = abrirMenu(elemento, fixture);
      const salir = opciones.find((opcion) => opcion.textContent?.includes('Salir'))!;

      salir.click();
      await fixture.whenStable();

      expect(equipo.haySesion()).toBe(false);
      expect(TestBed.inject(Router).url).toBe('/entrar');
    });
  });
});
