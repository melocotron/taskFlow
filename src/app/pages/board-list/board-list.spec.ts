import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@entities/auth';
import { BoardRepository, BoardStore, ImportadorLocal } from '@entities/board';
import type { Board, ResultadoImportacion } from '@entities/board';
import { MemberStore, comoMemberId } from '@entities/member';
import type { MemberId } from '@entities/member';
import { ToastService } from '@shared/ui';
import {
  ALBA as ALBA_MIEMBRO,
  BoardRepositoryFalso,
  IVAN,
  MARTA as MARTA_MIEMBRO,
  tablero,
} from '@testing/repositorios';
import BoardListPage from './board-list';

const MARTA = comoMemberId('marta');
const ALBA = comoMemberId('alba');

/** Destino de mentira: aquí solo interesa que la navegación tenga a dónde ir. */
@Component({ template: '' })
class DestinoVacio {}

describe('BoardListPage', () => {
  async function montar(
    persona: MemberId = MARTA,
    boards: readonly Board[] = [],
    conDatosLocales = false,
  ) {
    const auth = {
      salir: async () => undefined,
      usuario: () => null,
    };
    const creador =
      [MARTA_MIEMBRO, IVAN, ALBA_MIEMBRO].find((miembro) => miembro.memberId === persona) ??
      MARTA_MIEMBRO;
    const repositorio = new BoardRepositoryFalso(boards, creador);
    let importaciones = 0;
    const importador = {
      hayDatos: () => conDatosLocales,
      importar: async (): Promise<ResultadoImportacion> => {
        importaciones += 1;
        return {
          tablerosImportados: 1,
          tablerosOmitidos: 0,
          tareasImportadas: 3,
          tareasOmitidas: 0,
        };
      },
    };

    TestBed.configureTestingModule({
      imports: [BoardListPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: BoardRepository, useValue: repositorio },
        { provide: ImportadorLocal, useValue: importador },
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

    return {
      fixture,
      store,
      equipo,
      auth,
      importaciones: () => importaciones,
      elemento: fixture.nativeElement as HTMLElement,
    };
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

  async function enviarFormulario(fixture: {
    detectChanges(): void;
    whenStable(): Promise<unknown>;
  }): Promise<void> {
    const formulario = dialogo()?.querySelector('form');

    formulario?.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('presenta el nombre del producto y a la persona de la sesión', async () => {
    const { elemento } = await montar();

    expect(elemento.querySelector('h1')?.textContent).toContain('TaskFlow');
    expect(elemento.textContent).toContain('Marta Ruiz');
  });

  it('ofrece importar el trabajo local una sola vez', async () => {
    const { fixture, elemento, importaciones } = await montar(MARTA, [], true);

    expect(elemento.textContent).toContain('Encontramos trabajo guardado en este navegador');

    const importar = Array.from(elemento.querySelectorAll('button')).find((boton) =>
      boton.textContent?.includes('Importar mis datos'),
    );

    importar?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(importaciones()).toBe(1);
    expect(elemento.textContent).not.toContain('Encontramos trabajo guardado en este navegador');
    expect(
      TestBed.inject(ToastService)
        .avisos()
        .map((aviso) => aviso.mensaje),
    ).toContain('Importados 1 tablero y 3 tarjetas');
  });

  it('muestra el estado vacío cuando no hay tableros', async () => {
    const { elemento } = await montar();

    expect(elemento.textContent).toContain('No tienes tableros todavía');
  });

  it('pinta una tarjeta por tablero, cuenta columnas y personas, y dice tu rol', async () => {
    const { fixture, store, elemento } = await montar();

    await store.crear('Producto');
    fixture.detectChanges();

    expect(elemento.querySelectorAll('app-card').length).toBe(1);
    expect(elemento.textContent).toContain('3 columnas · 1 persona');
    expect(elemento.textContent).toContain('Tu rol: Administración');
  });

  it('solo enseña los tableros a los que la persona tiene acceso', async () => {
    const { fixture, elemento } = await montar(ALBA, [tablero({ miembros: [MARTA_MIEMBRO] })]);

    fixture.detectChanges();

    expect(elemento.querySelectorAll('app-card').length).toBe(0);
    expect(elemento.textContent).toContain('No tienes tableros todavía');
  });

  it('quien fue invitada ve el tablero con el rol que le dieron', async () => {
    const inicial = tablero({ miembros: [MARTA_MIEMBRO] });
    const { fixture, store, elemento } = await montar(ALBA, [inicial]);
    const board = store.buscar(inicial.id)!;

    await store.invitar(board.id, ALBA_MIEMBRO.email, 'viewer');
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
      await enviarFormulario(fixture);
      fixture.detectChanges();

      expect(store.activos().map((board) => board.titulo)).toEqual(['Producto']);
      expect(store.activos()[0]?.miembros).toEqual([MARTA_MIEMBRO]);
      expect(elemento.textContent).toContain('Producto');
    });

    it('se cierra al crear y no deja el aviso de creación a medias', async () => {
      const { fixture, elemento } = await montar();

      botonNuevo(elemento)?.click();
      fixture.detectChanges();

      escribir(dialogo()?.querySelector('input') as HTMLInputElement, 'Producto');
      await enviarFormulario(fixture);
      fixture.detectChanges();

      expect(dialogo()).toBeNull();
    });

    it('no crea nada sin nombre y lo explica en el campo', async () => {
      const { fixture, elemento, store } = await montar();

      botonNuevo(elemento)?.click();
      fixture.detectChanges();
      await enviarFormulario(fixture);
      fixture.detectChanges();

      expect(store.activos().length).toBe(0);
      expect(dialogo()?.textContent).toContain('Ponle un nombre al tablero');
    });

    it('tampoco acepta solo espacios en blanco', async () => {
      const { fixture, elemento, store } = await montar();

      botonNuevo(elemento)?.click();
      fixture.detectChanges();

      escribir(dialogo()?.querySelector('input') as HTMLInputElement, '   ');
      await enviarFormulario(fixture);
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
    await enviarFormulario(fixture);
    fixture.detectChanges();

    expect(store.activos()[0]?.miembros).toEqual([ALBA_MIEMBRO]);
    expect(elemento.textContent).toContain('Marketing');
  });

  it('cada tarjeta lleva al detalle de su tablero', async () => {
    const { fixture, store, elemento } = await montar();
    const board = await store.crear('Producto');
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

    it('ofrece cerrar sesión y no cambiar de identidad a mano', async () => {
      const { fixture, elemento } = await montar();
      // El menú es del CDK y se abre en un overlay: hay que detectar cambios tras cada paso.
      const opciones = abrirMenu(elemento, fixture);

      expect(opciones.map((opcion) => opcion.textContent?.trim())).toEqual(['Salir']);
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
